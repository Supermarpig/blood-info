"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const COLORS = [
  "#ff6b6b", // 紅
  "#ffd93d", // 黃
  "#6bcb77", // 綠
  "#4d96ff", // 藍
  "#ff9ff3", // 粉紅
  "#a55eea", // 紫
  "#ff9f43", // 橘
  "#1dd1a1", // 青綠
];

const GRAVITY = 0.15;
const FRICTION = 0.99;
const WIND_VARIANCE = 0.3;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "star" | "heart";
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

export default function Confetti({ isActive, duration = 4000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const createParticle = useCallback(
    (centerX: number, topY: number): Particle => {
      const shapes: Particle["shape"][] = ["circle", "square", "star", "heart"];
      return {
        x: centerX + (Math.random() - 0.5) * 200,
        y: topY,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 20 - 10,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        size: 8 + Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.1,
        opacity: 1,
      };
    },
    []
  );

  const drawStar = useCallback(
    (ctx: CanvasRenderingContext2D, size: number) => {
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
    []
  );

  const drawHeart = useCallback(
    (ctx: CanvasRenderingContext2D, size: number) => {
      const s = size / 2;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s, -s * 0.5, -s, s * 0.5, 0, s);
      ctx.bezierCurveTo(s, s * 0.5, s, -s * 0.5, 0, s * 0.3);
      ctx.closePath();
      ctx.fill();
    },
    []
  );

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      switch (p.shape) {
        case "circle":
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "square":
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;
        case "star":
          drawStar(ctx, p.size);
          break;
        case "heart":
          drawHeart(ctx, p.size);
          break;
      }
      ctx.restore();
    },
    [drawStar, drawHeart]
  );

  const updateParticle = useCallback((p: Particle, height: number): boolean => {
    p.wobble += p.wobbleSpeed;
    p.vx += Math.sin(p.wobble) * WIND_VARIANCE;
    p.vx *= FRICTION;
    p.vy += GRAVITY;
    p.vy *= FRICTION;

    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;

    if (p.y > height * 0.8) {
      p.opacity -= 0.02;
    }

    return p.opacity > 0 && p.y < height + 50;
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 設置 canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const topY = canvas.height * 0.2;

    // 分批發射粒子
    const particles = particlesRef.current;
    particles.length = 0;

    // 第一波爆發
    for (let i = 0; i < 80; i++) {
      setTimeout(() => {
        particles.push(createParticle(centerX, topY));
      }, i * 10);
    }

    // 第二波
    setTimeout(() => {
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          particles.push(createParticle(centerX, topY - 50));
        }, i * 15);
      }
    }, 300);

    // 動畫循環
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (updateParticle(p, canvas.height)) {
          drawParticle(ctx, p);
        } else {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // 清除定時器
    const cleanupTimer = setTimeout(() => {
      cancelAnimationFrame(animationRef.current);
      particles.length = 0;
    }, duration);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(cleanupTimer);
      particles.length = 0;
    };
  }, [isActive, duration, createParticle, updateParticle, drawParticle]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}
