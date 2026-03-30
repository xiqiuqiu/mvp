interface TaxiNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'intersection' | 'stand' | 'runway_entrance';
  hotspot?: string;
}

interface TaxiEdge {
  from: string;
  to: string;
  taxiway: string;
  bidirectional: boolean;
}

interface RunwayData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  heading: number;
}

const nodes: Record<string, TaxiNode> = {
  // --- 北跑道 05L/23R 联络道 (A 系列) ---
  A10: { id: 'A10', x: 155, y: 238, label: 'A10', type: 'runway_entrance' },
  A9:  { id: 'A9',  x: 255, y: 238, label: 'A9',  type: 'intersection' },
  A8:  { id: 'A8',  x: 375, y: 238, label: 'A8',  type: 'intersection' },
  A7:  { id: 'A7',  x: 485, y: 238, label: 'A7',  type: 'intersection' },
  A6:  { id: 'A6',  x: 585, y: 238, label: 'A6',  type: 'intersection', hotspot: 'HS1' },
  A5:  { id: 'A5',  x: 655, y: 238, label: 'A5',  type: 'intersection' },
  A4:  { id: 'A4',  x: 775, y: 238, label: 'A4',  type: 'intersection' },
  A3:  { id: 'A3',  x: 875, y: 238, label: 'A3',  type: 'intersection' },
  A2:  { id: 'A2',  x: 1015, y: 238, label: 'A2', type: 'intersection' },
  A1:  { id: 'A1',  x: 1145, y: 238, label: 'A1', type: 'runway_entrance' },

  // --- 中跑道 05C/23C 联络道 (N 系列) ---
  N13: { id: 'N13', x: 235, y: 730, label: 'N13', type: 'runway_entrance' },
  N12: { id: 'N12', x: 335, y: 730, label: 'N12', type: 'intersection' },
  N9:  { id: 'N9',  x: 635, y: 730, label: 'N9',  type: 'intersection' },
  N8:  { id: 'N8',  x: 735, y: 730, label: 'N8',  type: 'intersection' },
  N3:  { id: 'N3',  x: 915, y: 730, label: 'N3',  type: 'intersection', hotspot: 'HS4' },
  N2:  { id: 'N2',  x: 1015, y: 730, label: 'N2', type: 'intersection' },
  N1:  { id: 'N1',  x: 1145, y: 730, label: 'N1', type: 'runway_entrance' },

  // --- 平行滑行道 M 系列 (中南跑道之间) ---
  M14: { id: 'M14', x: 215, y: 685, label: 'M14', type: 'intersection' },
  M12: { id: 'M12', x: 315, y: 685, label: 'M12', type: 'intersection' },
  M7:  { id: 'M7',  x: 635, y: 685, label: 'M7',  type: 'intersection' },
  M1:  { id: 'M1',  x: 1145, y: 685, label: 'M1', type: 'intersection' },

  // --- 关键南北横向连接 (J, L, D 区域) ---
  J2:  { id: 'J2',  x: 585, y: 300, label: 'J2',  type: 'intersection' },
  J3:  { id: 'J3',  x: 625, y: 300, label: 'J3',  type: 'intersection' },
  D1:  { id: 'D1',  x: 915, y: 650, label: 'D1',  type: 'intersection', hotspot: 'HS3' },
};

const edges: TaxiEdge[] = [
  // A 滑行道主轴
  { from: 'A10', to: 'A9', taxiway: 'A', bidirectional: true },
  { from: 'A9', to: 'A8', taxiway: 'A', bidirectional: true },
  { from: 'A8', to: 'A7', taxiway: 'A', bidirectional: true },
  { from: 'A7', to: 'A6', taxiway: 'A', bidirectional: true },
  { from: 'A6', to: 'A5', taxiway: 'A', bidirectional: true },
  { from: 'A5', to: 'A4', taxiway: 'A', bidirectional: true },
  { from: 'A4', to: 'A3', taxiway: 'A', bidirectional: true },
  { from: 'A3', to: 'A2', taxiway: 'A', bidirectional: true },
  { from: 'A2', to: 'A1', taxiway: 'A', bidirectional: true },

  // N 滑行道主轴 (中跑道)
  { from: 'N13', to: 'N12', taxiway: 'N', bidirectional: true },
  { from: 'N12', to: 'N9',  taxiway: 'N', bidirectional: true },
  { from: 'N9',  to: 'N8',  taxiway: 'N', bidirectional: true },
  { from: 'N8',  to: 'N3',  taxiway: 'N', bidirectional: true },
  { from: 'N3',  to: 'N2',  taxiway: 'N', bidirectional: true },
  { from: 'N2',  to: 'N1',  taxiway: 'N', bidirectional: true },

  // 纵向连接示例
  { from: 'A6', to: 'J2', taxiway: 'J2', bidirectional: true },
  { from: 'N3', to: 'D1', taxiway: 'D1', bidirectional: true },
];

const runways: RunwayData[] = [
  { id: '05L/23R', x1: 100, y1: 215, x2: 1300, y2: 215, heading: 52 },
  { id: '05C/23C', x1: 100, y1: 710, x2: 1300, y2: 710, heading: 52 },
  { id: '05R/23L', x1: 300, y1: 855, x2: 1000, y2: 855, heading: 52 },
];