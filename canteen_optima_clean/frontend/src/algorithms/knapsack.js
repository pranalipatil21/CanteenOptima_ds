/**
 * 0/1 Knapsack DP - State Generator
 * @param {Array} items - Array of { name, value, weight }
 * @param {Number} capacity - Max capacity of knapsack
 * @returns {Array} states
 */
export function generateKnapsackStates(items, capacity) {
  const states = [];
  const n = items.length;
  
  // dp[i][w] matrix: (n+1) x (capacity+1)
  const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

  const recordState = (msg, i, w, checking = false, updated = false) => {
    states.push({
      log: msg,
      matrix: dp.map(row => [...row]),
      i, // Current item index (1-based)
      w, // Current weight capacity
      checking,
      updated
    });
  };

  recordState('Initialization: Set first row and first column to 0 (base cases).', 0, 0, false, false);

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1]; // 0-indexed in array
    
    for (let w = 1; w <= capacity; w++) {
      recordState(`Checking Item '${item.name}' (Val: ${item.value}, Wt: ${item.weight}) at capacity ${w}.`, i, w, true, false);

      if (item.weight <= w) {
        // We can either include it or exclude it
        const valIfIncluded = item.value + dp[i - 1][w - item.weight];
        const valIfExcluded = dp[i - 1][w];
        
        if (valIfIncluded > valIfExcluded) {
          dp[i][w] = valIfIncluded;
          recordState(`Item '${item.name}' included. Max value is now ${valIfIncluded} (from ${dp[i-1][w-item.weight]} + ${item.value}).`, i, w, false, true);
        } else {
          dp[i][w] = valIfExcluded;
          recordState(`Item '${item.name}' excluded. Existing value ${valIfExcluded} is better.`, i, w, false, false);
        }
      } else {
        // Item is heavier than current capacity
        dp[i][w] = dp[i - 1][w];
        recordState(`Item '${item.name}' is too heavy (${item.weight} > ${w}). Value remains ${dp[i][w]}.`, i, w, false, false);
      }
    }
  }

  // Backtrack to find selected items
  let res = dp[n][capacity];
  let w = capacity;
  const selectedItems = [];
  
  for (let i = n; i > 0 && res > 0; i--) {
    if (res === dp[i - 1][w]) {
      // Item not included
      continue;
    } else {
      // Item included
      selectedItems.push(items[i - 1]);
      res = res - items[i - 1].value;
      w = w - items[i - 1].weight;
    }
  }

  states.push({
    log: `Algorithm finished. Max value: ${dp[n][capacity]}. Included: ${selectedItems.map(item => item.name).join(', ') || 'None'}.`,
    matrix: dp.map(row => [...row]),
    isFinished: true,
    selectedItems
  });

  return states;
}
