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
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });

  // Load the chart image once
  useEffect(() => {
    const img = new Image();
    img.src = 'https://pic1.imgdb.cn/item/69ca0d7d9547e6ce4e3dd74f.jpg';
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
  }, []);

  // Gesture Zoom and Pan Handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getMousePos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
        scaleX,
        scaleY
      };
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pos = getMousePos(e.clientX, e.clientY);
      const { scale, x, y } = transformRef.current;
      
      let zoomFactor = Math.exp(-e.deltaY * 0.002);
      // Fallback for pinch on some trackpads which use e.ctrlKey and deltaY
      if (e.ctrlKey) {
        zoomFactor = Math.exp(-e.deltaY * 0.01);
      }
      
      const newScale = Math.min(Math.max(scale * zoomFactor, 0.5), 20);

      const px = (pos.x - x) / scale;
      const py = (pos.y - y) / scale;

      const newX = pos.x - px * newScale;
      const newY = pos.y - py * newScale;

      transformRef.current = { scale: newScale, x: newX, y: newY };
    };

    const activePointers = new Map<number, { x: number; y: number }>();

    const handlePointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      e.preventDefault();

      const prevPos = activePointers.get(e.pointerId)!;
      const curPos = { x: e.clientX, y: e.clientY };

      if (activePointers.size === 1) {
        // Pan
        const dx = curPos.x - prevPos.x;
        const dy = curPos.y - prevPos.y;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        transformRef.current.x += dx * scaleX;
        transformRef.current.y += dy * scaleY;
      } else if (activePointers.size === 2) {
        // Pinch Zoom
        const pointers = Array.from(activePointers.entries());
        const [id1, p1] = pointers[0];
        const [id2, p2] = pointers[1];

        const p1_cur = id1 === e.pointerId ? curPos : p1;
        const p2_cur = id2 === e.pointerId ? curPos : p2;

        const prevDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const curDist = Math.hypot(p1_cur.x - p2_cur.x, p1_cur.y - p2_cur.y);

        if (prevDist > 0) {
          const ratio = curDist / prevDist;
          const { scale, x, y } = transformRef.current;
          const newScale = Math.min(Math.max(scale * ratio, 0.5), 20);

          const cx = (p1.x + p2.x) / 2;
          const cy = (p1.y + p2.y) / 2;

          const pos = getMousePos(cx, cy);

          const px = (pos.x - x) / scale;
          const py = (pos.y - y) / scale;

          let newX = pos.x - px * newScale;
          let newY = pos.y - py * newScale;

          // Add pan from midpoint change
          const curCx = (p1_cur.x + p2_cur.x) / 2;
          const curCy = (p1_cur.y + p2_cur.y) / 2;
          const dx = (curCx - cx) * pos.scaleX;
          const dy = (curCy - cy) * pos.scaleY;

          newX += dx;
          newY += dy;

          transformRef.current = { scale: newScale, x: newX, y: newY };
        }
      }

      activePointers.set(e.pointerId, curPos);
    };

    const handlePointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      canvas.releasePointerCapture(e.pointerId);
    };

    let resetAnimation: number | null = null;
    const handleDoubleClick = () => {
      const startScale = transformRef.current.scale;
      const startX = transformRef.current.x;
      const startY = transformRef.current.y;
      const startTime = performance.now();

      const animateReset = (time: number) => {
        const progress = Math.min((time - startTime) / 400, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
        
        transformRef.current = {
          scale: startScale + (1 - startScale) * ease,
          x: startX + (0 - startX) * ease,
          y: startY + (0 - startY) * ease
        };

        if (progress < 1) {
          resetAnimation = requestAnimationFrame(animateReset);
        }
      };
      
      if (resetAnimation) cancelAnimationFrame(resetAnimation);
      resetAnimation = requestAnimationFrame(animateReset);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('dblclick', handleDoubleClick);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      if (resetAnimation) cancelAnimationFrame(resetAnimation);
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
      const elapsed = Date.now() - startTime;
      const pulseCycle = (elapsed % 2000) / 2000;
      const animationPulse = Math.abs(Math.sin(pulseCycle * Math.PI));

      // 1. Clear Canvas using identity transform
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom & pan transforms
      const { scale, x, y } = transformRef.current;
      ctx.setTransform(scale, 0, 0, scale, x, y);

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
        style={{ touchAction: 'none', cursor: 'grab' }}
      />
    </div>
  );
};
