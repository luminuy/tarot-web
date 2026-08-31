"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
}

/**
 * พื้นหลังกาแลคซี่เต็มรูปแบบ — ดาวกระพริบ, เนบิวลาเคลื่อนที่, ดาวตก, พารัลแลกซ์ตามเมาส์
 * ใช้เฉพาะเดสก์ท็อป (ผ่าน <MysticBackground />) — มือถือใช้ <MysticAltarCanvas /> ที่เบากว่า
 *
 * Perf guard: หยุดวาดเมื่อสลับแท็บ, เคารพ prefers-reduced-motion (วาดเฟรมเดียวแบบนิ่ง),
 * throttle ~45fps เพื่อลดภาระ GPU
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

    const STAR_COUNT = Math.min(200, Math.floor((width * height) / 7000));
    const STAR_COLORS = ["#ffffff", "#f0dcb4", "#e0c088", "#cfc8e2", "#9d8189", "#70d6ff"];
    let stars: Star[] = [];
    let nebulas: NebulaCloud[] = [];
    let shootingStars: ShootingStar[] = [];
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const initElements = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.8 + 0.4,
          baseAlpha: Math.random() * 0.7 + 0.2,
          alpha: Math.random(),
          twinkleSpeed: Math.random() * 0.03 + 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }

      nebulas = [
        { x: width * 0.2, y: height * 0.25, radius: Math.min(width, height) * 0.45, color: "rgba(90, 40, 130, 0.12)", vx: 0.06, vy: 0.04 },
        { x: width * 0.8, y: height * 0.4, radius: Math.min(width, height) * 0.4, color: "rgba(30, 60, 120, 0.14)", vx: -0.05, vy: 0.05 },
        { x: width * 0.5, y: height * 0.8, radius: Math.min(width, height) * 0.5, color: "rgba(180, 120, 40, 0.08)", vx: 0.03, vy: -0.04 },
      ];

      shootingStars = Array.from({ length: 3 }, () => ({
        x: 0, y: 0, length: 0, speed: 0, angle: 0, alpha: 0, active: false,
      }));
    };

    initElements();

    const spawnShootingStar = () => {
      const inactive = shootingStars.find((s) => !s.active);
      if (inactive && Math.random() < 0.02) {
        inactive.x = Math.random() * width * 0.9;
        inactive.y = Math.random() * (height * 0.4);
        inactive.length = Math.random() * 80 + 60;
        inactive.speed = Math.random() * 12 + 15;
        inactive.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
        inactive.alpha = 1;
        inactive.active = true;
      }
    };

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      if (animate) {
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
      }

      // Nebulas
      for (const neb of nebulas) {
        if (animate) {
          neb.x += neb.vx;
          neb.y += neb.vy;
          if (neb.x < 0 || neb.x > width) neb.vx *= -1;
          if (neb.y < 0 || neb.y > height) neb.vy *= -1;
        }
        const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Interactive mouse glow (desktop only — component ไม่ถูก mount บนมือถืออยู่แล้ว)
      if (animate) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 280);
        mouseGlow.addColorStop(0, "rgba(224, 192, 136, 0.06)");
        mouseGlow.addColorStop(0.5, "rgba(139, 111, 158, 0.04)");
        mouseGlow.addColorStop(1, "transparent");
        ctx.fillStyle = mouseGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 280, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars + twinkle
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (animate) star.twinklePhase += star.twinkleSpeed;
        const currentAlpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.35;
        const alphaClamped = Math.max(0.1, Math.min(1, currentAlpha));

        const dx = animate ? (mouse.x - width / 2) * (star.size * 0.012) : 0;
        const dy = animate ? (mouse.y - height / 2) * (star.size * 0.012) : 0;

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alphaClamped;
        ctx.beginPath();
        ctx.arc(star.x + dx, star.y + dy, star.size, 0, Math.PI * 2);
        ctx.fill();

        if (star.size > 1.8 && alphaClamped > 0.8) {
          ctx.strokeStyle = "rgba(240, 220, 180, 0.4)";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(star.x + dx - 4, star.y + dy);
          ctx.lineTo(star.x + dx + 4, star.y + dy);
          ctx.moveTo(star.x + dx, star.y + dy - 4);
          ctx.lineTo(star.x + dx, star.y + dy + 4);
          ctx.stroke();
        }
      }

      // Shooting stars (animate only)
      if (animate) {
        spawnShootingStar();
        for (const ss of shootingStars) {
          if (!ss.active) continue;
          ss.x += Math.cos(ss.angle) * ss.speed;
          ss.y += Math.sin(ss.angle) * ss.speed;
          ss.alpha -= 0.015;
          if (ss.alpha <= 0 || ss.x > width || ss.y > height) {
            ss.active = false;
            continue;
          }
          const tailX = ss.x - Math.cos(ss.angle) * ss.length;
          const tailY = ss.y - Math.sin(ss.angle) * ss.length;
          const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
          grad.addColorStop(0, "transparent");
          grad.addColorStop(1, `rgba(240, 220, 180, ${ss.alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(ss.x, ss.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
    };

    // ~45fps throttle
    const FRAME_INTERVAL = 22;
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
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
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
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionChange);

    start();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionChange);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
