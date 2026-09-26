import React from "react";
import logoSrc from "../assets/rongcheng-logo.jpg";
import "./BrandLogo.css";

export default function BrandLogo({ compact = false, subtitle, size = "md", title = "蓉城医枢" }) {
  return (
    <div className={`brand-logo brand-logo-${size} ${compact ? "brand-logo-compact" : ""}`}>
      <div className="brand-logo__mark">
        <img alt={`${title} logo`} src={logoSrc} />
      </div>
      <div className="brand-logo__copy">
        <strong>{title}</strong>
        <span>{subtitle || "智慧医疗协同平台"}</span>
      </div>
    </div>
  );
}
