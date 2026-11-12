import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import TrackHome from './pages/TrackHome.jsx';
import TrackResult from './pages/TrackResult.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminShipmentList from './pages/admin/AdminShipmentList.jsx';
import AdminShipmentNew from './pages/admin/AdminShipmentNew.jsx';
import AdminShipmentDetail from './pages/admin/AdminShipmentDetail.jsx';
import RequireAuth from './pages/admin/RequireAuth.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public tracking site */}
        <Route path="/" element={<TrackHome />} />
        <Route path="/track/:trackingNumber" element={<TrackResult />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminShipmentList />} />
          <Route path="new" element={<AdminShipmentNew />} />
          <Route path=":id" element={<AdminShipmentDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
