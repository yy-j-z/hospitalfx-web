import React, { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./MagicBento.css";

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 280;
const DEFAULT_GLOW_COLOR = "37, 110, 255";
const MOBILE_BREAKPOINT = 768;

const defaultItems = [
  { label: "挂号", title: "诊前协同", description: "从预约到分诊一屏联动。", color: "#f8fbff" },
  { label: "接诊", title: "门诊闭环", description: "医生、药房、患者信息即时同步。", color: "#f5fbff" },
  { label: "用药", title: "冲突提醒", description: "识别患者当前用药之间的潜在风险。", color: "#f7fbff" },
  { label: "打卡", title: "服药计划", description: "让提醒、签到与依从性汇总可视化。", color: "#fbfcff" },
  { label: "服务", title: "数字人陪伴", description: "栏目点击后给出更有反馈感的互动。", color: "#f9fbff" },
  { label: "品牌", title: "校院特色", description: "把蓉城医枢的视觉识别统一起来。", color: "#f8fcff" }
];

const createParticleElement = (x, y, color) => {
  const particle = document.createElement("div");
  particle.className = "particle";
  particle.style.cssText = `
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(${color}, 0.95);
    box-shadow: 0 0 12px rgba(${color}, 0.4);
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
    z-index: 10;
  `;
  return particle;
};

const calculateSpotlightValues = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.82
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

function ParticleCard({
  item,
  children,
  className = "",
  disableAnimations = false,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
  enableStars = true,
  onClick
}) {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const particlesCacheRef = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current || !enableStars || particleCount <= 0) {
      return;
    }

    const { width, height } = cardRef.current.getBoundingClientRect();
    particlesCacheRef.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [enableStars, glowColor, particleCount]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: "back.in(1.5)",
        onComplete: () => particle.parentNode?.removeChild(particle)
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current || !enableStars || particleCount <= 0) {
      return;
    }

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    particlesCacheRef.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) {
          return;
        }

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.28, ease: "back.out(1.7)" }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 96,
          y: (Math.random() - 0.5) * 96,
          rotation: Math.random() * 360,
          duration: 2.1 + Math.random() * 1.3,
          ease: "none",
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.2,
          duration: 1.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }, index * 90);

      timeoutsRef.current.push(timeoutId);
    });
  }, [enableStars, initializeParticles, particleCount]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) {
      return undefined;
    }

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      gsap.to(element, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.28,
        ease: "power2.out"
      });
    };

    const handleMouseMove = (event) => {
      if (!enableTilt && !enableMagnetism) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.16,
          ease: "power2.out",
          transformPerspective: 1200
        });
      }

      if (enableMagnetism) {
        magnetismAnimationRef.current = gsap.to(element, {
          x: (x - centerX) * 0.04,
          y: (y - centerY) * 0.04,
          duration: 0.26,
          ease: "power2.out"
        });
      }
    };

    const handleClick = (event) => {
      onClick?.(item);
      if (!clickEffect) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement("div");
      ripple.className = "magic-bento-ripple";
      ripple.style.cssText = `
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        background: radial-gradient(circle, rgba(${glowColor}, 0.28) 0%, rgba(${glowColor}, 0.14) 32%, transparent 72%);
      `;

      element.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.75, ease: "power2.out", onComplete: () => ripple.remove() }
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    clickEffect,
    disableAnimations,
    enableMagnetism,
    enableTilt,
    glowColor,
    item,
    onClick
  ]);

  return (
    <article
      ref={cardRef}
      className={`${className} particle-container`}
      style={{
        background: item.color,
        position: "relative",
        overflow: "hidden",
        "--glow-color": glowColor
      }}
      type="button"
    >
      {children}
    </article>
  );
}

function GlobalSpotlight({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) {
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) {
      return undefined;
    }

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.cssText = `
      position: fixed;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle, rgba(${glowColor}, 0.12) 0%, rgba(${glowColor}, 0.05) 24%, rgba(${glowColor}, 0.02) 42%, transparent 70%);
      opacity: 0;
      transform: translate(-50%, -50%);
      z-index: 5;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (event) => {
      if (!spotlightRef.current || !gridRef.current) {
        return;
      }

      const section = gridRef.current.closest(".bento-section");
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll(".magic-bento-card");

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.28, ease: "power2.out" });
        cards.forEach((card) => card.style.setProperty("--glow-intensity", "0"));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(event.clientX - centerX, event.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(card, event.clientX, event.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: event.clientX,
        top: event.clientY,
        duration: 0.12,
        ease: "power2.out"
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.78
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.78
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.32,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll(".magic-bento-card").forEach((card) => {
        card.style.setProperty("--glow-intensity", "0");
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.28, ease: "power2.out" });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [disableAnimations, enabled, glowColor, gridRef, spotlightRadius]);

  return null;
}

export default function MagicBento({
  items = defaultItems,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
  onCardClick,
  selectedIndex = -1
}) {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <div className="magic-bento-shell">
      {enableSpotlight ? (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      ) : null}

      <div className="card-grid bento-section" ref={gridRef}>
        {items.map((item, index) => (
          <ParticleCard
            key={`${item.title}-${index}`}
            item={item}
            className={`magic-bento-card ${textAutoHide ? "magic-bento-card--text-autohide" : ""} ${enableBorderGlow ? "magic-bento-card--border-glow" : ""} ${selectedIndex === index ? "magic-bento-card-active" : ""}`}
            disableAnimations={shouldDisableAnimations}
            particleCount={particleCount}
            glowColor={glowColor}
            enableTilt={enableTilt}
            clickEffect={clickEffect}
            enableMagnetism={enableMagnetism}
            enableStars={enableStars}
            onClick={onCardClick}
          >
            <div className="magic-bento-card__header">
              <div className="magic-bento-card__label">{item.label}</div>
            </div>
            <div className="magic-bento-card__content">
              <h3 className="magic-bento-card__title">{item.title}</h3>
              <p className="magic-bento-card__description">{item.description}</p>
            </div>
          </ParticleCard>
        ))}
      </div>
    </div>
  );
}
