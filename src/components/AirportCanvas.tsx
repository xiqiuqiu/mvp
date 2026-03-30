// src/components/AirportCanvas.tsx
import React, { useRef, useEffect, useState } from 'react';
import type { AirportTopology, TaxiNode } from '../types/atc';
import { drawOverlay, drawTaxiways, drawRunways, drawHighlightPath } from '../utils/canvasRenderer';

interface Props {
  topology: AirportTopology;
  highlightPath: TaxiNode[] | null;
  overlayOpacity: number;
}

export const AirportCanvas: React.FC<Props> = ({ topology, highlightPath, overlayOpacity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load the chart image once
  useEffect(() => {
    const img = new Image();
    img.src = '/charts/ZLXY81.jpg'; // We keep it in public directory
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded || !imgRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = Date.now();

    const render = () => {
      // Calculate continuous pulse between 0 and 1 for 2s cycle
      const elapsed = Date.now() - startTime;
      const pulseCycle = (elapsed % 2000) / 2000;
      const animationPulse = Math.abs(Math.sin(pulseCycle * Math.PI));

      // 1. Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Real Chart Image (L0)
      ctx.globalAlpha = 1.0;
      ctx.drawImage(imgRef.current!, 0, 0, canvas.width, canvas.height);

      // 3. Draw Mask Overlay (L1)
      drawOverlay(ctx, canvas.width, canvas.height, overlayOpacity);

      // 4. Draw Digitized Taxiways (L2)
      drawTaxiways(ctx, topology);

      // 5. Draw Runways (L3)
      drawRunways(ctx, topology);

      // 6. Draw Active Highlight Path (L4)
      if (highlightPath && highlightPath.length > 0) {
        drawHighlightPath(ctx, highlightPath, animationPulse);
      }

      // Loop
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [topology, highlightPath, overlayOpacity, imgLoaded]);

  return (
    <div className="canvas-container">
      {!imgLoaded && <div className="loading-chart">Loading airport chart...</div>}
      <canvas
        ref={canvasRef}
        width={1400} // Logical width, scaled by CSS
        height={1000} // Logical height
        className="airport-canvas"
      />
    </div>
  );
};
