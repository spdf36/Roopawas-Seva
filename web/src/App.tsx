import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import {
  AdminHome, AdminLayout, AdminLogin, AdminNotices, AdminPlan, AdminReports, AdminRequest, AdminRequests, AdminUsers,
} from './pages/Admin';
import { Complaint } from './pages/Complaint';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { RequestPage, Requests } from './pages/Requests';
import { Schemes } from './pages/Schemes';
import { Updates } from './pages/Updates';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="register" element={<Register />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="complaint" element={<Complaint />} />
        <Route path="requests" element={<Requests />} />
        <Route path="requests/:id" element={<RequestPage />} />
        <Route path="updates" element={<Updates />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:id" element={<AdminRequest />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="plan" element={<AdminPlan />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="notices" element={<AdminNotices />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
