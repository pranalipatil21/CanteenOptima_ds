import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import AdminMenuPage from './pages/AdminMenuPage';
import KitchenDashboardPage from './pages/KitchenDashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import DistributedDashboardPage from './pages/DistributedDashboardPage';
import DistributedArchitecturePage from './pages/DistributedArchitecturePage';
import ApiDocPage from './pages/ApiDocPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="admin/menu" element={<AdminMenuPage />} />
          <Route path="kitchen" element={<KitchenDashboardPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="distributed-dashboard" element={<DistributedDashboardPage />} />
          <Route path="ds-architecture" element={<DistributedArchitecturePage />} />
          <Route path="api-docs" element={<ApiDocPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
