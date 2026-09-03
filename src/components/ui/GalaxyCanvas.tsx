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
 * พื้นหลังกาแลคซี่โทนดำสนิท (Obsidian Night Sky) — ดาวระยิบระยับ, ดาวตก, พารัลแลกซ์ตามเมาส์
 * ใช้เฉพาะเดสก์ท็อป (ผ่าน <MysticBackground />) — มือถือใช้ <MysticAltarCanvas /> ที่เบากว่า
 *
 * สีพื้นหลังสม่ำเสมอเข้มสนิททั่วทั้งหน้าจอ ไม่ซีดจางหรือสว่างขึ้นเมื่อเลื่อนหน้าจอลงมา
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

    const STAR_COUNT = Math.min(130, Math.floor((width * height) / 8500));
    const STAR_COLORS = ["#CD9F5B", "#D6B48D", "#E4C09F", "#B8853E", "#A07840"];
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const initElements = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.6 + 0.35,
          baseAlpha: Math.random() * 0.65 + 0.15,
          alpha: Math.random(),
          twinkleSpeed: Math.random() * 0.025 + 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }

      shootingStars = Array.from({ length: 3 }, () => ({
        x: 0,
        y: 0,
        length: 0,
        speed: 0,
        angle: 0,
        alpha: 0,
        active: false,
      }));
    };

    initElements();

    const spawnShootingStar = () => {
      const inactive = shootingStars.find((s) => !s.active);
      if (inactive && Math.random() < 0.018) {
        inactive.x = Math.random() * width * 0.9;
        inactive.y = Math.random() * (height * 0.45);
        inactive.length = Math.random() * 80 + 60;
        inactive.speed = Math.random() * 12 + 15;
        inactive.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
        inactive.alpha = 0.9;
        inactive.active = true;
      }
    };

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      if (animate) {
        mouse.x += (mouse.targetX - mouse.x) * 0.04;
        mouse.y += (mouse.targetY - mouse.y) * 0.04;
      }

      // Stars + twinkle (Crisp Obsidian Sky)
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (animate) star.twinklePhase += star.twinkleSpeed;
        const currentAlpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.3;
        const alphaClamped = Math.max(0.1, Math.min(0.95, currentAlpha));

        const dx = animate ? (mouse.x - width / 2) * (star.size * 0.01) : 0;
        const dy = animate ? (mouse.y - height / 2) * (star.size * 0.01) : 0;

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alphaClamped;
        ctx.beginPath();
        ctx.arc(star.x + dx, star.y + dy, star.size, 0, Math.PI * 2);
        ctx.fill();

        if (star.size > 1.6 && alphaClamped > 0.75) {
          ctx.strokeStyle = "rgba(205, 159, 91, 0.4)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x + dx - 3.5, star.y + dy);
          ctx.lineTo(star.x + dx + 3.5, star.y + dy);
          ctx.moveTo(star.x + dx, star.y + dy - 3.5);
          ctx.lineTo(star.x + dx, star.y + dy + 3.5);
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
          grad.addColorStop(1, `rgba(205, 159, 91, ${ss.alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
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
