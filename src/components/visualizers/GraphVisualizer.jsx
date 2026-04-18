import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function GraphVisualizer({ nodes, edges, state }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate ViewBox to ensure all nodes fit with padding
  const padding = 60;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  if (nodes.length > 0) {
    nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    });
  } else {
    minX = 0; minY = 0; maxX = dimensions.width; maxY = dimensions.height;
  }

  const vbWidth = Math.max(maxX - minX + padding * 2, 400);
  const vbHeight = Math.max(maxY - minY + padding * 2, 300);
  const vbX = minX - padding;
  const vbY = minY - padding;

  const viewBox = `${vbX} ${vbY} ${vbWidth} ${vbHeight}`;

  const getNodeColor = (nodeId) => {
    if (!state) return 'var(--state-unvisited)';
    if (state.currentNode === nodeId) return 'var(--state-current)';
    if (state.path && state.path.includes(nodeId)) return 'var(--state-path)';
    if (state.visited && state.visited.includes(nodeId)) return 'var(--state-visited)';
    if (state.checking && state.checking.includes(nodeId)) return 'var(--state-checking)';
    if (state.colors && state.colors[nodeId]) return state.colors[nodeId]; // For graph coloring
    return 'var(--state-unvisited)';
  };

  const getEdgeColor = (from, to) => {
    if (!state) return '#cbd5e1';
    
    const edgeId = `${from}-${to}`;
    const reverseEdgeId = `${to}-${from}`;
    
    if (state.currentEdge === edgeId || state.currentEdge === reverseEdgeId) return 'var(--state-current)';
    if (state.pathEdges && (state.pathEdges.includes(edgeId) || state.pathEdges.includes(reverseEdgeId))) return 'var(--state-path)';
    if (state.checkingEdge === edgeId || state.checkingEdge === reverseEdgeId) return 'var(--state-checking)';
    if (state.conflictEdge === edgeId || state.conflictEdge === reverseEdgeId) return 'var(--state-conflict)';
    
    return '#cbd5e1'; // slate-300
  };

  const getEdgeWidth = (from, to) => {
    if (!state) return 2;
    const edgeId = `${from}-${to}`;
    const reverseEdgeId = `${to}-${from}`;
    if (state.currentEdge === edgeId || state.currentEdge === reverseEdgeId || 
        (state.pathEdges && (state.pathEdges.includes(edgeId) || state.pathEdges.includes(reverseEdgeId)))) {
      return 4;
    }
    return 2;
  };

  return (
    <div ref={containerRef} className="visualizer-canvas" style={{ width: '100%', height: '100%' }}>
      <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        <g className="edges">
          {edges.map((edge, idx) => {
            const sourceNode = nodes.find(n => n.id === edge.from);
            const targetNode = nodes.find(n => n.id === edge.to);
            if (!sourceNode || !targetNode) return null;

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <motion.line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={getEdgeColor(edge.from, edge.to)}
                  strokeWidth={getEdgeWidth(edge.from, edge.to)}
                  animate={{ 
                    stroke: getEdgeColor(edge.from, edge.to),
                    strokeWidth: getEdgeWidth(edge.from, edge.to)
                  }}
                  transition={{ duration: 0.3 }}
                />
                {edge.weight !== undefined && (
                  <text 
                    x={midX} 
                    y={midY - 10} 
                    textAnchor="middle" 
                    fill="var(--text-muted)" 
                    fontSize="14" 
                    fontWeight="500"
                    style={{ userSelect: 'none' }}
                  >
                    {edge.weight}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        
        <g className="nodes">
          {nodes.map(node => (
            <motion.g 
              key={node.id} 
              transform={`translate(${node.x}, ${node.y})`}
            >
              <motion.circle
                r={24}
                fill={getNodeColor(node.id)}
                stroke="#0f172a"
                strokeWidth={2}
                animate={{ fill: getNodeColor(node.id) }}
                transition={{ duration: 0.3 }}
              />
              <text 
                textAnchor="middle" 
                dy=".3em" 
                fill="#0f172a" 
                fontSize="12" 
                fontWeight="600"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {node.label || node.id}
              </text>
              {state && state.distances && state.distances[node.id] !== undefined && (
                <text
                   y={40}
                   textAnchor="middle"
                   fill={state.distances[node.id] === Infinity ? 'var(--text-muted)' : 'var(--accent-orange)'}
                   fontSize="14"
                   fontWeight="bold"
                >
                  {state.distances[node.id] === Infinity ? '∞' : state.distances[node.id]}
                </text>
              )}
            </motion.g>
          ))}
        </g>
      </svg>
    </div>
  );
}
