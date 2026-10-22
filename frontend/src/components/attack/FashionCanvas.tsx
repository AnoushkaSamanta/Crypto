"use client";

import React, { useEffect, useRef } from "react";

interface FashionCanvasProps {
  image: number[][]; // 28x28 normalized array [0, 1]
  size?: number;     // Display size in pixels (default: 140)
  className?: string;
}

export const FashionCanvas: React.FC<FashionCanvasProps> = ({
  image,
  size = 140,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || image.length !== 28) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(28, 28);
    const data = imgData.data;

    for (let r = 0; r < 28; r++) {
      for (let c = 0; c < 28; c++) {
        const val = image[r]?.[c] ?? 0;
        const pixelVal = Math.floor(Math.max(0, Math.min(1, val)) * 255);
        const idx = (r * 28 + c) * 4;

        // Grayscale pixel (white background/black garment or standard inverted)
        data[idx] = pixelVal;     // R
        data[idx + 1] = pixelVal; // G
        data[idx + 2] = pixelVal; // B
        data[idx + 3] = 255;      // A
      }
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = 28;
    offscreen.height = 28;
    const offCtx = offscreen.getContext("2d");
    if (offCtx) {
      offCtx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(offscreen, 0, 0, size, size);
    }
  }, [image, size]);

  return (
    <div
      className={`relative inline-flex items-center justify-center p-2 rounded-2xl bg-[#0F172A] border border-slate-300 shadow-sm ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg shadow-inner"
        style={{
          imageRendering: "pixelated",
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    </div>
  );
};
