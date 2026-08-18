/**
 * Dijkstra's Algorithm - State Generator
 */
export function generateDijkstraStates(nodes, edges, startNodeId) {
  const states = [];
  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes.map(n => n.id));
  const visited = new Set();
  
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[startNodeId] = 0;

  const adjList = {};
  nodes.forEach(n => adjList[n.id] = []);
  edges.forEach(e => {
    adjList[e.from].push({ to: e.to, weight: e.weight });
    adjList[e.to].push({ to: e.from, weight: e.weight });
  });

  const recordState = (msg, overrides = {}) => {
    states.push({
      log: msg,
      distances: { ...distances },
      visited: Array.from(visited),
      unvisited: Array.from(unvisited),
      currentNode: null,
      currentEdge: null,
      checkingEdge: null,
      ...overrides
    });
  };

  recordState(`Initialization: Set distance to start node ${startNodeId} to 0, others to ∞`);

  while (unvisited.size > 0) {
    let minNode = null;
    let minDistance = Infinity;
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        minNode = nodeId;
      }
    }

    if (minNode === null) {
      recordState("All remaining unvisited nodes are unreachable. Ending algorithm.");
      break;
    }

    recordState(`Selected node ${minNode} as the unvisited node with smallest distance (${distances[minNode]})`, { currentNode: minNode });
    
    unvisited.delete(minNode);
    visited.add(minNode);

    for (const neighbor of adjList[minNode]) {
      if (visited.has(neighbor.to)) continue;

      recordState(`Checking edge from ${minNode} to ${neighbor.to} with weight ${neighbor.weight}`, {
        currentNode: minNode,
        checkingEdge: `${minNode}-${neighbor.to}`
      });

      const alt = distances[minNode] + neighbor.weight;
      if (alt < distances[neighbor.to]) {
        const oldDist = distances[neighbor.to] === Infinity ? '∞' : distances[neighbor.to];
        distances[neighbor.to] = alt;
        previous[neighbor.to] = minNode;
        recordState(`Relaxed edge ${minNode}-${neighbor.to}. Updated distance of ${neighbor.to} from ${oldDist} to ${alt}.`, {
          currentNode: minNode,
          currentEdge: `${minNode}-${neighbor.to}`
        });
      } else {
        recordState(`Did not update ${neighbor.to}. Existing distance ${distances[neighbor.to]} is <= new path ${alt}.`, {
          currentNode: minNode,
          checkingEdge: `${minNode}-${neighbor.to}`
        });
      }
    }
  }

  recordState(`Algorithm finished. Shortest paths computed.`, { isFinished: true });

  return { states, distances, previous };
}
