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

    // Cache background gradient on resize (Zero GC allocations in render loop)
    let bgGrad = ctx.createRadialGradient(
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

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      bgGrad = ctx.createRadialGradient(
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

    // Adaptive Particles: 12 on mobile, 30 on desktop
    const isMobile = width < 768;
    const PARTICLE_COUNT = isMobile ? 12 : 30;
    const COLORS = ["#e5c07b", "#ffd700", "#ff9f43", "#a855f7", "#ffffff"];

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

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.5,
        speedY: -(Math.random() * 0.35 + 0.08),
        speedX: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.7 + 0.2,
        fadeSpeed: Math.random() * 0.008 + 0.002,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    const drawStaticBackground = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    };

    let angle = 0;
    let lastRenderTime = 0;
    const frameInterval = isMobile ? 33.3 : 16.6; // 30 FPS on mobile, 60 FPS on desktop

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
      angle += 0.0015;
      const centerX = width / 2;
      const centerY = height * 0.42;
      const radius = Math.min(width, height) * 0.32;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer ring
      ctx.rotate(angle);
      ctx.strokeStyle = "rgba(229, 192, 123, 0.07)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed inner ring
      ctx.beginPath();
      ctx.setLineDash([8, 12]);
      ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.08)";
      ctx.stroke();
      ctx.setLineDash([]);

      // Sacred geometry lines
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
      ctx.strokeStyle = "rgba(229, 192, 123, 0.05)";
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
        ctx.globalAlpha = Math.max(0.1, Math.min(0.8, p.opacity));
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
