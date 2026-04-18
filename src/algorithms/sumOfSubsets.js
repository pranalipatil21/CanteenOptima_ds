/**
 * Sum of Subsets (Backtracking) - State Generator
 * @param {Array} items - Array of { name, price }
 * @param {Number} targetSum - Target sum
 * @returns {Array} states
 */
export function generateSumOfSubsetsStates(items, targetSum) {
  const states = [];
  const subset = [];
  const n = items.length;

  const recordState = (msg, currentIndex, isFinished = false) => {
    states.push({
      log: msg,
      subset: [...subset],
      currentIndex,
      isFinished
    });
  };

  recordState(`Initialization: Looking for combinations that exactly sum to ₹${targetSum}.`, 0);

  // Sort items by price to optimize backtracking (optional, but good for visualization)
  const sortedItems = [...items].sort((a, b) => a.price - b.price);

  let foundSolution = false;
  const allSolutions = [];

  function subsetSumUtil(index, currentSum) {
    if (currentSum === targetSum) {
      foundSolution = true;
      allSolutions.push([...subset]);
      recordState(`🎉 Found a valid combination: ${subset.map(i => i.name).join(' + ')} = ₹${targetSum}`, index);
      return; // Can return if we just want one, but we can also find all. Let's find all.
    }

    if (currentSum > targetSum || index >= n) {
      if (currentSum > targetSum) {
        recordState(`Current sum (₹${currentSum}) exceeds target (₹${targetSum}). Backtracking.`, index);
      } else {
        recordState(`Reached end of items without reaching target. Backtracking.`, index);
      }
      return;
    }

    // Include item
    const item = sortedItems[index];
    subset.push(item);
    recordState(`Including '${item.name}' (₹${item.price}). New Sum = ₹${currentSum + item.price}.`, index);
    subsetSumUtil(index + 1, currentSum + item.price);

    // Exclude item (backtrack)
    subset.pop();
    recordState(`Excluding '${item.name}' (₹${item.price}). Reverting Sum back to ₹${currentSum}.`, index);
    subsetSumUtil(index + 1, currentSum);
  }

  subsetSumUtil(0, 0);

  if (allSolutions.length > 0) {
    states.push({
      log: `Algorithm finished. Found ${allSolutions.length} valid combinations.`,
      subset: [],
      currentIndex: null,
      isFinished: true,
      solutions: allSolutions
    });
  } else {
    states.push({
      log: `Algorithm finished. No valid combinations found for ₹${targetSum}.`,
      subset: [],
      currentIndex: null,
      isFinished: true,
      solutions: []
    });
  }

  return states;
}
