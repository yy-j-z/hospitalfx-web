import React, { useMemo, useState } from "react";
import BrandLogo from "./BrandLogo";
import Galaxy from "./Galaxy";
import MagicBento from "./MagicBento";
import "./ProjectShowcase.css";

const showcaseCards = [
  {
    label: "01",
    title: "患者旅程一屏串联",
    description: "把挂号、复诊、药房、咨询和提醒整理成一个更有秩序的入口。",
    color: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,250,255,0.98) 100%)",
    detail:
      "患者进入系统后不再只是看到表单，而是能直观看到当前要做的事情、待办节点和下一步服务。"
  },
  {
    label: "02",
    title: "药物冲突智能提醒",
    description: "识别当前处方与既往在服药物之间的冲突关系，提前给出风险提示。",
    color: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,251,255,0.98) 100%)",
    detail:
      "系统支持药物库房、冲突规则和患者服药计划联动，在患者端和医生端同步呈现重点风险。"
  },
  {
    label: "03",
    title: "服药打卡与依从性",
    description: "让患者不仅被提醒，还能形成连续可追踪的服药记录。",
    color: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,252,255,0.98) 100%)",
    detail:
      "打卡记录会沉淀成用药执行数据，后续可以继续延展成复查提醒、漏服跟踪和家属协同。"
  },
  {
    label: "04",
    title: "数字人交互反馈",
    description: "点击栏目时，旁边的数字形象会给出状态回应，让页面更像在服务患者。",
    color: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,252,255,0.98) 100%)",
    detail:
      "交互不是为了炫技，而是为了让登录和导航动作有反馈，降低第一次使用时的迷茫感。"
  },
  {
    label: "05",
    title: "高校医院联合品牌",
    description: "把蓉城医枢 logo、学院气质与医疗专业感统一到同一套视觉语言里。",
    color: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,252,255,0.98) 100%)",
    detail:
      "视觉方向采用浅色底、蓝白主轴和透光交互层，不走厚重黑底风格，更贴合医疗场景。"
  },
  {
    label: "06",
    title: "库房与发药联动",
    description: "从医生开立、药房发药到库存扣减，形成更完整的业务演示闭环。",
    color: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,251,255,0.98) 100%)",
    detail:
      "后续还可以继续叠加低库存预警、替代药推荐与采购建议，扩展空间很大。"
  }
];

export default function ProjectShowcase({ onNavigate }) {
  const [selectedCard, setSelectedCard] = useState(showcaseCards[1]);
  const selectedIndex = useMemo(
    () => showcaseCards.findIndex((item) => item.title === selectedCard.title),
    [selectedCard.title]
  );

  return (
    <div className="project-showcase">
      <section className="about-hero">
        <div className="about-hero__galaxy">
          <Galaxy
            density={1.2}
            glowIntensity={0.42}
            saturation={0.56}
            hueShift={212}
            twinkleIntensity={0.36}
            rotationSpeed={0.05}
            repulsionStrength={1.7}
            transparent={true}
          />
        </div>
        <div className="about-hero__copy">
          <BrandLogo size="lg" subtitle="智慧门诊、药事协同与患者陪伴体验" />
          <span className="about-hero__badge">项目展示空间</span>
          <h3>把智慧门诊做成一个既专业、又愿意被患者持续使用的界面。</h3>
          <p>
            这个页面用浅色底搭配星云交互和 Bento 信息层，既保留医疗系统的秩序感，也把品牌展示、功能说明和项目亮点整合成更有记忆点的体验。
          </p>
          <div className="about-hero__actions">
            <button className="primary-button" type="button" onClick={() => onNavigate?.("medication")}>
              查看用药管家
            </button>
            <button className="ghost-button" type="button" onClick={() => onNavigate?.("consult")}>
              打开医生留言
            </button>
          </div>
          <div className="about-hero__metrics">
            <div>
              <strong>4 层</strong>
              <span>药物联动结构</span>
            </div>
            <div>
              <strong>2 条</strong>
              <span>前后台交互主线</span>
            </div>
            <div>
              <strong>1 个</strong>
              <span>统一品牌视觉</span>
            </div>
          </div>
        </div>
        <aside className="about-hero__detail">
          <p className="eyebrow">当前焦点</p>
          <h4>{selectedCard.title}</h4>
          <p>{selectedCard.detail}</p>
        </aside>
      </section>

      <section className="about-bento-card">
        <div className="about-bento-card__heading">
          <div>
            <p className="eyebrow">互动亮点</p>
            <h3>点击每个栏目，系统会强调当前设计重点。</h3>
          </div>
          <p className="section-copy">
            这部分基于定制后的 <code>MagicBento</code>，保留交互感，但切换成更适合医疗视觉的浅色主题。
          </p>
        </div>
        <MagicBento
          items={showcaseCards}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={260}
          particleCount={10}
          glowColor="32, 105, 221"
          selectedIndex={selectedIndex}
          onCardClick={(item) => setSelectedCard(item)}
        />
      </section>
    </div>
  );
}
