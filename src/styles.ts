export const widgetStyles = `
.l2d-widget {
  align-items: flex-end;
  bottom: 0;
  display: inline-flex;
  flex-direction: column;
  gap: 0;
  left: 0;
  pointer-events: auto;
  position: fixed;
  transform: translateY(0);
  transition: transform 0.28s ease, opacity 0.28s ease;
  z-index: 9999;
}

.l2d-widget--absolute {
  position: absolute;
}

.l2d-widget--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(120%);
}

.l2d-widget__bubble {
  animation: l2d-widget-float 40s ease-in-out 4s infinite;
  align-self: flex-end;
  background: rgba(249, 236, 215, 0.94);
  border: 1px solid rgba(210, 178, 143, 0.88);
  border-radius: 16px;
  box-shadow: 0 14px 36px rgba(80, 60, 48, 0.18);
  color: #5c4638;
  font: 14px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin: 0 0 -6px;
  max-width: 280px;
  min-height: 72px;
  opacity: 0;
  padding: 10px 14px;
  position: relative;
  transition: opacity 0.2s ease;
  width: 280px;
  word-break: break-word;
  z-index: 2;
}

.l2d-widget__bubble--active {
  opacity: 1;
}

.l2d-widget__bubble span {
  color: #0080b8;
}

.l2d-widget__stage {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  position: relative;
}

.l2d-widget__canvas-wrap {
  position: relative;
}

.l2d-widget__canvas {
  cursor: grab;
  display: block;
  filter: drop-shadow(0 18px 28px rgba(30, 30, 40, 0.18));
  touch-action: none;
}

.l2d-widget__canvas:active {
  cursor: grabbing;
}

.l2d-widget__tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  position: absolute;
  right: -12px;
  top: 76px;
  transition: opacity 0.24s ease;
}

.l2d-widget:hover .l2d-widget__tools {
  opacity: 1;
}

.l2d-widget__tool {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(133, 153, 174, 0.3);
  border-radius: 999px;
  box-shadow: 0 8px 20px rgba(24, 36, 52, 0.12);
  color: #47627a;
  cursor: pointer;
  display: inline-flex;
  font: 11px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  height: 32px;
  justify-content: center;
  padding: 0 10px;
  transition: transform 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  white-space: nowrap;
}

.l2d-widget__tool:hover {
  border-color: rgba(65, 137, 197, 0.48);
  color: #0f75b8;
  transform: translateX(-2px);
}

.l2d-widget__toggle {
  background: linear-gradient(180deg, #ffbb56 0%, #ff9838 100%);
  border: 0;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 12px 24px rgba(243, 147, 41, 0.28);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font: 12px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  left: 0;
  letter-spacing: 0.08em;
  opacity: 0;
  padding: 10px 6px;
  position: fixed;
  transform: translateX(-72%);
  transition: transform 0.24s ease, opacity 0.24s ease;
  writing-mode: vertical-rl;
  z-index: 9998;
}

.l2d-widget__toggle--absolute {
  position: absolute;
}

.l2d-widget__toggle--active {
  opacity: 1;
  transform: translateX(0);
}

.l2d-widget__toggle:hover {
  transform: translateX(4px);
}

@keyframes l2d-widget-float {
  0%, 100% {
    transform: translate(0, 0) rotate(0);
  }

  30% {
    transform: translate(1px, -2px) rotate(0.8deg);
  }

  60% {
    transform: translate(-1px, 2px) rotate(-0.8deg);
  }
}
`;
