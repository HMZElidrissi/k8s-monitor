import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import DashboardPage from '@/pages/dashboard/dashboard-page';
import DashboardLayout from '@/layouts/dashboard-layout';

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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
