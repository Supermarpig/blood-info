"use client";

import { useEffect, useRef } from "react";

// 與首頁 HeroSection 完全相同的血滴 path（viewBox 0 0 100 120）
const DROP_SVG_PATH = "M50 8 C50 8, 14 58, 14 78 C14 99 30 112 50 112 C70 112 86 99 86 78 C86 58 50 8 50 8 Z";

interface Drop {
  x: number;
  y: number;
  width: number;   // px，對應 viewBox 寬 100
  speed: number;
  opacity: number;
  wobblePhase: number;
  wobbleAmp: number;
  wobbleSpeed: number;
}

export default function NotFoundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 預先建立 Path2D，只建一次
    const dropPath = new Path2D(DROP_SVG_PATH);

    const drops: Drop[] = Array.from({ length: 14 }, (_, i) => ({
      x: (window.innerWidth / 14) * i + Math.random() * 60,
      y: Math.random() * window.innerHeight,
      width: 14 + Math.random() * 24,   // 血滴寬度 px
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.15 + Math.random() * 0.15,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 5 + Math.random() * 8,
      wobbleSpeed: 0.5 + Math.random() * 0.7,
    }));

    let t = 0;

    function drawDrop(x: number, y: number, width: number, opacity: number) {
      // viewBox 100x120，scale = width/100，高度 = width * 1.2
      const scale = width / 100;
      const height = width * 1.2;

      ctx!.save();
      ctx!.globalAlpha = opacity;
      // 以血滴中心 (x, y) 為基準定位
      ctx!.translate(x - width / 2, y - height / 2);
      ctx!.scale(scale, scale);
      ctx!.fillStyle = "#dc2626";
      ctx!.fill(dropPath);
      ctx!.restore();
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      t += 0.016;

      for (const d of drops) {
        const wx = d.x + Math.sin(t * d.wobbleSpeed + d.wobblePhase) * d.wobbleAmp;
        drawDrop(wx, d.y, d.width, d.opacity);
        d.y -= d.speed;
        if (d.y + d.width * 1.2 < 0) {
          d.y = canvas!.height + d.width * 1.2;
          d.x = Math.random() * canvas!.width;
        }
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
