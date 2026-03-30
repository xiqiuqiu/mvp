# Smart ATC MVP — 智能航图指令可视化系统设计文档

**版本:** v1.0  
**日期:** 2026-03-30  
**状态:** 待审

---

## 一、概述

### 问题

航空管制中，高频语音指令带来的认知负荷极高。飞行员复述塔台滑行指令时，缺乏直觉化的视觉确认手段，极易引发跑道侵入(Runway Incursion)。

### 方案

构建一个纯前端MVP系统，运行于飞行员EFB(Electronic Flight Bag) iPad端。飞行员复述塔台指令时，系统实时语音识别、LLM解析为结构化指令、并在航图上高亮渲染滑行路径。核心理念：**所说即所画**。

### 目标用户

航空公司飞行员（EFB端）。

### 验证机场

西安咸阳国际机场 (ICAO: ZLXY)。

---

## 二、系统架构

### 管线式模块化 (Pipeline Architecture)

四模块单向数据流：

```
Voice Module → NLU Module → Topology Module → Renderer Module
(Web Speech)   (LLM API)    (Graph JSON)      (Canvas 2D)
```

#### 2.1 Voice Module (`useVoiceRecognition`)

- **技术:** Web Speech API (SpeechRecognition)
- **输入:** 飞行员语音（按住麦克风或Space键触发）
- **输出:** `{ text: string, confidence: number, status: 'idle' | 'listening' | 'done' }`
- **容错:** confidence < 0.6 时提示重说

#### 2.2 NLU Module (`useInstructionParser`)

- **技术:** 云端LLM API (GPT-4o / Claude)
- **输入:** 语音识别文本
- **输出:**
  ```typescript
  interface ParsedInstruction {
    action: 'taxi' | 'hold' | 'cross' | 'lineup';
    runway: '05R' | '05L' | '23L' | '23R';
    route: string[];        // 有序路径节点名, e.g. ["A", "C", "B"]
    holdPoint: string | null;
  }
  ```
- **Prompt策略:** 系统提示中硬编码ZLXY可用滑行道/跑道枚举，约束LLM输出为严格JSON
- **容错:** JSON Schema校验失败时自动重试一次

#### 2.3 Topology Module (`useTopologyResolver`)

- **技术:** 纯前端邻接表图数据
- **输入:** `ParsedInstruction.route` (路径节点名序列)
- **输出:** `TaxiNode[]` (带Canvas坐标的节点序列)
- **关键能力:** L3连通性校验——检查route中相邻节点是否在edges中存在，捕获LLM幻觉产生的不可能路径

#### 2.4 Renderer (`AirportCanvas`)

- **技术:** Canvas 2D API
- **四层绘制栈:**
  1. L1 背景网格 (静态)
  2. L2 滑行道网络 (静态, 暗灰)
  3. L3 跑道 (静态)
  4. L4 高亮路径 (动态, 冰蓝渐变+呼吸动画)

### 状态管理

React `useReducer` + `Context`，单一状态树：

```typescript
interface AppState {
  voice: { text: string; confidence: number; status: VoiceStatus };
  instruction: ParsedInstruction | null;
  resolvedPath: TaxiNode[] | null;
  validation: { connected: boolean; errors: string[] };
  llmStatus: 'idle' | 'loading' | 'error';
}
```

---

## 三、ZLXY 拓扑数据模型

### 数据类型

```typescript
interface TaxiNode {
  id: string;           // 唯一标识, e.g. "A2"
  x: number;            // Canvas X坐标
  y: number;            // Canvas Y坐标
  label: string;        // 显示标签, e.g. "A"
  type: 'intersection' | 'hold' | 'gate';
  hotspot?: string;     // 热点标识, e.g. "HS1"
}

interface TaxiEdge {
  from: string;         // 起始节点ID
  to: string;           // 终止节点ID
  taxiway: string;      // 所属滑行道名, e.g. "C"
  length: number;       // 视觉分段长度
  bidirectional: boolean;
}

interface RunwayData {
  id: string;           // "05R/23L"
  x1: number; y1: number;
  x2: number; y2: number;
  heading: number;
}

interface AirportTopology {
  icao: string;         // "ZLXY"
  nodes: Map<string, TaxiNode>;
  edges: TaxiEdge[];
  runways: RunwayData[];
}
```

### 简化拓扑骨架 (MVP)

