import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Pages
import CanteenMenuPage from './pages/CanteenMenuPage';
import KitchenDashboardPage from './pages/KitchenDashboardPage';
import AdminMenuPage from './pages/AdminMenuPage';
import DistributedHubPage from './pages/DistributedHubPage';
import DistributedArchitecturePage from './pages/DistributedArchitecturePage';
import ApiDocPage from './pages/ApiDocPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CanteenMenuPage />} />
          <Route path="kitchen" element={<KitchenDashboardPage />} />
          <Route path="admin" element={<AdminMenuPage />} />
          <Route path="dist-hub" element={<DistributedHubPage />} />
          <Route path="ds-architecture" element={<DistributedArchitecturePage />} />
          <Route path="api-docs" element={<ApiDocPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
