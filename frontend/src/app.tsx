import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import DashboardLayout from '@/layouts/dashboard-layout';
import DashboardPage from '@/pages/dashboard-page';
import ApplicationDetailPage from '@/pages/application-detail-page';
import NamespaceDetailPage from '@/pages/namespace-detail-page';
import NotFound from '@/components/layout/not-found';

function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard Layout Routes */}
        <Route path='/' element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path='applications/:namespace/:name'
            element={<ApplicationDetailPage />}
          />
          <Route
            path='namespaces/:namespace'
            element={<NamespaceDetailPage />}
          />
          {/* 404 Not Found - catch all routes */}
          <Route path='*' element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