- **双跑道:** 05R/23L (北), 05L/23R (南)
- **主滑行道:** A (西纵), B (东纵), C (中横), D (北连接), E (南连接)
- **10个交叉节点:** A1-A3, B1-B3, D1-D2, E1-E2
- **1个热点:** HS1 (A2, A道与C道交叉)

> 此为简化示意拓扑。后续需依ZLXY 81.pdf航图精确校准坐标与补充缺失节点。

---

## 四、视觉设计

### 风格

**深蓝混合风** — 深蓝灰底 (#0f1923) + 冰蓝渐变路径 (#4a9eff → #00d4ff)。兼顾Boeing航电HUD之科技感与全光照可读性。

### 色彩系统

| 用途 | 色值 | 说明 |
|------|------|------|
| 背景 | `#0a1018` | 最深层 |
| 面板底 | `#0f1923` | 主背景 |
| 网格线 | `#1a3040` | 极淡辅助 |
| 滑行道(静默) | `#2a4a5a` | 暗灰蓝 |
| 高亮路径起 | `#4a9eff` | 冰蓝 |
| 高亮路径止 | `#00d4ff` | 亮青 |
| 文本主色 | `#8ab4e0` | 淡蓝白 |
| 文本次色 | `#4a6a8a` | 暗蓝灰 |
| 成功 | `#66cc88` | 柔绿 |
| 警告 | `#ff8c4a` | 橙 |
| 错误/热点 | `#ff4444` | 红 |

### 界面布局

三区纵向分割：

1. **顶栏 (48px):** 品牌标识 "✈ Smart ATC" + 机场徽章(ZLXY) + LLM/ASR状态灯
2. **航图画布 (主体满屏):** Canvas四层渲染 + 右上角指令解析浮窗
3. **语音栏 (底部88px):** 居中麦克风按钮(含脉冲动画) + 波形可视化 + 实时转写文本

### 动画

- 高亮路径: 呼吸式透明度脉动 (opacity 0.6↔1, 2s循环)
- 飞机位置: 扩散光环 (radius 10→20, 2s循环)
- 麦克风: 外圈脉冲 (listening状态)
- 波形条: 随机高度震荡 (listening状态)

---

## 五、容错三层防线

| 层级 | 模块 | 机制 | 用户反馈 |
|------|------|------|----------|
| L1 | Voice | confidence < 0.6 拒绝 | 语音栏闪橙 + 提示"请重述" |
| L2 | NLU | JSON Schema校验 + 自动重试1次 | 浮窗显示"解析中…" |
| L3 | Topology | 路径连通性检查 | 浮窗红色警告"路径不连通" + 断点标红 |

L3为MVP关键差异点——即便LLM产生幻觉，拓扑层仍可捕获不可能路径。

---

## 六、工程结构

```
y-jihcang-demo/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── hooks/
│   │   ├── useVoiceRecognition.ts
│   │   ├── useInstructionParser.ts
│   │   └── useTopologyResolver.ts
│   ├── components/
│   │   ├── TopBar.tsx
│   │   ├── AirportCanvas.tsx
│   │   ├── VoiceBar.tsx
│   │   └── InstructionPanel.tsx
│   ├── data/
│   │   └── zlxy-topology.ts
│   ├── utils/
│   │   ├── canvasRenderer.ts
│   │   ├── pathValidator.ts
│   │   └── llmPrompt.ts
│   └── types/
│       └── atc.ts
├── .env                           # LLM_API_KEY
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### 技术栈

- React 18 + TypeScript
- Vite (构建)
- Canvas 2D API (渲染)
- Web Speech API (语音识别)
- 云端LLM API (指令解析)
- 零后端、零数据库

---

## 七、MVP范围边界

### 包含

- 单机场 (ZLXY) 硬编码拓扑
- 语音实时识别 → LLM解析 → 路径高亮
- 三层容错
- 深蓝视觉主题

### 明确排除

- 多机场切换
- 指令历史记录
- 多语言支持
- 冲突预测/碰撞检测
- 用户认证
- 后端服务
- 离线模式
- 日间浅色主题 (后续迭代)

---

## 八、演进路线 (Post-MVP)

1. **v0.2:** 指令历史面板 + 文本手动修正
2. **v0.3:** Hot Spot警告标注 + 日/夜主题切换
3. **v0.4:** 多机场支持 (拓扑数据外置为JSON文件)
4. **v1.0:** 图数据库引入 + 最短路径算法 + 冲突预检
5. **v2.0:** ADS-B实时位置流接入 + 大数据AI预测
