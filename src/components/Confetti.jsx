import React, { useEffect, useRef } from 'react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function Confetti({ active, onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: randomBetween(0, canvas.width),
      y: randomBetween(-canvas.height * 0.3, 0),
      w: randomBetween(6, 14),
      h: randomBetween(4, 9),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(0, Math.PI * 2),
      rotSpeed: randomBetween(-0.06, 0.06),
      vx: randomBetween(-2, 2),
      vy: randomBetween(3, 8),
      opacity: 1,
    }));

    let frame = 0;
    const TOTAL_FRAMES = 180;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      const fadeStart = TOTAL_FRAMES * 0.6;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.rotation += p.rotSpeed;
        if (frame > fadeStart) {
          p.opacity = Math.max(0, 1 - (frame - fadeStart) / (TOTAL_FRAMES - fadeStart));
        }
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (frame < TOTAL_FRAMES) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
    />
  );
}
