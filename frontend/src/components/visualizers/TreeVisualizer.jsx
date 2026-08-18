import React from 'react';
import { motion } from 'framer-motion';

// Basic static tree rendering for State Space Tree
export default function TreeVisualizer({ treeNodes }) {
  if (!treeNodes || treeNodes.length === 0) return null;

  // We need to calculate positions for tree nodes
  // For a simple visualization, we can group them by level
  const levels = {};
  let maxLevel = 0;

  treeNodes.forEach(node => {
    if (!levels[node.level]) levels[node.level] = [];
    levels[node.level].push(node);
    if (node.level > maxLevel) maxLevel = node.level;
  });

  const maxNodesInLevel = Math.max(...Object.values(levels).map(l => l.length));
  
  const nodeWidth = 300; // Increased significantly to hold "Path: Canteen-Lib-Admin-Hostel-Canteen (Cost: 100)"
  const nodeHeight = 40;
  
  const width = Math.max(1200, maxNodesInLevel * (nodeWidth + 60)); // Added more padding
  const height = Math.max(500, (maxLevel + 1) * 120);

  // Assign x, y coordinates
  treeNodes.forEach(node => {
    node.y = 60 + node.level * 120;
    
    // Find its index in the level
    const levelNodes = levels[node.level];
    const index = levelNodes.findIndex(n => n.id === node.id);
    const spacing = width / (levelNodes.length + 1);
    
    // Attempting to center children under parents might be complex, 
    // so we distribute them evenly across the level.
    node.x = spacing * (index + 1);
  });

  const getNodeColor = (status) => {
    if (status === 'best') return 'var(--state-path)';
    if (status === 'pruned') return 'var(--state-conflict)';
    return 'var(--state-checking)';
  };

  return (
    <div className="visualizer-canvas" style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g className="edges">
          {treeNodes.map(node => {
            if (!node.parentId) return null;
            const parent = treeNodes.find(n => n.id === node.parentId);
            if (!parent) return null;

            return (
              <motion.line
                key={`edge-${node.id}`}
                x1={parent.x}
                y1={parent.y + 20}
                x2={node.x}
                y2={node.y - 20}
                stroke={node.status === 'pruned' ? '#cbd5e1' : '#94a3b8'}
                strokeWidth={2}
                strokeDasharray={node.status === 'pruned' ? '4' : '0'}
              />
            );
          })}
        </g>
        
        <g className="nodes">
          {treeNodes.map(node => (
            <motion.g 
              key={`node-${node.id}`} 
              transform={`translate(${node.x}, ${node.y})`}
            >
              <rect
                x={-nodeWidth / 2}
                y={-nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx={6}
                fill={getNodeColor(node.status)}
                stroke="var(--border-color)"
                strokeWidth={2}
              />
              <text 
                textAnchor="middle" 
                dy=".3em" 
                fill="#ffffff" 
                fontSize="11" 
                fontWeight="500"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {node.label}
              </text>
            </motion.g>
          ))}
        </g>
      </svg>
    </div>
  );
}
