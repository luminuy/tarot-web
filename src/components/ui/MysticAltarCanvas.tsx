"use client";

import React, { useEffect, useRef } from "react";

export const MysticAltarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particles: Embers and Dust
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      fadeSpeed: number;
      color: string;
    }> = [];

    const PARTICLE_COUNT = 90;
    const COLORS = ["#e5c07b", "#ffd700", "#ff9f43", "#a855f7", "#ffffff"];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speedY: -(Math.random() * 0.4 + 0.1),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.7 + 0.2,
        fadeSpeed: Math.random() * 0.008 + 0.002,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep Altar Vignette & Ambient Radial Glows
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        50,
        width / 2,
        height * 0.4,
        Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, "rgba(26, 16, 48, 0.45)");
      bgGrad.addColorStop(0.4, "rgba(13, 9, 24, 0.7)");
      bgGrad.addColorStop(1, "rgba(5, 4, 10, 0.95)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw Rotating Astrological Altar Circle behind center
      angle += 0.0015;
      const centerX = width / 2;
      const centerY = height * 0.42;
      const radius = Math.min(width, height) * 0.32;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer ring
      ctx.rotate(angle);
      ctx.strokeStyle = "rgba(229, 192, 123, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed inner ring
      ctx.beginPath();
      ctx.setLineDash([8, 12]);
      ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.1)";
      ctx.stroke();
      ctx.setLineDash([]);

      // Hexagram / Sacred geometry lines
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const rad = (i * Math.PI) / 6;
        const x1 = Math.cos(rad) * (radius * 0.75);
        const y1 = Math.sin(rad) * (radius * 0.75);
        const x2 = Math.cos(rad) * radius;
        const y2 = Math.sin(rad) * radius;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = "rgba(229, 192, 123, 0.06)";
      ctx.stroke();

      ctx.restore();

      // Floating Mystic Embers
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += Math.sin(Date.now() * p.fadeSpeed) * 0.01;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.85, p.opacity));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Ember Glow
        if (p.size > 1.4) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};
