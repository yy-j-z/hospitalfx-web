package com.hospitalfx.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospitalfx.backend.dto.AiResponse;
import com.hospitalfx.backend.dto.AgentChatRequest;
import com.hospitalfx.backend.dto.AgentChatResponse;
import com.hospitalfx.backend.model.DoctorProfile;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiService {

    private static final String DEFAULT_RISK = "以上内容仅作辅助参考，最终仍需结合线下面诊和检查结果。";

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(15))
        .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${deepseek.api-key:}")
    private String apiKey;

    @Value("${deepseek.base-url}")
    private String baseUrl;

    @Value("${deepseek.model}")
    private String model;

    public AgentChatResponse agentChat(AgentChatRequest request) {
        if (!hasApiKey()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "DeepSeek API key not configured");
        }

        String agentName = blankToDefault(request.agentName(), "当前页面智能体");
        String roleLabel = blankToDefault(request.roleLabel(), "当前角色");
        String pageLabel = blankToDefault(request.pageLabel(), "当前页面");
        String pageSummary = blankToDefault(request.pageSummary(), "当前页面已加载相关业务数据。");
        String scope = blankToDefault(request.scope(), "仅回答与当前页面职责相关的问题。");
        String prompt = safe(request.prompt()).trim();

        if (prompt.isBlank()) {
            return new AgentChatResponse("请先输入具体问题，我会只围绕当前页面职责进行回答。");
        }

        if (containsAny(prompt, "你能回答什么", "你可以回答什么", "你负责什么", "你能做什么", "你是干什么的")) {
            return new AgentChatResponse("我当前只负责这一个页面的相关问题。具体来说，" + scope + " 你可以直接告诉我你的具体需求，我会结合当前页面内容继续回答。");
        }

        List<Map<String, String>> messages = new java.util.ArrayList<>();
        messages.add(Map.of(
            "role", "system",
            "content", """
                你是医院信息系统中的页面级智能体。
                你的名字是：%s。
                你服务的角色是：%s。
                你当前负责的页面是：%s。

                你的职责边界：
                %s

                当前页面业务摘要：
                %s

                回答规则：
                1. 只使用简体中文回答。
                2. 语气专业、自然、简洁，避免模板化口号。
                3. 优先结合当前页面摘要和用户问题作答，不要假装自己看到了不存在的数据。
                4. 如果问题超出当前页面职责范围，必须明确拒答，并说明你当前只负责什么。
                5. 不要回答天气、股票、娱乐、编程作业等无关问题。
                6. 不要输出 JSON，不要输出 markdown 代码块。
                7. 如果涉及医疗风险，必须提醒以线下医生判断为准。
                8. 如果用户是在询问“你能回答什么/你负责什么/你能做什么”，应直接概括你的职责范围，不要说无法识别。
                """.formatted(agentName, roleLabel, pageLabel, scope, pageSummary)
        ));

        if (request.history() != null) {
            request.history().stream()
                .filter(item -> item != null && ("user".equals(item.role()) || "assistant".equals(item.role())))
                .map(item -> Map.of(
                    "role", item.role(),
                    "content", blankToDefault(item.content(), "")
                ))
                .filter(item -> !item.get("content").isBlank())
                .limit(8)
                .forEach(messages::add);
        }

        messages.add(Map.of("role", "user", "content", prompt));
        return new AgentChatResponse(chat(messages).trim());
    }

    public AiResponse registrationAdvice(
        String patientName,
        String gender,
        String age,
        String symptomSummary,
        List<DoctorProfile> doctors
    ) {
        AiResponse fallback = fallbackRegistrationAdvice(symptomSummary, doctors);
        if (!hasApiKey()) {
            return fallback;
        }

        String doctorText = doctors.stream()
            .filter(doctor -> Boolean.TRUE.equals(doctor.getEnabled()))
            .map(doctor -> "%s / %s / %s / 挂号费%s".formatted(
                safe(doctor.getRealName()),
                safe(doctor.getDeptName()),
                safe(doctor.getRegistLevel()),
                formatMoney(doctor.getRegistFee())
            ))
            .reduce("", (left, right) -> left + "\n- " + right)
            .trim();

        String systemPrompt = """
            你是医院挂号分诊 AI 助手。
            你必须只用简体中文回答，并且只返回一个合法 JSON 对象，不要 markdown，不要额外解释。
            固定返回：
            {"primary":"","secondary":"","tertiary":"","risk":""}

            字段要求：
            primary：推荐科室。
            secondary：推荐医生，没有合适医生时就写“建议到该科室分诊台现场分诊”。
            tertiary：现在先做什么，包括是否尽快就诊、何时来院。
            risk：风险提醒或补充说明。

            输出要简洁、明确、适合窗口人员直接转述给患者。
            """;

        String userPrompt = """
            患者姓名：%s
            性别：%s
            年龄：%s
            症状描述：%s
            可选医生列表：
            %s
            """.formatted(
            safe(patientName),
            safe(gender),
            safe(age),
            safe(symptomSummary),
            doctorText.isBlank() ? "- 当前没有可用医生信息" : doctorText
        );

        return requestRealAi(
            systemPrompt,
            userPrompt,
            fallback,
            new String[]{"推荐科室", "建议科室", "科室"},
            new String[]{"推荐医生", "建议医生", "医生"},
            new String[]{"现在先做什么", "建议时间", "建议", "就诊建议"},
            new String[]{"风险提醒", "注意事项", "补充说明"}
        );
    }

    public AiResponse patientAdvice(String patientName, String gender, String age, String symptomSummary) {
        AiResponse fallback = fallbackPatientAdvice(symptomSummary);
        if (!hasApiKey()) {
            return fallback;
        }

        String systemPrompt = """
            你是医院患者端的 AI 自助问诊助手。
            你必须只用简体中文回答，并且必须只返回一个合法 JSON 对象，不要 markdown，不要代码块，不要额外解释。
            固定返回这 4 个字段：
            {"primary":"","secondary":"","tertiary":"","risk":""}

            这 4 个字段的含义必须严格对应：
            primary：先判断问题类型。只能做方向性判断，不要下最终诊断。
            secondary：现在先做什么。给出当前最实际的处理建议。
            tertiary：要不要挂号。必须明确说现在要挂号、可以先观察、还是暂时不用挂号，并给一个短原因。
            risk：挂什么科。需要挂号时给出最合适科室；暂时不用挂号时也要给出“如加重可挂全科/内科”这种明确说法。

            输出要求：
            1. 四个字段都必须有内容，不能留空。
            2. 每个字段控制在 1 到 2 句话。
            3. 不要把四步内容混成一大段对白。
            4. 不要重复字段名，不要写空泛套话。
            5. 如果描述里有熬夜、失眠、压力大、情绪低落、焦虑这些内容，要优先判断为作息/情绪/心理相关问题，不要硬套成器质性疾病。
            6. 如果出现胸痛、呼吸困难、持续高热、昏厥、抽搐、自伤自杀想法等危险信号，secondary 和 tertiary 要明确写尽快线下就医，risk 要给急诊或相应专科。

            示例风格：
            {"primary":"更像是作息紊乱伴随轻度情绪压力，并不一定是明确疾病。","secondary":"现在先补觉、减少继续熬夜，今天尽量休息并观察头晕和睡眠是否缓解。","tertiary":"如果只是最近几天熬夜后出现，可以先观察；如果连续一两周都睡不好或越来越难受，建议挂号。","risk":"优先考虑全科门诊，必要时再转精神心理门诊。"}
            """;

        String userPrompt = """
            患者姓名：%s
            性别：%s
            年龄：%s
            症状描述：%s
            请严格按四步式 JSON 返回。
            """.formatted(safe(patientName), safe(gender), safe(age), safe(symptomSummary));

        return requestRealAi(
            systemPrompt,
            userPrompt,
            fallback,
            new String[]{"问题类型", "先判断问题类型", "初步判断", "可能情况", "参考判断"},
            new String[]{"现在先做什么", "处理建议", "行动建议", "建议怎么做", "建议"},
            new String[]{"要不要挂号", "是否需要挂号", "是否就医", "挂号建议"},
            new String[]{"挂什么科", "建议科室", "科室", "建议挂号科室"}
        );
    }

    public AiResponse doctorMedicationAdvice(
        String patientName,
        String gender,
        String age,
        String currentDiagnosis,
        String symptomSummary
    ) {
        AiResponse fallback = fallbackDoctorMedicationAdvice(currentDiagnosis, symptomSummary, age, gender);
        if (!hasApiKey()) {
            return fallback;
        }

        String systemPrompt = """
            你是医院医生端的 AI 用药参考助手。
            你必须只用简体中文回答，并且只返回一个合法 JSON 对象，不要 markdown，不要额外解释。
            固定返回：
            {"primary":"","secondary":"","tertiary":"","risk":""}

            字段要求：
            primary：参考诊断方向。
            secondary：建议药方或处理方向。
            tertiary：用药说明和注意事项。
            risk：风险提醒。

            内容只能作为医生参考，不能替代最终处方决策。
            """;

        String userPrompt = """
            患者姓名：%s
            性别：%s
            年龄：%s
            当前诊断：%s
            症状描述：%s
            """.formatted(
            safe(patientName),
            safe(gender),
            safe(age),
            safe(currentDiagnosis),
            safe(symptomSummary)
        );

        return requestRealAi(
            systemPrompt,
            userPrompt,
            fallback,
            new String[]{"参考诊断", "诊断", "初步诊断"},
            new String[]{"建议药方", "建议用药", "药方", "处理方向"},
            new String[]{"用药说明", "注意事项", "说明"},
            new String[]{"风险提醒", "风险", "警示"}
        );
    }

    private AiResponse requestRealAi(
        String systemPrompt,
        String userPrompt,
        AiResponse fallback,
        String[] primaryAliases,
        String[] secondaryAliases,
        String[] tertiaryAliases,
        String[] riskAliases
    ) {
        try {
            String content = chat(systemPrompt, userPrompt);
            AiResponse parsed = parseStructuredResponse(content, primaryAliases, secondaryAliases, tertiaryAliases, riskAliases);
            return hasUsefulFields(parsed) ? parsed : fallback;
        } catch (RuntimeException error) {
            return fallback;
        }
    }

    private AiResponse parseStructuredResponse(
        String content,
        String[] primaryAliases,
        String[] secondaryAliases,
        String[] tertiaryAliases,
        String[] riskAliases
    ) {
        String cleaned = stripCodeFence(safe(content)).trim();
        String primary = firstNonBlank(
            extractJsonField(cleaned, "primary"),
            extractLabeledField(cleaned, primaryAliases)
        );
        String secondary = firstNonBlank(
            extractJsonField(cleaned, "secondary"),
            extractLabeledField(cleaned, secondaryAliases)
        );
        String tertiary = firstNonBlank(
            extractJsonField(cleaned, "tertiary"),
            extractLabeledField(cleaned, tertiaryAliases)
        );
        String risk = firstNonBlank(
            extractJsonField(cleaned, "risk"),
            extractLabeledField(cleaned, riskAliases)
        );

        if (isBlank(primary) && isBlank(secondary) && isBlank(tertiary) && isBlank(risk)) {
            List<String> lines = cleaned.lines()
                .map(this::cleanModelField)
                .filter(line -> !line.isBlank())
                .toList();
            primary = lines.size() > 0 ? lines.get(0) : "";
            secondary = lines.size() > 1 ? lines.get(1) : "";
            tertiary = lines.size() > 2 ? lines.get(2) : "";
            risk = lines.size() > 3 ? lines.get(3) : "";
        }

        return buildResponse(primary, secondary, tertiary, risk, cleaned);
    }

    private String extractJsonField(String content, String key) {
        if (isBlank(content)) {
            return "";
        }

        try {
            JsonNode node = objectMapper.readTree(content);
            JsonNode value = node.get(key);
            if (value == null || value.isNull()) {
                return "";
            }
            return cleanModelField(value.asText());
        } catch (IOException ignored) {
            Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"")
                .matcher(content);
            if (matcher.find()) {
                return cleanModelField(unescape(matcher.group(1)));
            }
            return "";
        }
    }

    private String extractLabeledField(String content, String[] aliases) {
        for (String alias : aliases) {
            Pattern pattern = Pattern.compile(
                "(?ims)(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\d+[.、]\\s*)?" + Pattern.quote(alias)
                    + "\\s*[:：]\\s*(.+?)(?=\\n\\s*(?:[-*]\\s*)?(?:\\d+[.、]\\s*)?(?:"
                    + joinAliases(aliases) + "|问题类型|先判断问题类型|现在先做什么|要不要挂号|挂什么科|推荐科室|推荐医生|风险提醒|参考诊断|建议药方|用药说明)\\s*[:：]|$)"
            );
            Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                return cleanModelField(matcher.group(1));
            }
        }
        return "";
    }

    private String joinAliases(String[] aliases) {
        StringBuilder builder = new StringBuilder();
        for (int index = 0; index < aliases.length; index += 1) {
            if (index > 0) {
                builder.append("|");
            }
            builder.append(Pattern.quote(aliases[index]));
        }
        return builder.toString();
    }

    private AiResponse fallbackRegistrationAdvice(String symptomSummary, List<DoctorProfile> doctors) {
        String normalized = normalize(symptomSummary);
        String deptName = "全科门诊";
        String doctorAdvice = pickDoctorName(doctors, deptName);
        String action = "建议今天到院分诊，先由门诊医生做初步判断。";
        String risk = buildRiskAdvice(normalized);

        if (containsAny(normalized, "咳", "发热", "低热", "鼻塞", "流涕", "呼吸")) {
            deptName = "内科";
            doctorAdvice = pickDoctorName(doctors, deptName);
            action = "先注意休息和补水，如今天症状明显或加重，建议当天挂号。";
        } else if (containsAny(normalized, "胃", "腹", "反酸", "恶心", "呕吐", "腹泻")) {
            deptName = "内科";
            doctorAdvice = pickDoctorName(doctors, deptName);
            action = "先清淡饮食，若腹痛或呕吐明显，建议尽快到院。";
        } else if (containsAny(normalized, "皮", "痒", "疹", "过敏")) {
            deptName = "皮肤科";
            doctorAdvice = pickDoctorName(doctors, deptName);
            action = "避免抓挠和继续接触可疑过敏源，建议近一两天内挂号。";
        } else if (containsAny(normalized, "耳", "鼻", "喉", "咽")) {
            deptName = "耳鼻喉科";
            doctorAdvice = pickDoctorName(doctors, deptName);
            action = "如果咽痛、鼻塞或耳部不适明显，建议今天或明天就诊。";
        } else if (containsAny(normalized, "膝", "腰", "扭伤", "关节", "骨")) {
            deptName = "骨科";
            doctorAdvice = pickDoctorName(doctors, deptName);
            action = "先减少活动并避免负重，如影响行走建议尽快挂号。";
        } else if (containsAny(normalized, "月经", "白带", "下腹")) {
            deptName = "妇科";
            doctorAdvice = pickDoctorName(doctors, deptName);
            action = "建议近一两天内到院，由专科进一步评估。";
        } else if (containsAny(normalized, "儿童", "小孩", "宝宝")) {
            deptName = "儿科";
            doctorAdvice = pickDoctorName(doctors, deptName);
            action = "儿童症状变化较快，建议当天就诊。";
        }

        return buildResponse(deptName, doctorAdvice, action, risk, "");
    }

    private AiResponse fallbackPatientAdvice(String symptomSummary) {
        String normalized = normalize(symptomSummary);
        String issueType = "暂时还不能明确归类，更适合先观察症状变化。";
        String action = "先补充症状持续时间、有没有发热或明显疼痛；如果只是轻微不适，可以先休息并继续观察。";
        String registrationAdvice = "如果症状持续不缓解，建议挂号做初步评估。";
        String departmentAdvice = "可先考虑全科门诊。";

        if (containsAny(normalized, "胸痛", "胸闷", "呼吸困难", "晕厥", "抽搐")) {
            issueType = "存在需要尽快排查的急性风险信号。";
            action = "现在不要继续观察等待，建议尽快线下就医或前往急诊。";
            registrationAdvice = "需要尽快就医，不建议再拖。";
            departmentAdvice = "建议急诊或内科先评估。";
        } else if (containsAny(normalized, "自伤", "自杀", "不想活", "活着没意思")) {
            issueType = "已经出现明显心理危机信号。";
            action = "现在不要一个人扛着，立刻联系家人朋友陪同，并尽快线下求助。";
            registrationAdvice = "需要尽快就医，不建议再等待。";
            departmentAdvice = "建议急诊或精神心理专科。";
        } else if (containsAny(normalized, "熬夜", "失眠", "睡不好", "睡不着", "作息乱")) {
            issueType = "更像是作息紊乱或睡眠不足引起的不适。";
            action = "现在先补觉、减少继续熬夜，今天尽量休息并观察头晕、乏力或心烦是否缓解。";
            registrationAdvice = "如果只是最近几天熬夜后出现，可以先观察；如果连续一两周都睡不好或越来越难受，建议挂号。";
            departmentAdvice = "优先考虑全科门诊，必要时再转精神心理门诊。";
        } else if (containsAny(normalized, "焦虑", "烦躁", "难过", "情绪低落", "压力大", "不开心")) {
            issueType = "更像是情绪压力过大或心理状态需要关注。";
            action = "现在先休息、减少继续熬夜，并尽量找可信任的人聊一聊，别让自己一直处在高压状态。";
            registrationAdvice = "如果只是短期压力可以先调整；如果持续两周以上或已经影响睡眠、吃饭和工作学习，建议挂号。";
            departmentAdvice = "优先考虑全科门诊，必要时再转精神心理门诊。";
        } else if (containsAny(normalized, "咳", "发热", "低热", "鼻塞", "流涕", "喉咙")) {
            issueType = "更像是呼吸道不适或感冒样问题。";
            action = "现在先休息、多喝水并观察体温，今天尽量别继续熬夜。";
            registrationAdvice = "轻度不适可以先观察；如果高热不退、咳嗽明显加重或出现气促，建议尽快挂号。";
            departmentAdvice = "建议内科。";
        } else if (containsAny(normalized, "胃", "腹", "反酸", "恶心", "呕吐", "腹泻")) {
            issueType = "更像是消化系统不适。";
            action = "现在先清淡饮食，少量多次喝水，暂时避免辛辣、油腻和酒精。";
            registrationAdvice = "如果腹痛明显、持续呕吐或腹泻加重，建议尽快挂号；轻度不适可以先短时间观察。";
            departmentAdvice = "建议内科。";
        } else if (containsAny(normalized, "皮", "痒", "疹", "过敏")) {
            issueType = "更像是皮肤过敏或皮炎方向的问题。";
            action = "现在先停用可疑刺激物，避免抓挠，并观察皮疹是否继续扩大。";
            registrationAdvice = "如果范围扩大、反复不退或伴发热，建议挂号。";
            departmentAdvice = "建议皮肤科。";
        } else if (containsAny(normalized, "耳", "鼻", "喉", "咽")) {
            issueType = "更像是耳鼻喉相关不适。";
            action = "现在先注意休息和补水，避免继续刺激咽喉或受凉。";
            registrationAdvice = "如果疼痛明显、反复发作或影响吞咽，建议挂号。";
            departmentAdvice = "建议耳鼻喉科。";
        } else if (containsAny(normalized, "膝", "腰", "扭伤", "关节", "骨")) {
            issueType = "更像是外伤或骨关节方面的问题。";
            action = "现在先减少活动、避免负重，必要时局部冷敷。";
            registrationAdvice = "如果肿痛明显、影响行走或怀疑骨折，建议尽快挂号。";
            departmentAdvice = "建议骨科。";
        }

        return buildResponse(issueType, action, registrationAdvice, departmentAdvice, "");
    }

    private AiResponse fallbackDoctorMedicationAdvice(String currentDiagnosis, String symptomSummary, String age, String gender) {
        String normalized = normalize(currentDiagnosis + " " + symptomSummary);
        String diagnosis = safe(currentDiagnosis).isBlank() ? "待结合面诊进一步完善诊断" : safe(currentDiagnosis);
        String medication = "请结合过敏史、既往病史、肝肾功能和检查结果，由医生最终决定是否用药。";
        String usage = "建议先核对禁忌证和特殊人群风险，再决定是否开具处方。";

        if (containsAny(normalized, "咳", "发热", "低热", "喉咙", "鼻塞", "流涕")) {
            diagnosis = safe(currentDiagnosis).isBlank() ? "上呼吸道感染或咽炎方向" : diagnosis;
            medication = "可优先考虑对症处理方案，如退热、缓解咽痛、止咳化痰等，再决定是否需要进一步用药。";
            usage = "避免重复使用同类退热药；是否需要抗菌药应由医生结合面诊后决定。";
        } else if (containsAny(normalized, "胃", "腹", "反酸", "恶心", "呕吐", "腹泻")) {
            diagnosis = safe(currentDiagnosis).isBlank() ? "胃炎或消化系统不适方向" : diagnosis;
            medication = "可参考抑酸、胃黏膜保护、止吐或补液等对症处理方案。";
            usage = "若腹痛定位明确、反跳痛明显或持续呕吐，不应仅依赖常规口服药处理。";
        } else if (containsAny(normalized, "皮", "痒", "疹", "过敏")) {
            diagnosis = safe(currentDiagnosis).isBlank() ? "过敏性皮炎或皮疹方向" : diagnosis;
            medication = "可参考抗组胺药联合外用止痒或消炎方案，是否用激素需结合皮损范围判断。";
            usage = "建议先排除药疹、感染性皮疹和严重过敏反应，再决定处方强度。";
        } else if (containsAny(normalized, "膝", "腰", "扭伤", "关节", "骨")) {
            diagnosis = safe(currentDiagnosis).isBlank() ? "软组织损伤或关节疼痛方向" : diagnosis;
            medication = "可参考短期镇痛抗炎方案，并结合制动、冷敷或理疗建议。";
            usage = "老年患者、胃病或肾功能异常患者使用非甾体抗炎药前需谨慎评估。";
        }

        if (containsAny(normalize(gender), "女") && containsAny(normalized, "月经", "下腹")) {
            usage = usage + " 女性特殊生理期可能影响处方选择，建议再次确认。";
        }
        if (parseAge(age) > 65) {
            usage = usage + " 老年患者需注意剂量下调和并发症风险。";
        }

        return buildResponse(diagnosis, medication, usage, buildRiskAdvice(normalized), "");
    }

    private String pickDoctorName(List<DoctorProfile> doctors, String deptName) {
        return doctors.stream()
            .filter(doctor -> Boolean.TRUE.equals(doctor.getEnabled()))
            .filter(doctor -> safe(doctor.getDeptName()).contains(deptName))
            .findFirst()
            .map(doctor -> doctor.getRealName() + " / " + safe(doctor.getRegistLevel()))
            .or(() -> doctors.stream()
                .filter(doctor -> Boolean.TRUE.equals(doctor.getEnabled()))
                .findFirst()
                .map(doctor -> doctor.getRealName() + " / " + safe(doctor.getDeptName())))
            .orElse("建议到该科室分诊台现场分诊");
    }

    private String buildRiskAdvice(String normalized) {
        if (containsAny(normalized, "胸痛", "呼吸困难", "昏厥", "抽搐")) {
            return "如症状明显或持续加重，请尽快线下就医或前往急诊。";
        }
        if (containsAny(normalized, "高热", "39", "持续发热")) {
            return "如高热持续不退或精神状态变差，请尽快到院处理。";
        }
        if (containsAny(normalized, "黑便", "便血", "呕血", "剧痛")) {
            return "当前描述提示需要进一步排查，建议尽快线下就诊。";
        }
        if (containsAny(normalized, "自伤", "自杀", "不想活", "活着没意思")) {
            return "如已出现自伤或轻生想法，请立刻联系家人陪同，并尽快去急诊或精神心理专科。";
        }
        return DEFAULT_RISK;
    }

    private AiResponse buildResponse(String primary, String secondary, String tertiary, String risk, String rawContent) {
        String safePrimary = blankToDefault(cleanModelField(primary), "暂未生成");
        String safeSecondary = blankToDefault(cleanModelField(secondary), "暂未生成");
        String safeTertiary = blankToDefault(cleanModelField(tertiary), "暂未生成");
        String safeRisk = blankToDefault(cleanModelField(risk), DEFAULT_RISK);

        String displayRaw = isBlank(rawContent)
            ? """
                [Primary]
                %s

                [Secondary]
                %s

                [Tertiary]
                %s

                [Risk]
                %s
                """.formatted(safePrimary, safeSecondary, safeTertiary, safeRisk)
            : rawContent;

        return new AiResponse(displayRaw, safePrimary, safeSecondary, safeTertiary, safeRisk);
    }

    private String chat(String systemPrompt, String userPrompt) {
        return chat(List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userPrompt)
        ));
    }

    private String chat(List<Map<String, String>> messages) {
        if (!hasApiKey()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "DeepSeek API key not configured");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("temperature", 0.35);
        body.put("max_tokens", 900);
        body.put("messages", messages);

        String payload;
        try {
            payload = objectMapper.writeValueAsString(body);
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build AI request", error);
        }

        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl))
            .timeout(Duration.ofSeconds(60))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey.trim())
            .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
            .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "DeepSeek request failed: " + response.body());
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.isNull()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "DeepSeek response missing content");
            }
            return content.asText("");
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "DeepSeek request interrupted", error);
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "DeepSeek request failed", error);
        }
    }

    private boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    private boolean hasUsefulFields(AiResponse response) {
        return response != null
            && (!isBlank(response.primary()) || !isBlank(response.secondary())
            || !isBlank(response.tertiary()) || !isBlank(response.risk()));
    }

    private String stripCodeFence(String text) {
        String cleaned = safe(text).trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private String cleanModelField(String value) {
        String cleaned = safe(value)
            .replace("\\n", "\n")
            .replace("```json", "")
            .replace("```", "")
            .replace("**", "")
            .trim();
        cleaned = cleaned.replaceFirst("^(先判断问题类型|问题类型|现在先做什么|要不要挂号|挂什么科|推荐科室|推荐医生|风险提醒|参考诊断|建议药方|用药说明)\\s*[:：]\\s*", "");
        return cleaned.trim();
    }

    private String unescape(String text) {
        return safe(text)
            .replace("\\n", "\n")
            .replace("\\\"", "\"")
            .replace("\\\\", "\\");
    }

    private String formatMoney(BigDecimal value) {
        return value == null ? "-" : value.stripTrailingZeros().toPlainString();
    }

    private String normalize(String value) {
        return safe(value).toLowerCase(Locale.ROOT);
    }

    private boolean containsAny(String value, String... keywords) {
        String source = normalize(value);
        for (String keyword : keywords) {
            if (source.contains(normalize(keyword))) {
                return true;
            }
        }
        return false;
    }

    private int parseAge(String age) {
        try {
            return Integer.parseInt(safe(age).trim());
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private String blankToDefault(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private boolean isBlank(String value) {
        return safe(value).isBlank();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
