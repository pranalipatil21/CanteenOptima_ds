/**
 * Graph Coloring (Backtracking) - State Generator
 * @param {Array} nodes - Array of nodes { id }
 * @param {Array} edges - Array of edges { from, to }
 * @param {Array} availableColors - Array of hex color strings
 * @returns {Array} states
 */
export function generateGraphColoringStates(nodes, edges, availableColors) {
  const states = [];
  const colors = {}; // nodeId -> color
  const n = nodes.length;

  // Build adjacency list (undirected)
  const adjList = {};
  nodes.forEach(n => {
    adjList[n.id] = [];
    colors[n.id] = null;
  });
  edges.forEach(e => {
    adjList[e.from].push(e.to);
    adjList[e.to].push(e.from);
  });

  const recordState = (msg, currentNode, conflictEdge = null, isFinished = false) => {
    states.push({
      log: msg,
      colors: { ...colors },
      currentNode,
      conflictEdge,
      isFinished
    });
  };

  recordState('Initialization: Start coloring nodes one by one.', nodes[0]?.id);

  function isSafe(nodeId, color) {
    for (const neighbor of adjList[nodeId]) {
      if (colors[neighbor] === color) {
        return neighbor; // return conflicting node
      }
    }
    return null;
  }

  function graphColoringUtil(nodeIndex) {
    if (nodeIndex === n) {
      return true; // All nodes colored
    }

    const nodeId = nodes[nodeIndex].id;

    for (let c = 0; c < availableColors.length; c++) {
      const colorToTry = availableColors[c];
      recordState(`Trying color ${c + 1} for node '${nodeId}'.`, nodeId);
      
      const conflictingNode = isSafe(nodeId, colorToTry);
      
      if (!conflictingNode) {
        // Safe to assign
        colors[nodeId] = colorToTry;
        recordState(`Color ${c + 1} is safe for '${nodeId}'. Moving to next node.`, nodeId);
        
        if (graphColoringUtil(nodeIndex + 1)) {
          return true;
        }

        // Backtrack
        colors[nodeId] = null;
        recordState(`Backtracking from '${nodeId}'. Removing color ${c + 1}.`, nodeId);
      } else {
        // Conflict
        recordState(`Conflict! Color ${c + 1} for '${nodeId}' conflicts with neighbor '${conflictingNode}'.`, nodeId, `${nodeId}-${conflictingNode}`);
      }
    }

    return false; // No color works, need to backtrack from previous node
  }

  if (!graphColoringUtil(0)) {
    recordState(`Algorithm finished. No valid coloring found with ${availableColors.length} colors.`, null, null, true);
  } else {
    recordState('Algorithm finished. All nodes colored successfully.', null, null, true);
  }

  return states;
}
