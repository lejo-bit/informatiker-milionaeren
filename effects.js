/**
 * effects.js — Visual effect helpers (confetti, floating score popups).
 *
 * This module provides lightweight, dependency-free visual effects:
 * - Canvas-based confetti bursts for celebrations
 * - Floating score popups that animate up and fade out
 *
 * All effects self-clean: canvases are removed after the animation
 * completes, and popup elements remove themselves from the DOM.
 */

let activeConfettiCanvases = [];

/**
 * Triggers a confetti burst celebration.
 *
 * @param {number} count - Number of confetti particles (default 80).
 * @param {number} power - Burst power: higher = particles fly further (default 1).
 */
export function spawnConfetti(count = 80, power = 1) {
  const canvas = document.createElement("canvas");
  canvas.id = "confettiCanvas";
  document.body.appendChild(canvas);

  // Match the canvas to the viewport (device-pixel-ratio aware)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const particles = [];
  const colors = [
    "#e53935", "#f57c00", "#fbc02d", "#43a047",
    "#1e88e5", "#8e24aa", "#ec407a", "#00acc1"
  ];

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (3 + Math.random() * 7) * power;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3 * power,
      size: 5 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      gravity: 0.12,
      drag: 0.99,
      life: 1,
      decay: 0.004 + Math.random() * 0.004
    });
  }

  activeConfettiCanvases.push(canvas);

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = false;

    particles.forEach(p => {
      p.vx *= p.drag;
      p.vy += p.gravity;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > window.innerHeight + 50) return;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    frame++;
    if (alive && frame < 600) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
      activeConfettiCanvases = activeConfettiCanvases.filter(c => c !== canvas);
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Removes any active confetti canvases.
 * Used when resetting the game so old celebrations don't linger.
 */
export function clearConfetti() {
  activeConfettiCanvases.forEach(canvas => canvas.remove());
  activeConfettiCanvases = [];
}

/**
 * Shows a floating score popup that animates upward and fades out.
 *
 * @param {string} text - The text to display (e.g. "+150 ⚡").
 * @param {HTMLElement|null} anchor - Optional element to position near.
 *   If not provided, the popup appears centered horizontally.
 * @param {string} variant - Visual variant: "gold" (boss), "green"
 *   (category bonus), or default (normal score).
 * @param {number} offsetY - Vertical offset in px applied to the popup's
 *   anchor position. Negative shifts the popup upward, positive downward.
 *   Useful when spawning multiple popups at the same anchor so they
 *   don't overlap (e.g. score popup + multiplier popup).
 */
export function showScorePopup(text, anchor = null, variant = "", offsetY = 0) {
  const popup = document.createElement("div");
  popup.className = `score-popup ${variant}`.trim();
  popup.textContent = text;
  document.body.appendChild(popup);

  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    // Guard against hidden (display:none) anchors, whose rect is all
    // zeros — otherwise the popup would pin to the top-left corner.
    if (rect.width === 0 && rect.height === 0) {
      popup.style.left = `${window.innerWidth / 2}px`;
      popup.style.top = `${window.innerHeight * 0.4 + offsetY}px`;
    } else {
      popup.style.left = `${rect.left + rect.width / 2}px`;
      popup.style.top = `${rect.top + rect.height / 2 + offsetY}px`;
    }
  } else {
    popup.style.left = `${window.innerWidth / 2}px`;
    popup.style.top = `${window.innerHeight * 0.4 + offsetY}px`;
  }

  // Remove the element after the CSS animation finishes (~1.3s)
  setTimeout(() => popup.remove(), 1400);
}