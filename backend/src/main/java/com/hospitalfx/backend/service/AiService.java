package com.hospitalfx.backend.service;

import com.hospitalfx.backend.dto.AiResponse;
import com.hospitalfx.backend.model.DoctorProfile;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiService {

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    @Value("${deepseek.api-key:}")
    private String apiKey;

    @Value("${deepseek.base-url}")
    private String baseUrl;

    @Value("${deepseek.model}")
    private String model;

    public AiResponse registrationAdvice(String patientName, String gender, String age, String symptomSummary, List<DoctorProfile> doctors) {
        String systemPrompt = "你是医院门诊挂号分诊 AI 助手。必须优先从给定医生列表中推荐科室与医生，并输出【推荐科室】【推荐医生】【建议就诊时间】【分诊说明】【风险提醒】。";
        String doctorText = doctors.stream()
            .map(doctor -> doctor.getRealName() + " / " + doctor.getDeptName() + " / " + doctor.getRegistLevel())
            .reduce("", (left, right) -> left + "\n- " + right);
        String userPrompt = "患者姓名：" + safe(patientName) + "\n性别：" + safe(gender) + "\n年龄：" + safe(age) + "\n症状摘要：" + symptomSummary + "\n可选医生列表：" + doctorText;
        String content = chat(systemPrompt, userPrompt);
        return new AiResponse(
            content,
            extract(content, "推荐科室", "推荐医生", "建议就诊时间", "分诊说明", "风险提醒"),
            extract(content, "推荐医生", "建议就诊时间", "分诊说明", "风险提醒"),
            extract(content, "建议就诊时间", "分诊说明", "风险提醒"),
            extract(content, "风险提醒")
        );
    }

    public AiResponse patientAdvice(String patientName, String gender, String age, String symptomSummary) {
        String systemPrompt = "你是医院门诊 AI 简易问诊助手。不能替代医生诊断。请严格输出【可能疾病】【建议科室】【分析说明】【风险提醒】。";
        String userPrompt = "患者姓名：" + safe(patientName) + "\n性别：" + safe(gender) + "\n年龄：" + safe(age) + "\n症状摘要：" + symptomSummary;
        String content = chat(systemPrompt, userPrompt);
        return new AiResponse(
            content,
            extract(content, "可能疾病", "建议科室", "分析说明", "风险提醒"),
            extract(content, "建议科室", "分析说明", "风险提醒"),
            extract(content, "分析说明", "风险提醒"),
            extract(content, "风险提醒")
        );
    }

    public AiResponse doctorMedicationAdvice(String patientName, String gender, String age, String currentDiagnosis, String symptomSummary) {
        String systemPrompt = "你是医院门诊医生端 AI 用药参考助手，只能给出辅助建议，不能替代医生最终诊疗决策。请严格输出【参考诊断】【建议用药/药方】【用药说明】【风险提醒】四段内容，说明应由医生决定是否采纳。";
        String userPrompt = "患者姓名：" + safe(patientName)
            + "\n性别：" + safe(gender)
            + "\n年龄：" + safe(age)
            + "\n当前诊断：" + safe(currentDiagnosis)
            + "\n症状描述：" + safe(symptomSummary);
        String content = chat(systemPrompt, userPrompt);
        return new AiResponse(
            content,
            extract(content, "参考诊断", "建议用药/药方", "用药说明", "风险提醒"),
            extract(content, "建议用药/药方", "用药说明", "风险提醒"),
            extract(content, "用药说明", "风险提醒"),
            extract(content, "风险提醒")
        );
    }

    private String chat(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "DeepSeek API key 未配置");
        }
        String body = """
            {
              "model": "%s",
              "temperature": 0.2,
              "messages": [
                {"role": "system", "content": "%s"},
                {"role": "user", "content": "%s"}
              ]
            }
            """.formatted(model, escape(systemPrompt), escape(userPrompt));

        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl))
            .timeout(Duration.ofSeconds(60))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey.trim())
            .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
            .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "DeepSeek 调用失败: " + response.body());
            }
            return extractContent(response.body());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "DeepSeek 调用失败", e);
        }
    }

    private String extractContent(String json) {
        Matcher matcher = Pattern.compile("\"content\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"").matcher(json);
        if (matcher.find()) {
            return unescape(matcher.group(1));
        }
        return json;
    }

    private String extract(String content, String title, String... nextTitles) {
        int start = content.indexOf("【" + title + "】");
        if (start < 0) {
            return "";
        }
        int bodyStart = start + title.length() + 2;
        int end = content.length();
        for (String nextTitle : nextTitles) {
            int nextIndex = content.indexOf("【" + nextTitle + "】", bodyStart);
            if (nextIndex >= 0 && nextIndex < end) {
                end = nextIndex;
            }
        }
        return content.substring(bodyStart, end).trim();
    }

    private String escape(String text) {
        return safe(text)
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "\\r")
            .replace("\n", "\\n");
    }

    private String unescape(String text) {
        return text.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
