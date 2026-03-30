import React, { useState } from 'react';
import type { TaxiNode, TaxiEdge, AirportTopology } from '../types/atc';
import type { ToolMode } from './EditorApp';
import { zlxyTopology } from '../data/zlxy-topology';

interface Props {
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
  nodes: Record<string, TaxiNode>;
  edges: TaxiEdge[];
  selectedNodeId: string | null;
  selectedEdgeIdx: number | null;
  onUpdateNode: (id: string, updates: Partial<TaxiNode>) => void;
  onDeleteNode: (id: string) => void;
  onLoadData: (data: AirportTopology) => void;
}

export const Sidebar: React.FC<Props> = ({
  mode, setMode, nodes, edges, selectedNodeId, selectedEdgeIdx, 
  onUpdateNode, onDeleteNode, onLoadData
}) => {
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const selectedEdge = selectedEdgeIdx !== null ? edges[selectedEdgeIdx] : null;
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const getJsonStr = () => {
    const topology: AirportTopology = {
      icao: "ZLXY",
      nodes: nodes,
      edges: edges,
      runways: []
    };
    return JSON.stringify(topology, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getJsonStr()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    onLoadData(zlxyTopology);
  };

  // Export panel (modal-like overlay)
  if (showExport) {
    return (
      <div className="editor-sidebar">
        <h2>Export Result</h2>
        <textarea
          className="export-textarea"
          readOnly
          value={getJsonStr()}
          onFocus={e => e.target.select()}
        />
        <div className="actions">
          <button
            onClick={handleCopy}
            style={{ background: copied ? '#2ecc40' : '#4CAF50', color: 'white' }}
          >
            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
          </button>
          <button onClick={() => setShowExport(false)}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-sidebar">
      <h2>Editor Tools</h2>
      <div className="tool-buttons">
        <button className={mode === 'select' ? 'active' : ''} onClick={() => setMode('select')}>Select</button>
        <button className={mode === 'add_node' ? 'active' : ''} onClick={() => setMode('add_node')}>Add Node</button>
        <button className={mode === 'connect' ? 'active' : ''} onClick={() => setMode('connect')}>Connect</button>
      </div>

      <div className="stats">
        <div>Total Nodes: {Object.keys(nodes).length}</div>
        <div>Total Edges: {edges.length}</div>
      </div>

      <div className="actions">
        <button onClick={handleImport}>Load ZLXY Topology</button>
        <button onClick={() => setShowExport(true)} style={{ background: '#4CAF50', color: 'white' }}>Export JSON</button>
      </div>

      <hr />

      {selectedNode && (
        <div className="properties">
          <h3>Node Properties</h3>
          <div className="form-group">
            <label>ID (auto-gen):</label>
            <input type="text" value={selectedNode.id} disabled />
          </div>
          <div className="form-group">
            <label>Label:</label>
            <input 
              type="text" 
              value={selectedNode.label} 
              onChange={e => onUpdateNode(selectedNode.id, { label: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Type:</label>
            <select 
              value={selectedNode.type}
              onChange={e => onUpdateNode(selectedNode.id, { type: e.target.value as any })}
            >
              <option value="intersection">Intersection</option>
              <option value="runway_entrance">Runway Entrance</option>
              <option value="hold">Hold (Runway)</option>
              <option value="gate">Gate</option>
              <option value="stand">Stand</option>
            </select>
          </div>
          <button className="del-btn" onClick={() => onDeleteNode(selectedNode.id)}>Delete Node</button>
        </div>
      )}

      {selectedEdge && (
        <div className="properties">
          <h3>Edge Properties</h3>
        </div>
      )}

      {!selectedNode && !selectedEdge && mode === 'select' && (
        <div className="hint">Click a node on the canvas to edit.</div>
      )}
    </div>
  );
};
