import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import DashboardPage from '@/pages/dashboard/dashboard-page';
import DashboardLayout from '@/layouts/dashboard-layout';
import ComingSoon from '@/components/layout/coming-soon';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path='/hello' element={<div>Hello</div>} />

        {/* Dashboard Layout Routes */}
        <Route
          path='/'
          element={
            // <AuthGuard>
            <DashboardLayout />
            // </AuthGuard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path='pods' element={<ComingSoon />} />
          <Route path='cluster' element={<ComingSoon />} />
          <Route path='deployments' element={<ComingSoon />} />
          <Route path='services' element={<ComingSoon />} />
          <Route path='events' element={<ComingSoon />} />
          <Route path='alerts' element={<ComingSoon />} />
          <Route path='performance' element={<ComingSoon />} />
          <Route path='reports' element={<ComingSoon />} />
          <Route path='health' element={<ComingSoon />} />
          <Route path='search' element={<ComingSoon />} />
          <Route path='actions' element={<ComingSoon />} />
          <Route path='notifications' element={<ComingSoon />} />
          <Route path='settings/*' element={<ComingSoon />} />
          <Route path='help' element={<ComingSoon />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
