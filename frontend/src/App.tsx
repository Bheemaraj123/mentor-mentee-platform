// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from 'react-router-dom';

// import { Login } from './pages/auth/Login';
// import { Register } from './pages/auth/Register';
// import { ProtectedRoute } from './components/auth/ProtectedRoute';
// import Home from './pages/Home';

// import { Settings } from './pages/Settings';
// import Notifications from './pages/Notifications';

// import { DashboardLayout } from './components/layout/DashboardLayout';

// const AppRoutes = () => (
//   <ProtectedRoute allowedRoles={['mentor', 'mentee']}>
//     <DashboardLayout>
//       <Routes>
//         <Route index element={<Navigate to="dashboard" replace />} />
//       <Route path="dashboard" element={<Home />} />
//       <Route path="reports" element={<Home />} />
//       <Route path="sessions" element={<Home />} />
//       <Route path="meetings" element={<Home />} />
//       <Route path="actions" element={<Home />} />
//       <Route path="tasks" element={<Home />} />
//       <Route path="people" element={<Home />} />
//       <Route path="mentees" element={<Home />} />
//       <Route path="analytics" element={<Home />} />
//       <Route path="progress" element={<Home />} />
//       <Route path="ai-assistant" element={<Home />} />
//       <Route path="notifications" element={<Notifications />} />
//       <Route path="settings" element={<Settings />} />
//       <Route path="*" element={<Navigate to="dashboard" replace />} />
//       </Routes>
//     </DashboardLayout>
//   </ProtectedRoute>
// );

// export function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         <Route path="/mentor/*" element={<AppRoutes />} />
//         <Route path="/mentee/*" element={<AppRoutes />} />

//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;



import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import Home from './pages/Home';
import { Settings } from './pages/Settings';
import Notifications from './pages/Notifications';

import { DashboardLayout } from './components/layout/DashboardLayout';

const AppRoutes = () => (
  <ProtectedRoute allowedRoles={['mentor', 'mentee']}>
    <Routes>
      {/* Default route */}
      <Route index element={<Navigate to="dashboard" replace />} />

      {/* Home already contains its own dashboard layout */}
      <Route path="dashboard" element={<Home />} />
      <Route path="reports" element={<Home />} />
      <Route path="sessions" element={<Home />} />
      <Route path="meetings" element={<Home />} />
      <Route path="actions" element={<Home />} />
      <Route path="tasks" element={<Home />} />
      <Route path="people" element={<Home />} />
      <Route path="mentees" element={<Home />} />
      <Route path="analytics" element={<Home />} />
      <Route path="progress" element={<Home />} />
      <Route path="ai-assistant" element={<Home />} />

      {/* These pages use DashboardLayout */}
      <Route
        path="notifications"
        element={
          <DashboardLayout>
            <Notifications />
          </DashboardLayout>
        }
      />

      <Route
        path="settings"
        element={
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        }
      />

      {/* Fallback without another redirect */}
      <Route path="*" element={<Home />} />
    </Routes>
  </ProtectedRoute>
);

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/mentor/*" element={<AppRoutes />} />
        <Route path="/mentee/*" element={<AppRoutes />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;