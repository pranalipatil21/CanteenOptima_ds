# Canteen Optima: A DAA-Powered Interactive Visualizer

## 1. Introduction
**Canteen Optima** is a production-ready, interactive web application built to demonstrate core concepts of the **Design and Analysis of Algorithms (DAA)**. Rather than presenting algorithms in abstract, theoretical terms, this project maps each algorithm to a real-world, highly relatable scenario: **managing a college canteen system.**

The application acts as a live, step-by-step educational tool. Users can input their own data, tweak scenarios, and watch exactly how algorithms execute under the hood, making it the perfect tool for a final-year engineering viva or demonstration.

## 2. Technology Stack
- **Frontend Framework:** React.js (via Vite)
- **Styling:** Custom CSS based on the modern "Yummy" template (featuring vibrant colors, distinct typography, and full responsiveness)
- **Animations:** Framer Motion (for smooth node transitions, table highlights, and sorting visualizers)
- **State Management:** Custom React Hooks (`useAlgorithmRunner`) for non-blocking playback controls (Play, Pause, Step).

## 3. How DAA is Applied
The project implements a variety of algorithmic paradigms to solve specific operational bottlenecks in the canteen:

### A. Greedy Algorithms
*Greedy algorithms make the locally optimal choice at each stage with the hope of finding a global optimum.*

**1. Dijkstra's Algorithm (Single Source Shortest Path)**
- **Problem:** A delivery boy needs to deliver food from the Main Canteen to the Library as fast as possible.
- **Implementation:** Computes the shortest path using edge weights (representing distance/time).
- **Time/Space:** $O((V + E) \log V)$ / $O(V)$

**2. Job Scheduling with Deadlines**
- **Problem:** The kitchen receives multiple orders. Each order yields a specific bill amount (profit) and has a strict preparation deadline (time). We must maximize total revenue.
- **Implementation:** Sorts jobs by profit in descending order and greedily assigns them to the latest possible free time slot before their deadline.
- **Time/Space:** $O(N \log N)$ / $O(N)$

### B. Dynamic Programming (DP)
*DP solves complex problems by breaking them down into simpler subproblems and storing their solutions.*

**3. 0/1 Knapsack Problem**
- **Problem:** A student has a lunchbox with a strict weight capacity. They want to pack the most satisfying combination of food items (calories) without exceeding the weight limit. You cannot take a fraction of an item (hence 0/1).
- **Implementation:** Builds a 2D DP matrix to calculate the maximum value for each capacity up to $W$.
- **Time/Space:** $O(N \times W)$ / $O(N \times W)$

**4. Floyd-Warshall Algorithm (All-Pairs Shortest Path)**
- **Problem:** Finding the distance between all pairs of locations on campus (e.g., Hostel to Library, Admin to Sports complex) to optimize future delivery routing.
- **Implementation:** Uses a 2D distance matrix and updates it iteratively by considering every node as an intermediate point.
- **Time/Space:** $O(V^3)$ / $O(V^2)$

### C. Backtracking & Branch and Bound
*Explores all potential paths, abandoning (pruning) paths that cannot yield a valid or optimal solution.*

**5. Sum of Subsets (Backtracking)**
- **Problem:** Finding exactly which combination of menu items perfectly matches a specific final bill amount.
- **Implementation:** Backtracks through the menu array. If the current running sum exceeds the target bill, it prunes the tree and tries a different combination.
- **Time/Space:** $O(2^N)$ / $O(N)$

**6. Traveling Salesperson Problem (TSP) (Branch and Bound)**
- **Problem:** A delivery boy must visit several departments exactly once and return to the canteen, taking the shortest possible overall route.
- **Implementation:** Uses a state-space tree. It calculates a lower bound cost for paths. If a path's cost exceeds the current best known complete tour, the branch is aggressively pruned.
- **Time/Space:** $O(V!)$ worst-case / $O(V^2)$ space

**7. Graph Coloring (Backtracking)**
- **Problem:** Arranging seating in the canteen. Rival groups (conflicting nodes) cannot be seated at the same table (assigned the same color).
- **Implementation:** Backtracks through the graph, attempting to assign a color from $1$ to $m$. It prunes paths where adjacent nodes share the same color.
- **Time/Space:** $O(m^V)$ / $O(V)$

### D. Divide & Conquer
*Breaks a problem into smaller identical subproblems, solves them recursively, and combines their solutions.*

**8. Quick Sort & Merge Sort**
- **Problem:** Organizing the canteen menu by price from cheapest to most expensive.
- **Implementation:** 
  - *Quick Sort* partitions the array around a pivot.
  - *Merge Sort* halves the array and merges the sorted halves.
- **Time/Space:** $O(N \log N)$ average time for both. Merge Sort uses $O(N)$ auxiliary space, while Quick Sort is in-place $O(\log N)$.

### E. Search Algorithms
**9. Binary Search**
- **Problem:** A staff member needs to quickly find a specific completed order receipt from a chronologically sorted pile of receipts.
- **Implementation:** Repeatedly halves the search space.
- **Time/Space:** $O(\log N)$ / $O(1)$

## 4. System Architecture (The Execution Engine)
To make the algorithms interactive, they are NOT written as standard `while` loops that block the browser. 

Instead, they are written as **State Generators**. The algorithm processes the input entirely, pushing a "snapshot" of its state (variables, matrix values, current indices, logs) at every step into an array.
A custom React hook (`useAlgorithmRunner`) iterates over this array of snapshots on a timer. This design allows users to smoothly Play, Pause, and Step backwards/forwards without freezing the UI.

## 5. Conclusion
Canteen Optima successfully abstracts complex mathematical algorithms into a relatable business context. It proves that algorithms are not just textbook exercises, but highly practical tools for optimizing resources, time, and revenue in real-world scenarios.
