/**
 * Graph Coloring (Backtracking) - State Generator
 */
export function generateGraphColoringStates(nodes, edges, availableColors) {
  const states = [];
  const colors = {};
  const n = nodes.length;

  nodes.forEach(n => {
    colors[n.id] = null;
  });

  const adjList = {};
  nodes.forEach(n => {
    adjList[n.id] = [];
  });
  edges.forEach(e => {
    if (adjList[e.from] && adjList[e.to]) {
      adjList[e.from].push(e.to);
      adjList[e.to].push(e.from);
    }
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
        return neighbor;
      }
    }
    return null;
  }

  function graphColoringUtil(nodeIndex) {
    if (nodeIndex === n) {
      return true;
    }

    const nodeId = nodes[nodeIndex].id;

    for (let c = 0; c < availableColors.length; c++) {
      const colorToTry = availableColors[c];
      recordState(`Trying color ${c + 1} for node '${nodeId}'.`, nodeId);
      
      const conflictingNode = isSafe(nodeId, colorToTry);
      
      if (!conflictingNode) {
        colors[nodeId] = colorToTry;
        recordState(`Color ${c + 1} is safe for '${nodeId}'. Moving to next node.`, nodeId);
        
        if (graphColoringUtil(nodeIndex + 1)) {
          return true;
        }

        colors[nodeId] = null;
        recordState(`Backtracking from '${nodeId}'. Removing color ${c + 1}.`, nodeId);
      } else {
        recordState(`Conflict! Color ${c + 1} for '${nodeId}' conflicts with neighbor '${conflictingNode}'.`, nodeId, `${nodeId}-${conflictingNode}`);
      }
    }

    return false;
  }

  if (!graphColoringUtil(0)) {
    recordState(`Algorithm finished. No valid coloring found with ${availableColors.length} colors.`, null, null, true);
  } else {
    recordState('Algorithm finished. All nodes colored successfully.', null, null, true);
  }

  return states;
}
