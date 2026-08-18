/**
 * Floyd-Warshall Algorithm - State Generator
 */
export function generateFloydWarshallStates(labels, initialMatrix) {
  const states = [];
  const n = labels.length;
  
  const dist = initialMatrix.map(row => [...row]);
  
  const next = Array(n).fill(0).map(() => Array(n).fill(null));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (initialMatrix[i][j] !== Infinity && i !== j) {
        next[i][j] = j;
      }
    }
  }

  const recordState = (msg, k, i, j, updated = false) => {
    states.push({
      log: msg,
      matrix: dist.map(row => [...row]),
      k,
      i,
      j,
      updated
    });
  };

  recordState('Initialization: Starting with the adjacency matrix of direct distances.', null, null, null);

  for (let k = 0; k < n; k++) {
    recordState(`Phase ${k + 1}: Considering '${labels[k]}' as an intermediate node.`, k, null, null);
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] === Infinity || dist[k][j] === Infinity) {
          recordState(`Checking path ${labels[i]} -> ${labels[k]} -> ${labels[j]}. No path through ${labels[k]} exists.`, k, i, j);
          continue;
        }

        const altDist = dist[i][k] + dist[k][j];
        if (dist[i][j] > altDist) {
          const oldDist = dist[i][j] === Infinity ? '∞' : dist[i][j];
          dist[i][j] = altDist;
          next[i][j] = next[i][k];
          recordState(`Found shorter path ${labels[i]} -> ${labels[j]} through ${labels[k]}. Updated distance from ${oldDist} to ${altDist}.`, k, i, j, true);
        } else {
          recordState(`Checking path ${labels[i]} -> ${labels[k]} -> ${labels[j]} (${altDist}). Existing distance (${dist[i][j]}) is better or equal.`, k, i, j, false);
        }
      }
    }
  }

  recordState('Algorithm finished. All pairs shortest paths computed.', null, null, null);

  return { states, dist, next };
}
