/**
 * TSP Branch & Bound - State Generator
 * For simplicity, we will simulate the state space tree generation.
 */
export function generateTSPStates(nodes, edges) {
  const states = [];
  const n = nodes.length;

  // Build distance matrix
  const dist = Array(n).fill(0).map(() => Array(n).fill(Infinity));
  edges.forEach(e => {
    const u = nodes.findIndex(n => n.id === e.from);
    const v = nodes.findIndex(n => n.id === e.to);
    dist[u][v] = e.weight;
    dist[v][u] = e.weight;
  });

  const treeNodes = [];
  let nextNodeId = 1;

  const recordState = (msg, bestPath = null, bestCost = Infinity) => {
    states.push({
      log: msg,
      treeNodes: JSON.parse(JSON.stringify(treeNodes)), // deep copy
      bestPath,
      bestCost,
      isFinished: false
    });
  };

  // Helper to calculate lower bound (simplified for visualization: cost of edges so far + min out edges)
  const calculateBound = (path) => {
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      cost += dist[path[i]][path[i+1]];
    }
    return cost;
  };

  const root = {
    id: nextNodeId++,
    parentId: null,
    path: [0], // Start at 0
    level: 0,
    costSoFar: 0,
    bound: 0,
    label: `Path: ${nodes[0].id}`,
    status: 'exploring' // exploring, pruned, best
  };
  treeNodes.push(root);

  recordState('Initialization: Start at the root node (Level 0).', null, Infinity);

  let bestCost = Infinity;
  let bestPath = null;
  
  // Simple DFS for Branch and Bound (simulated)
  function solve(node) {
    if (node.level === n - 1) {
      // Reached a leaf, need to return to start
      const returnCost = dist[node.path[node.level]][0];
      if (returnCost !== Infinity) {
        const totalCost = node.costSoFar + returnCost;
        node.path.push(0);
        node.label = `Path: ${node.path.map(idx => nodes[idx].id).join('-')}\nCost: ${totalCost}`;
        
        if (totalCost < bestCost) {
          bestCost = totalCost;
          bestPath = [...node.path];
          node.status = 'best';
          recordState(`Found new complete path with lower cost: ${totalCost}`, bestPath, bestCost);
        } else {
          node.status = 'pruned';
          recordState(`Found complete path with cost ${totalCost}, but best is ${bestCost}. Not optimal.`, bestPath, bestCost);
        }
      } else {
        node.status = 'pruned';
        recordState('No return edge to start node found. Path invalid.', bestPath, bestCost);
      }
      return;
    }

    const lastCity = node.path[node.level];

    // Branching
    for (let i = 0; i < n; i++) {
      if (!node.path.includes(i) && dist[lastCity][i] !== Infinity) {
        const newCost = node.costSoFar + dist[lastCity][i];
        
        const childNode = {
          id: nextNodeId++,
          parentId: node.id,
          path: [...node.path, i],
          level: node.level + 1,
          costSoFar: newCost,
          label: `${nodes[i].id} (Cost: ${newCost})`,
          status: 'exploring'
        };
        treeNodes.push(childNode);
        
        // Bounding
        if (newCost < bestCost) {
          recordState(`Branching to '${nodes[i].id}'. Current Cost: ${newCost} < Best Cost: ${bestCost === Infinity ? '∞' : bestCost}. Exploring...`, bestPath, bestCost);
          solve(childNode);
        } else {
          childNode.status = 'pruned';
          recordState(`Branching to '${nodes[i].id}'. Cost: ${newCost} >= Best Cost: ${bestCost}. PRUNED.`, bestPath, bestCost);
        }
      }
    }
  }

  solve(root);

  // Mark final best node
  if (bestPath) {
    const finalMsg = `Algorithm finished. Best path found: ${bestPath.map(idx => nodes[idx].id).join(' -> ')} with cost ${bestCost}.`;
    states.push({
      log: finalMsg,
      treeNodes: JSON.parse(JSON.stringify(treeNodes)),
      bestPath,
      bestCost,
      isFinished: true
    });
  } else {
    states.push({
      log: `Algorithm finished. No valid TSP tour found.`,
      treeNodes: JSON.parse(JSON.stringify(treeNodes)),
      bestPath,
      bestCost,
      isFinished: true
    });
  }

  return states;
}
