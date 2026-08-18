/**
 * Sorting Algorithms - State Generators (Now supports objects with .price)
 */

const recordSortingState = (states, arr, msg, comparing = [], swapping = [], sorted = [], comparisons = 0, swaps = 0) => {
  states.push({
    log: msg,
    array: [...arr],
    comparing: [...comparing],
    swapping: [...swapping],
    sorted: [...sorted],
    comparisons,
    swaps
  });
};

export function generateSelectionSortStates(initialArray) {
  const states = [];
  const arr = [...initialArray];
  const n = arr.length;
  const sorted = [];
  let comparisons = 0;
  let swaps = 0;

  recordSortingState(states, arr, "Initialization: Start Selection Sort.", [], [], [], comparisons, swaps);

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      recordSortingState(states, arr, `Comparing ${arr[j].name} (₹${arr[j].price}) and current min ${arr[minIdx].name} (₹${arr[minIdx].price}).`, [j, minIdx], [], sorted, comparisons, swaps);
      if (arr[j].price < arr[minIdx].price) {
        minIdx = j;
        recordSortingState(states, arr, `Found new minimum: ${arr[minIdx].name} at index ${minIdx}.`, [minIdx], [], sorted, comparisons, swaps);
      }
    }

    if (minIdx !== i) {
      swaps++;
      recordSortingState(states, arr, `Swapping ${arr[i].name} and ${arr[minIdx].name}.`, [], [i, minIdx], sorted, comparisons, swaps);
      let temp = arr[minIdx];
      arr[minIdx] = arr[i];
      arr[i] = temp;
    }
    
    sorted.push(i);
    recordSortingState(states, arr, `${arr[i].name} is now in its sorted position.`, [], [], sorted, comparisons, swaps);
  }
  
  sorted.push(n - 1);
  recordSortingState(states, arr, "Array is fully sorted.", [], [], sorted, comparisons, swaps);
  
  states[states.length - 1].isFinished = true;
  return states;
}

export function generateBubbleSortStates(initialArray) {
  const states = [];
  const arr = [...initialArray];
  const n = arr.length;
  const sorted = [];
  let comparisons = 0;
  let swaps = 0;

  recordSortingState(states, arr, "Initialization: Start Bubble Sort.", [], [], [], comparisons, swaps);

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      recordSortingState(states, arr, `Comparing ${arr[j].name} and ${arr[j+1].name}.`, [j, j+1], [], sorted, comparisons, swaps);
      if (arr[j].price > arr[j + 1].price) {
        swaps++;
        recordSortingState(states, arr, `${arr[j].price} > ${arr[j+1].price}. Swapping.`, [], [j, j+1], sorted, comparisons, swaps);
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }
    sorted.push(n - i - 1);
    recordSortingState(states, arr, `${arr[n-i-1].name} bubbled to its sorted position.`, [], [], sorted, comparisons, swaps);
    if (!swapped) break;
  }

  for (let i = 0; i < n; i++) if (!sorted.includes(i)) sorted.push(i);
  
  recordSortingState(states, arr, "Array is fully sorted.", [], [], sorted, comparisons, swaps);
  states[states.length - 1].isFinished = true;
  return states;
}

export function generateQuickSortStates(initialArray) {
  const states = [];
  const arr = [...initialArray];
  const n = arr.length;
  const sorted = [];
  let comparisons = 0;
  let swaps = 0;

  recordSortingState(states, arr, "Initialization: Start Quick Sort.", [], [], [], comparisons, swaps);

  function partition(low, high) {
    const pivot = arr[high];
    recordSortingState(states, arr, `Selected pivot ${pivot.name} (₹${pivot.price}) at index ${high}.`, [high], [], sorted, comparisons, swaps);
    
    let i = low - 1;
    for (let j = low; j < high; j++) {
      comparisons++;
      recordSortingState(states, arr, `Comparing ${arr[j].name} with pivot ${pivot.name}.`, [j, high], [], sorted, comparisons, swaps);
      if (arr[j].price < pivot.price) {
        i++;
        swaps++;
        recordSortingState(states, arr, `₹${arr[j].price} < ₹${pivot.price}. Swapping with ${arr[i].name}.`, [], [i, j], sorted, comparisons, swaps);
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
    }
    
    swaps++;
    recordSortingState(states, arr, `Placing pivot ${pivot.name} at correct position ${i+1}.`, [], [i+1, high], sorted, comparisons, swaps);
    let temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    
    sorted.push(i + 1);
    recordSortingState(states, arr, `Pivot ${pivot.name} is now sorted at index ${i+1}.`, [], [], sorted, comparisons, swaps);
    
    return i + 1;
  }

  function quickSort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
      if (!sorted.includes(low)) sorted.push(low);
      recordSortingState(states, arr, `${arr[low].name} is sorted (base case).`, [], [], sorted, comparisons, swaps);
    }
  }

  quickSort(0, n - 1);
  
  for (let i = 0; i < n; i++) if (!sorted.includes(i)) sorted.push(i);
  recordSortingState(states, arr, "Array is fully sorted.", [], [], sorted, comparisons, swaps);
  states[states.length - 1].isFinished = true;
  return states;
}

export function generateMergeSortStates(initialArray) {
  const states = [];
  const arr = [...initialArray];
  const n = arr.length;
  const sorted = []; 
  let comparisons = 0;
  let swaps = 0;

  recordSortingState(states, arr, "Initialization: Start Merge Sort.", [], [], [], comparisons, swaps);

  function merge(left, mid, right) {
    const n1 = mid - left + 1;
    const n2 = right - mid;
    
    const L = new Array(n1);
    const R = new Array(n2);
    
    for (let i = 0; i < n1; i++) L[i] = arr[left + i];
    for (let j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];
    
    let i = 0, j = 0, k = left;
    
    while (i < n1 && j < n2) {
      comparisons++;
      recordSortingState(states, arr, `Merging: Comparing ${L[i].name} and ${R[j].name}.`, [left+i, mid+1+j], [], sorted, comparisons, swaps);
      
      if (L[i].price <= R[j].price) {
        swaps++;
        arr[k] = L[i];
        recordSortingState(states, arr, `Writing ${L[i].name} to index ${k}.`, [], [k], sorted, comparisons, swaps);
        i++;
      } else {
        swaps++;
        arr[k] = R[j];
        recordSortingState(states, arr, `Writing ${R[j].name} to index ${k}.`, [], [k], sorted, comparisons, swaps);
        j++;
      }
      k++;
    }
    
    while (i < n1) {
      swaps++;
      arr[k] = L[i];
      recordSortingState(states, arr, `Writing remaining ${L[i].name} to index ${k}.`, [], [k], sorted, comparisons, swaps);
      i++;
      k++;
    }
    
    while (j < n2) {
      swaps++;
      arr[k] = R[j];
      recordSortingState(states, arr, `Writing remaining ${R[j].name} to index ${k}.`, [], [k], sorted, comparisons, swaps);
      j++;
      k++;
    }
    
    recordSortingState(states, arr, `Merged segment from index ${left} to ${right}.`, [], [], sorted, comparisons, swaps);
  }

  function mergeSort(left, right) {
    if (left >= right) return;
    const mid = Math.floor(left + (right - left) / 2);
    mergeSort(left, mid);
    mergeSort(mid + 1, right);
    merge(left, mid, right);
  }

  mergeSort(0, n - 1);
  
  for (let i = 0; i < n; i++) sorted.push(i);
  recordSortingState(states, arr, "Array is fully sorted.", [], [], sorted, comparisons, swaps);
  states[states.length - 1].isFinished = true;
  return states;
}
