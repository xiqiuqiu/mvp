// src/utils/canvasRenderer.ts
import type { AirportTopology, TaxiNode } from '../types/atc';

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = '#0f1923';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawTaxiways(
  ctx: CanvasRenderingContext2D,
  topology: AirportTopology
) {
  ctx.save();
  ctx.strokeStyle = '#2a4a5a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const edge of topology.edges) {
    const fromNode = topology.nodes[edge.from];
    const toNode = topology.nodes[edge.to];
    if (fromNode && toNode) {
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
    }
  }

  // Draw node points
  ctx.fillStyle = '#4a6a8a';
  for (const key in topology.nodes) {
    const node = topology.nodes[key];
    ctx.beginPath();
    ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw hotspot indicator if present
    if (node.hotspot) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawRunways(
  ctx: CanvasRenderingContext2D,
  topology: AirportTopology
) {
  ctx.save();
  for (const runway of topology.runways) {
    // Background runway strip
    ctx.strokeStyle = '#3a5a3a';
    ctx.lineWidth = 12;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(runway.x1, runway.y1);
    ctx.lineTo(runway.x2, runway.y2);
    ctx.stroke();

    // Center dashed line
    ctx.strokeStyle = '#5a8a5a';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(runway.x1, runway.y1);
    ctx.lineTo(runway.x2, runway.y2);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Text labels
    ctx.fillStyle = '#6a9a6a';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Simplistic placement of labels at the edges
    // A full implementation would calculate angles, but we just place near endpoints
    ctx.fillText(runway.id.split('/')[0], runway.x1 - 20, runway.y1);
    ctx.fillText(runway.id.split('/')[1], runway.x2 + 20, runway.y2);
  }
  ctx.restore();
}

export function drawHighlightPath(
  ctx: CanvasRenderingContext2D,
  path: TaxiNode[],
  animationPulse: number // 0 to 1 value for pulsing effect
) {
  if (!path || path.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw glow
  ctx.strokeStyle = '#4a9eff';
  ctx.globalAlpha = 0.2 + (0.1 * animationPulse); // Pulse glow opacity
  ctx.lineWidth = 14 + (4 * animationPulse); // Pulse glow width
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  // Draw core path line
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = 5;
  const gradient = ctx.createLinearGradient(
    path[0].x, path[0].y, 
    path[path.length - 1].x, path[path.length - 1].y
  );
  gradient.addColorStop(0, '#4a9eff');
  gradient.addColorStop(1, '#00d4ff');
  ctx.strokeStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  // Draw end point indicator
  const endNode = path[path.length - 1];
  ctx.fillStyle = '#00d4ff';
  ctx.beginPath();
  ctx.arc(endNode.x, endNode.y, 6 + (2 * animationPulse), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
