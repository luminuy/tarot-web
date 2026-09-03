"use client";

import React, { useEffect, useRef } from "react";

interface Glimmer {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

/**
 * พื้นหลังวิหารแสงสว่างอบอุ่นระดับโลก (World-Class Warm Minimalist Sanctuary Canvas)
 * ให้บรรยากาศสงบนิ่ง ละมุนตา สว่างแต่ไม่แสบตา ไร้จุดละอองฝุ่นรกตา
 * มีวงแหวนเรขาคณิตศักดิ์สิทธิ์หมุนอย่างแผ่วเบา และประกายแสงสีทองนวลตา
 */
export const GalaxyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let isVisible = !document.hidden;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;

    // ประกายแสงนุ่มนวลเพียง 28 ดวง เพื่อความสะอาดตา ไม่รกเป็นฝุ่นผง
    const GLIMMER_COUNT = Math.min(28, Math.max(16, Math.floor(width / 50)));
    let glimmers: Glimmer[] = [];
    let angle = 0;

    const initElements = () => {
      glimmers = [];
      for (let i = 0; i < GLIMMER_COUNT; i++) {
        glimmers.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 0.9 + 0.4, // 0.4px - 1.3px ขนาดเล็กละมุน
          baseAlpha: Math.random() * 0.35 + 0.15,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initElements();

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Soft Ambient Celestial Radiance at top center
      const auraGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.05,
        20,
        width / 2,
        height * 0.15,
        Math.max(width, height) * 0.65
      );
      auraGrad.addColorStop(0, "rgba(228, 192, 159, 0.22)");
      auraGrad.addColorStop(0.4, "rgba(205, 159, 91, 0.08)");
      auraGrad.addColorStop(1, "rgba(250, 246, 240, 0)");
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Slow-Rotating Delicate Sacred Geometry
      if (animate) angle += 0.0006;
      const centerX = width / 2;
      const centerY = height * 0.38;
      const radius = Math.min(width, height) * 0.34;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      // Outer delicate ring
      ctx.strokeStyle = "rgba(214, 180, 141, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Middle dashed ring
      ctx.beginPath();
      ctx.setLineDash([6, 12]);
      ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(205, 159, 91, 0.12)";
      ctx.stroke();
      ctx.setLineDash([]);

      // 12-Ray Sacred Division
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const rad = (i * Math.PI) / 6;
        const x1 = Math.cos(rad) * (radius * 0.78);
        const y1 = Math.sin(rad) * (radius * 0.78);
        const x2 = Math.cos(rad) * radius;
        const y2 = Math.sin(rad) * radius;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = "rgba(214, 180, 141, 0.10)";
      ctx.stroke();
      ctx.restore();

      // 3. Ethereal Soft White & Champagne Glimmers (Clean, not dirty dust)
      for (let i = 0; i < glimmers.length; i++) {
        const g = glimmers[i];
        if (animate) g.twinklePhase += g.twinkleSpeed;
        const currentAlpha = g.baseAlpha + Math.sin(g.twinklePhase) * 0.25;
        const alphaClamped = Math.max(0.08, Math.min(0.65, currentAlpha));

        // Soft gold halo
        ctx.fillStyle = `rgba(205, 159, 91, ${alphaClamped * 0.4})`;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // White pearl center
        ctx.fillStyle = `rgba(255, 255, 255, ${alphaClamped})`;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // ~30-40fps for battery efficiency & whisper quiet smoothness
    const FRAME_INTERVAL = 28;
    let last = 0;
    const render = (t: number) => {
      if (!isVisible || prefersReducedMotion) return;
      animId = requestAnimationFrame(render);
      if (t - last < FRAME_INTERVAL) return;
      last = t;
      drawFrame(true);
    };

    const start = () => {
      cancelAnimationFrame(animId);
      if (prefersReducedMotion) {
        drawFrame(false);
      } else if (isVisible) {
        animId = requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
      start();
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
      start();
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      start();
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionChange);

    start();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionChange);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90"
    />
  );
};
