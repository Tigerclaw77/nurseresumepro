// Wraps HTML with watermark + glass overlay so it can’t be copied easily.
export function wrapPreviewHtml(innerHtml, watermarkText = "PREVIEW • ResumeAI") {
  return `
  <div style="position:relative; font-family:Inter,Segoe UI,sans-serif; line-height:1.5;">
    <div style="
      position:absolute; inset:0; 
      background: repeating-linear-gradient(
        -45deg,
        rgba(0,0,0,0.05) 0 20px,
        rgba(0,0,0,0.08) 20px 40px
      );
      pointer-events:none; mix-blend: multiply;"></div>

    <div style="
      position:absolute; inset:0; 
      background: rgba(255,255,255,0.6);
      backdrop-filter: blur(2px);
      -webkit-user-select: none; user-select: none;"></div>

    <div style="
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:center;
      color:#444; font-weight:700; font-size:42px; opacity:0.2;
      transform: rotate(-25deg); pointer-events:none;">
      ${watermarkText}
    </div>

    <div style="position:relative; padding:24px; color:#111;">
      ${innerHtml}
    </div>
  </div>`;
}
