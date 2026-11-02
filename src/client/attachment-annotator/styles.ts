/** Styles for the composer-thumbnail annotation overlay. */
export const ATTACHMENT_CSS = `
.da-attachment-anchor{display:block;width:0;height:0;overflow:hidden;pointer-events:none}
.da-attachment{
  --da-accent:#e03131;
  --da-blue:#176df2;
  --da-ink:#242529;
  --da-muted:#74777f;
  --da-faint:#9699a1;
  --da-line:rgba(36,37,41,.11);
  --da-paper:#fff;
  --da-rail:#2b2c30;
  position:fixed;
  inset:0;
  z-index:2147483000;
  color:var(--da-ink);
  font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);
  font-size:13px;
  outline:none;
}
.da-attachment,.da-attachment *{box-sizing:border-box}
.da-attachment button,.da-attachment textarea,.da-attachment input{font:inherit}
.da-attachment button{cursor:pointer}
.da-attachment button:focus-visible,.da-attachment textarea:focus-visible,.da-attachment input:focus-visible{outline:2px solid #6ea2ff;outline-offset:2px}
.da-attachment button[aria-disabled=true]{opacity:.38;cursor:default}
.da-attachment-backdrop{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  padding:24px;
  background:rgba(18,19,22,.58);
  backdrop-filter:blur(7px);
  animation:da-attachment-fade .18s ease-out both;
}
.da-attachment-dialog{
  position:relative;
  isolation:isolate;
  display:grid;
  grid-template-rows:minmax(0,1fr) auto;
  width:min(1240px,calc(100vw - 32px));
  height:min(860px,calc(100vh - 32px));
  min-width:520px;
  min-height:420px;
  overflow:visible;
  background:transparent;
  animation:da-attachment-rise .22s cubic-bezier(.22,1,.36,1) both;
}
.da-attachment svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.da-attachment-stage{
  position:relative;
  display:flex;
  min-width:0;
  min-height:0;
  overflow:auto;
  padding:34px 100px 30px 34px;
  background:transparent;
  scrollbar-width:thin;
  overscroll-behavior:contain;
}
.da-attachment-canvas{
  position:relative;
  flex:0 0 auto;
  margin:auto;
}
.da-attachment-paper{
  position:relative;
  transform-origin:top left;
  overflow:visible;
  background:transparent;
}
.da-attachment-paper[data-busy=true]{cursor:progress}
.da-attachment-paper>img{position:absolute;inset:0;display:block;width:100%;height:100%;border-radius:inherit;pointer-events:none;user-select:none}
.da-attachment-paper>.da-overlay{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible;touch-action:none}
.da-attachment-paper>.da-overlay[data-tool=select] [data-da-mark]{cursor:move}
.da-attachment-rail{
  position:absolute;
  z-index:20;
  top:50%;
  right:16px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:3px;
  width:48px;
  max-height:calc(100% - 34px);
  overflow-y:auto;
  padding:7px 6px;
  transform:translateY(-50%);
  border:1px solid rgba(255,255,255,.09);
  border-radius:17px;
  background:var(--da-rail);
  color:#fff;
  box-shadow:0 12px 30px rgba(18,19,23,.3),inset 0 1px 0 rgba(255,255,255,.08);
  scrollbar-width:none;
}
.da-attachment-rail::-webkit-scrollbar{display:none}
.da-attachment-close svg{width:16px;height:16px}
.da-attachment-tool{
  display:flex;
  align-items:center;
  justify-content:center;
  width:35px;
  height:35px;
  flex:0 0 auto;
  padding:0;
  border:0;
  border-radius:10px;
  background:transparent;
  color:rgba(255,255,255,.72);
  font-size:18px;
  line-height:1;
}
.da-attachment-tool:hover{background:rgba(255,255,255,.1);color:#fff}
.da-attachment-tool[aria-pressed=true]{background:rgba(255,255,255,.19);color:#fff}
.da-attachment-tool[aria-disabled=true]:hover{background:transparent;color:rgba(255,255,255,.72)}
.da-attachment-tool svg{width:17px;height:17px}
.da-attachment-separator{width:22px;height:1px;flex:0 0 auto;margin:3px 0;background:rgba(255,255,255,.15)}
.da-attachment-color{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  width:35px;
  height:35px;
  flex:0 0 auto;
  border-radius:10px;
  cursor:pointer;
}
.da-attachment-color:hover{background:rgba(255,255,255,.1)}
.da-attachment-color::after{content:"";position:absolute;inset:9px;border:2px solid #fff;border-radius:50%;background:var(--da-accent);box-shadow:0 0 0 1px rgba(0,0,0,.15)}
.da-attachment-color input{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;opacity:0;cursor:pointer}
.da-attachment-zoom{
  display:block;
  min-width:34px;
  padding:2px 0 3px;
  color:rgba(255,255,255,.55);
  font-size:8.5px;
  font-variant-numeric:tabular-nums;
  line-height:1;
  text-align:center;
}
.da-attachment-footer{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  align-self:center;
  width:auto;
  margin:0 auto 14px;
  padding:0;
}
.da-attachment-status{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:3px;
  max-width:min(560px,calc(100vw - 56px));
  padding:6px 10px;
  border-radius:9px;
  background:rgba(23,24,27,.82);
  color:rgba(255,255,255,.72);
  font-size:10px;
  line-height:1.4;
  text-align:center;
  backdrop-filter:blur(12px);
}
.da-attachment-warning{color:#9a6418}
.da-attachment-actions{display:flex;align-items:center;gap:7px;flex:0 0 auto}
.da-attachment-action{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  height:31px;
  padding:0 11px;
  border:.5px solid rgba(255,255,255,.28);
  border-radius:999px;
  background:rgba(251,251,252,.92);
  color:#4f5157;
  font-size:10.5px;
  font-weight:580;
  line-height:1;
  white-space:nowrap;
  box-shadow:0 5px 18px rgba(5,6,9,.18);
}
.da-attachment-action:hover{background:#eeeef0;color:var(--da-ink)}
.da-attachment-action svg{width:14px;height:14px}
.da-attachment-action-primary{border-color:#26272b;background:#26272b;color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.14)}
.da-attachment-action-primary:hover{background:#3a3b40;color:#fff}
.da-attachment-comment-pill{
  position:absolute;
  z-index:15;
  width:286px;
  max-width:calc(100% - 16px);
  padding:3px;
  border:.5px solid var(--da-line);
  border-radius:20px;
  background:color-mix(in srgb,var(--da-paper) 94%,transparent);
  color:var(--da-ink);
  box-shadow:0 5px 18px rgba(20,40,80,.14),0 0 0 .5px rgba(20,40,80,.06);
  backdrop-filter:blur(10px);
}
.da-attachment-comment-pill textarea{
  width:100%;
  min-height:0;
  max-height:min(180px,42vh);
  resize:none;
  padding:7px 10px;
  border:0;
  outline:0;
  background:transparent;
  color:var(--da-ink);
  font:inherit;
  font-size:13px;
  line-height:1.55;
  field-sizing:content;
  overflow-y:auto;
  scrollbar-width:none;
}
.da-attachment-comment-pill textarea::-webkit-scrollbar{width:0;height:0}
.da-attachment-comment-pill textarea::placeholder{color:#a1a4ab}
.da-attachment .da-attachment-comment-pill textarea:focus-visible{outline:0}
.da-attachment-confirm{
  position:absolute;
  z-index:40;
  left:50%;
  bottom:82px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  width:min(500px,calc(100% - 40px));
  padding:12px 12px 12px 15px;
  transform:translateX(-50%);
  border:1px solid rgba(180,35,24,.2);
  border-radius:13px;
  background:rgba(255,252,251,.98);
  box-shadow:0 14px 38px rgba(50,25,20,.18);
}
.da-attachment-confirm>div:first-child{display:flex;flex-direction:column;gap:2px;min-width:0}
.da-attachment-confirm strong{color:#352f2e;font-size:11.5px;font-weight:650}
.da-attachment-confirm span{color:#827875;font-size:9.5px;line-height:1.35}
.da-attachment-confirm-actions{display:flex;gap:6px;flex:0 0 auto}
.da-attachment-confirm button{height:29px;padding:0 10px;border:.5px solid rgba(36,37,41,.13);border-radius:8px;background:#fff;color:#666970;font-size:10.5px}
.da-attachment-confirm button:hover{background:#f1f1f2}
.da-attachment-confirm .da-attachment-danger{border-color:rgba(180,35,24,.22);color:#a1281f}
.da-attachment-confirm .da-attachment-danger:hover{background:#fae9e7}
@keyframes da-attachment-fade{from{opacity:0}to{opacity:1}}
@keyframes da-attachment-rise{from{opacity:0;transform:translateY(8px) scale(.992)}to{opacity:1;transform:none}}
@media(max-width:760px){
  .da-attachment-backdrop{padding:0}
  .da-attachment-dialog{width:100vw;height:100vh;min-width:0;min-height:0}
  .da-attachment-stage{padding:16px 70px 18px 16px}
  .da-attachment-rail{right:9px;width:46px}
  .da-attachment-footer{gap:6px;margin-bottom:10px}
  .da-attachment-status{max-width:calc(100vw - 32px)}
  .da-attachment-actions{justify-content:flex-end}
  .da-attachment-action{flex:0 0 auto}
  .da-attachment-comment-pill{width:248px}
}
@media(pointer:coarse){
  .da-attachment-tool,.da-attachment-color{width:40px;height:40px}
  .da-attachment-rail{width:53px}
}
@media(prefers-reduced-motion:reduce){
  .da-attachment-backdrop,.da-attachment-dialog{animation:none}
}
`
