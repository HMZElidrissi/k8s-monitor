import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import DashboardLayout from '@/layouts/dashboard-layout';
import StatusPage, { sampleMonitors } from '@/pages/status-page';
import ApplicationDetailPage from '@/pages/application-detail-page';
import NamespaceDetailPage from '@/pages/namespace-detail-page';

function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard Layout Routes */}
        <Route path='/' element={<DashboardLayout />}>
          <Route index element={<StatusPage monitors={sampleMonitors} />} />
          <Route
            path='applications/:namespace/:name'
            element={<ApplicationDetailPage />}
          />
          <Route
            path='namespaces/:namespace'
            element={<NamespaceDetailPage />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
