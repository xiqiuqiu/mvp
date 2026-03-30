import React, { useRef, useEffect, useState } from 'react';
import type { TaxiNode, TaxiEdge } from '../types/atc';
import type { ToolMode } from './EditorApp';

interface Props {
  nodes: Record<string, TaxiNode>;
  edges: TaxiEdge[];
  mode: ToolMode;
  selectedNodeId: string | null;
  connectStartNode: string | null;
  onClickCanvas: (x: number, y: number) => void;
  onNodeDrag?: (id: string, x: number, y: number) => void;
}

export const EditorCanvas: React.FC<Props> = ({ 
  nodes, edges, mode, selectedNodeId, connectStartNode, onClickCanvas, onNodeDrag
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = 'https://pic1.imgdb.cn/item/69ca0d7d9547e6ce4e3dd74f.jpg';
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
  }, []);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    const { x, y } = coords;

    let clickedNodeId: string | null = null;
    const threshold = 15;
    for (const [id, node] of Object.entries(nodes)) {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist < threshold) {
        clickedNodeId = id;
        break;
      }
    }

    if (clickedNodeId && mode === 'select') {
      setDraggingNodeId(clickedNodeId);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    
    // Always call click to handle selection/adding/connecting
    onClickCanvas(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingNodeId && mode === 'select' && onNodeDrag) {
      const coords = getCanvasCoords(e);
      if (!coords) return;
      onNodeDrag(draggingNodeId, coords.x, coords.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded || !imgRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image with lower opacity so we can see nodes
      ctx.globalAlpha = 0.8;
      ctx.drawImage(imgRef.current!, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;

      // Draw edges
      ctx.lineWidth = 4;
      edges.forEach(edge => {
        const from = nodes[edge.from];
        const to = nodes[edge.to];
        if (!from || !to) return;

        ctx.strokeStyle = edge.bidirectional ? '#00BFFF' : '#FFD700'; // blue or gold
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });

      // Draw nodes
      Object.values(nodes).forEach(node => {
        const isSelected = selectedNodeId === node.id;
        const isConnecting = connectStartNode === node.id;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        
        if (isSelected || isConnecting) {
          ctx.fillStyle = '#FF0000'; // red for selected/active
        } else {
          const colorMap: Record<string, string> = {
            intersection: '#0f0',
            hold: '#f90',
            gate: '#f0f',
            runway_entrance: '#0ff',
            stand: '#ee82ee'
          };
          ctx.fillStyle = colorMap[node.type] || '#fff';
        }
        
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const text = node.label || node.id;
        ctx.strokeText(text, node.x + 12, node.y + 4);
        ctx.fillText(text, node.x + 12, node.y + 4);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [nodes, edges, imgLoaded, selectedNodeId, connectStartNode]);

  return (
    <div className="editor-canvas-wrapper">
      {!imgLoaded && <div>Loading Chart...</div>}
      <canvas
        ref={canvasRef}
        width={1400} // Same as main canvas
        height={1000}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`editor-canvas ${mode}`}
      />
    </div>
  );
};
