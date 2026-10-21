import { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Role, isStaff } from './data';
import { About } from './pages/About';
import { AdminAdmins, AdminHome, AdminLayout, AdminReports, AdminRequest, AdminRequests, AdminUsers } from './pages/Admin';
import { AdminFigures, AdminNotices, AdminPlan, AdminSchemes } from './pages/AdminContent';
import { Complaint } from './pages/Complaint';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { RequestPage, Requests } from './pages/Requests';
import { Schemes } from './pages/Schemes';
import { Updates } from './pages/Updates';
import { useUser } from './store';

/** Sends guests to the login page (and back afterwards), and other roles to their own home. */
function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const user = useUser();
  const { pathname } = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (!roles.includes(user.role)) return <Navigate to={isStaff(user) ? '/admin' : '/'} replace />;
  return <>{children}</>;
}

/** Login and registration. Once someone is logged in this also performs the post-login redirect:
 * back to `?next=` when given (route guards bounce a role that cannot use it), else the role's home. */
function GuestOnly({ children }: { children: ReactNode }) {
  const user = useUser();
  const [params] = useSearchParams();
  if (user) return <Navigate to={params.get('next') || (isStaff(user) ? '/admin' : '/')} replace />;
  return <>{children}</>;
}

const CITIZEN: Role[] = ['citizen'];
const STAFF: Role[] = ['admin', 'superadmin'];

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="updates" element={<Updates />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="profile" element={<RequireRole roles={CITIZEN}><Profile /></RequireRole>} />
        <Route path="complaint" element={<RequireRole roles={CITIZEN}><Complaint /></RequireRole>} />
        <Route path="requests" element={<RequireRole roles={CITIZEN}><Requests /></RequireRole>} />
        <Route path="requests/:id" element={<RequireRole roles={CITIZEN}><RequestPage /></RequireRole>} />
        <Route path="admin" element={<RequireRole roles={STAFF}><AdminLayout /></RequireRole>}>
          <Route index element={<AdminHome />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:id" element={<AdminRequest />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="plan" element={<AdminPlan />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="schemes" element={<AdminSchemes />} />
          <Route path="figures" element={<AdminFigures />} />
          <Route path="admins" element={<RequireRole roles={['superadmin']}><AdminAdmins /></RequireRole>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
