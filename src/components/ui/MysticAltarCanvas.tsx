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
    let isVisible = !document.hidden;

    // Check if user prefers reduced motion (Accessibility & Battery Saving)
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;

    // Cache background gradient on resize (Warm Ivory Linen & Milk Cream)
    let bgGrad = ctx.createRadialGradient(
      width / 2,
      height * 0.38,
      50,
      width / 2,
      height * 0.38,
      Math.max(width, height) * 0.75
    );
    bgGrad.addColorStop(0, "rgba(253, 247, 240, 0.7)");
    bgGrad.addColorStop(0.5, "rgba(252, 240, 230, 0.9)");
    bgGrad.addColorStop(1, "rgba(247, 232, 218, 0.98)");

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      bgGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.38,
        50,
        width / 2,
        height * 0.38,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, "rgba(253, 247, 240, 0.7)");
      bgGrad.addColorStop(0.5, "rgba(252, 240, 230, 0.9)");
      bgGrad.addColorStop(1, "rgba(247, 232, 218, 0.98)");

      if (prefersReducedMotion) {
        drawStaticBackground();
      }
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && !prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        cancelAnimationFrame(animId);
        drawStaticBackground();
      } else if (isVisible) {
        animId = requestAnimationFrame(render);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionChange);

    // Adaptive Particles: 10 on mobile, 18 on desktop (Very sparse and gentle)
    const isMobile = width < 768;
    const PARTICLE_COUNT = isMobile ? 10 : 18;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      baseOpacity: number;
      phase: number;
      fadeSpeed: number;
    }> = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 0.8 + 0.4,
        speedY: -(Math.random() * 0.25 + 0.05),
        speedX: (Math.random() - 0.5) * 0.15,
        baseOpacity: Math.random() * 0.3 + 0.15,
        phase: Math.random() * Math.PI * 2,
        fadeSpeed: Math.random() * 0.003 + 0.001,
      });
    }

    const drawStaticBackground = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    };

    let angle = 0;
    let lastRenderTime = 0;
    const frameInterval = isMobile ? 33.3 : 20.0; // 30 FPS on mobile, 50 FPS on desktop

    const render = (timestamp: number = 0) => {
      if (!isVisible || prefersReducedMotion) return;

      if (timestamp - lastRenderTime < frameInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = timestamp;

      ctx.clearRect(0, 0, width, height);

      // Deep Altar Vignette & Ambient Radial Glows (Zero Allocation)
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Rotating Sacred Altar Geometry
      angle += 0.0006;
      const centerX = width / 2;
      const centerY = height * 0.40;
      const radius = Math.min(width, height) * 0.32;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer ring
      ctx.rotate(angle);
      ctx.strokeStyle = "rgba(214, 180, 141, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed inner ring
      ctx.beginPath();
      ctx.setLineDash([6, 12]);
      ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(205, 159, 91, 0.12)";
      ctx.stroke();
      ctx.setLineDash([]);

      // Sacred geometry lines
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

      // Floating Ethereal Soft Light Glimmers (Clean white/gold motes)
      const now = Date.now();
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const alpha = Math.max(0.08, Math.min(0.55, p.baseOpacity + Math.sin(now * p.fadeSpeed + p.phase) * 0.2));
        // Soft gold halo
        ctx.fillStyle = `rgba(205, 159, 91, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // White center
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    if (prefersReducedMotion) {
      drawStaticBackground();
    } else {
      render();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionChange);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};
