import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import DijkstraPage from './pages/DijkstraPage';
import FloydWarshallPage from './pages/FloydWarshallPage';
import JobSchedulingPage from './pages/JobSchedulingPage';
import KnapsackPage from './pages/KnapsackPage';
import GraphColoringPage from './pages/GraphColoringPage';
import TSPPage from './pages/TSPPage';
import SortingPage from './pages/SortingPage';
import BinarySearchPage from './pages/BinarySearchPage';
import SumOfSubsetsPage from './pages/SumOfSubsetsPage';
import AnalysisPage from './pages/AnalysisPage';
import DistributedDashboardPage from './pages/DistributedDashboardPage';
import DistributedArchitecturePage from './pages/DistributedArchitecturePage';
import ApiDocPage from './pages/ApiDocPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dijkstra" element={<DijkstraPage />} />
          <Route path="floyd-warshall" element={<FloydWarshallPage />} />
          <Route path="job-scheduling" element={<JobSchedulingPage />} />
          <Route path="knapsack" element={<KnapsackPage />} />
          <Route path="graph-coloring" element={<GraphColoringPage />} />
          <Route path="tsp" element={<TSPPage />} />
          <Route path="sorting" element={<SortingPage />} />
          <Route path="binary-search" element={<BinarySearchPage />} />
          <Route path="sum-of-subsets" element={<SumOfSubsetsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="distributed-dashboard" element={<DistributedDashboardPage />} />
          <Route path="ds-architecture" element={<DistributedArchitecturePage />} />
          <Route path="api-docs" element={<ApiDocPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
