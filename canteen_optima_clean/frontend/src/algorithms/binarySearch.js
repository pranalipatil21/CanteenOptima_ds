/**
 * Binary Search - State Generator
 */
export function generateBinarySearchStates(array, target) {
  const states = [];
  const arr = [...array].sort((a, b) => a - b); // Ensure sorted
  
  let left = 0;
  let right = arr.length - 1;

  const recordState = (msg, l, r, mid, found = false) => {
    states.push({
      log: msg,
      array: arr,
      left: l,
      right: r,
      mid,
      found
    });
  };

  recordState(`Initialization: Sorted array. Searching for Order ID ${target}.`, left, right, null);

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    recordState(`Calculated mid index = ${mid}. Checking if array[${mid}] (${arr[mid]}) === ${target}.`, left, right, mid);

    if (arr[mid] === target) {
      recordState(`Found Order ID ${target} at index ${mid}!`, left, right, mid, true);
      
      states[states.length - 1].isFinished = true;
      return states;
    }

    if (arr[mid] < target) {
      recordState(`array[${mid}] (${arr[mid]}) < ${target}. Target must be in the right half. Updating left = mid + 1.`, left, right, mid);
      left = mid + 1;
    } else {
      recordState(`array[${mid}] (${arr[mid]}) > ${target}. Target must be in the left half. Updating right = mid - 1.`, left, right, mid);
      right = mid - 1;
    }
  }

  recordState(`Left index (${left}) > Right index (${right}). Order ID ${target} not found in the list.`, left, right, null, false);
  states[states.length - 1].isFinished = true;

  return states;
}
