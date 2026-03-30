import React, { useState } from 'react';
import type { TaxiNode, TaxiEdge, AirportTopology } from '../types/atc';
import { EditorCanvas } from './EditorCanvas';
import { Sidebar } from './Sidebar';
import './editor.css';

export type ToolMode = 'add_node' | 'connect' | 'select';

export const EditorApp: React.FC = () => {
  const [nodes, setNodes] = useState<Record<string, TaxiNode>>({});
  const [edges, setEdges] = useState<TaxiEdge[]>([]);
  
  const [mode, setMode] = useState<ToolMode>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeIdx, setSelectedEdgeIdx] = useState<number | null>(null);
  
  // For 'connect' mode
  const [connectStartNode, setConnectStartNode] = useState<string | null>(null);

  const handleCanvasClick = (x: number, y: number) => {
    // Determine if we clicked on an existing node
    let clickedNodeId: string | null = null;
    const threshold = 15; // px distance to click a node
    for (const [id, node] of Object.entries(nodes)) {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist < threshold) {
        clickedNodeId = id;
        break;
      }
    }

    if (mode === 'add_node') {
      if (!clickedNodeId) {
        // Create new node
        const id = `N${Date.now()}`;
        const newNode: TaxiNode = {
          id,
          x,
          y,
          label: id,
          type: 'intersection'
        };
        setNodes(prev => ({ ...prev, [id]: newNode }));
        setSelectedNodeId(id);
        setSelectedEdgeIdx(null);
      } else {
        setSelectedNodeId(clickedNodeId);
        setSelectedEdgeIdx(null);
      }
    } else if (mode === 'select') {
      setSelectedNodeId(clickedNodeId);
      // TODO: edge selection logic if needed
      setSelectedEdgeIdx(null); 
    } else if (mode === 'connect') {
      if (clickedNodeId) {
        if (!connectStartNode) {
          setConnectStartNode(clickedNodeId);
        } else {
          if (connectStartNode !== clickedNodeId) {
            // Create edge
            const newEdge: TaxiEdge = {
              from: connectStartNode,
              to: clickedNodeId,
              taxiway: 'TWY',
              bidirectional: true
            };
            setEdges(prev => [...prev, newEdge]);
          }
          // Reset connection start
          setConnectStartNode(null);
        }
      } else {
        // Clicked empty space, reset connection
        setConnectStartNode(null);
      }
    }
  };

  const handleNodeDrag = (id: string, x: number, y: number) => {
    setNodes(prev => ({
      ...prev,
      [id]: { ...prev[id], x: Math.round(x), y: Math.round(y) }
    }));
  };

  const handleUpdateNode = (id: string, updates: Partial<TaxiNode>) => {
    setNodes(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // also delete connected edges
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const loadData = (data: AirportTopology) => {
    if (data.nodes) setNodes(data.nodes);
    if (data.edges) setEdges(data.edges);
  };

  return (
    <div className="editor-container">
      <Sidebar 
        mode={mode} 
        setMode={(m: ToolMode) => {
          setMode(m);
          setConnectStartNode(null); // reset state when mode changes
        }}
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        selectedEdgeIdx={selectedEdgeIdx}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onLoadData={loadData}
      />
      <div className="editor-main">
        <div className="editor-mode-hint">
          {mode === 'add_node' && 'Mode: Add Nodes. Click anywhere to add a node.'}
          {mode === 'select' && 'Mode: Select. Click a node to edit its properties.'}
          {mode === 'connect' && (
            connectStartNode 
              ? `Mode: Connect. Click another node to connect with ${connectStartNode}.`
              : 'Mode: Connect. Click a starting node.'
          )}
        </div>
        <EditorCanvas 
          nodes={nodes}
          edges={edges}
          mode={mode}
          selectedNodeId={selectedNodeId}
          connectStartNode={connectStartNode}
          onClickCanvas={handleCanvasClick}
          onNodeDrag={handleNodeDrag}
        />
      </div>
    </div>
  );
};
