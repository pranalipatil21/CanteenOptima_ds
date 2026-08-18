# Canteen Optima: Technical Algorithm Details

This document provides the core logic, base conditions, and pruning rules for all algorithms implemented in the **Canteen Optima** project. Use this as a guide for your Viva/demonstration.

---

## 1. Dijkstra's Algorithm (Shortest Path)
- **Paradigm:** Greedy
- **Scenario:** Single-source shortest path for food delivery.
- **Base Condition:** 
  - Distance to the `startNode` is set to `0`.
  - Distance to all other nodes is set to `Infinity`.
- **Core Logic (Relaxation):** 
  - For every neighbor $v$ of the current node $u$: 
  - `if (dist[u] + edgeWeight(u,v) < dist[v]) { dist[v] = dist[u] + edgeWeight(u,v); }`
- **Termination:** When all reachable nodes are visited or the target node is reached.

## 2. Floyd-Warshall Algorithm (All-Pairs Shortest Path)
- **Paradigm:** Dynamic Programming
- **Scenario:** Mapping distances between all departments for long-term logistics.
- **Base Condition:** 
  - `dist[i][j] = weight(i,j)` if an edge exists.
  - `dist[i][i] = 0`.
  - `dist[i][j] = Infinity` if no direct edge exists.
- **Core Logic:** 
  - Iteratively uses every node $k$ as an intermediate point.
  - `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`.

## 3. TSP Branch and Bound (Traveling Salesperson)
- **Paradigm:** Branch and Bound
- **Scenario:** Finding the shortest circular route for a delivery boy to visit all departments.
- **Pruning Condition:** 
  - **The "Bound" Rule:** If the current `pathCost` already exceeds the `bestCost` found so far, the entire branch is **pruned** (abandoned).
- **Base Condition:** 
  - If all $N$ nodes are visited, check the return path to the start node. If valid, update `bestCost`.

## 4. Sum of Subsets (Backtracking)
- **Paradigm:** Backtracking
- **Scenario:** Finding which combination of menu items matches a specific bill amount.
- **Pruning Condition:** 
  - If `currentSum > targetSum`, the branch is **pruned** because adding more items will only increase the sum (assuming non-negative prices).
- **Base Condition:** 
  - `if (currentSum === targetSum)`: A valid subset is found.
  - `if (currentIndex === totalItems)`: End of recursion.

## 5. 0/1 Knapsack (Dynamic Programming)
- **Paradigm:** Dynamic Programming
- **Scenario:** Packing the maximum calorie value into a lunchbox with a weight limit.
- **Base Condition:** 
  - `dp[0][w] = 0` (no items = no value).
  - `dp[i][0] = 0` (zero capacity = no value).
- **Update Rule:** 
  - `dp[i][w] = max(dp[i-1][w], value[i] + dp[i-1][w - weight[i]])`
  - (Essentially: Decide whether to include the current item or keep the previous best value for that capacity).

## 6. Job Scheduling with Deadlines
- **Paradigm:** Greedy
- **Scenario:** Maximizing revenue from kitchen orders with strict deadlines.
- **Base Condition:** 
  - All slots are initially empty (`null`).
- **Core Logic:** 
  - Sort jobs by profit in **descending order**.
  - For each job, try to schedule it in the **latest possible free slot** before its deadline. If no slot is free from $t=deadline$ down to $t=0$, the job is rejected.

## 7. Graph Coloring (Backtracking)
- **Paradigm:** Backtracking
- **Scenario:** Seating conflicting student groups at different tables.
- **Pruning Condition:** 
  - If an adjacent node is already colored with the same color, the current path is **invalid**. Backtrack and try a different color.
- **Base Condition:** 
  - If `nodeIndex === totalNodes`, a valid coloring for the entire graph is found.

## 8. Merge Sort & Quick Sort
- **Paradigm:** Divide and Conquer
- **Scenario:** Sorting the canteen menu by price.
- **Base Conditions:**
  - **Merge Sort:** `if (left >= right)` return.
  - **Quick Sort:** `if (low >= high)` return.
- **Logic:** 
  - Merge Sort recursively halves and then merges.
  - Quick Sort partitions around a pivot and sorts the sub-arrays.

## 9. Binary Search
- **Paradigm:** Search (Decrease and Conquer)
- **Scenario:** Finding a specific receipt in a sorted pile.
- **Requirement:** The array **MUST** be sorted.
- **Base Condition:** 
  - `if (arr[mid] === target)`: Found!
  - `if (left > right)`: Target does not exist in the array.
