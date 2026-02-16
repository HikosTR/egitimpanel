import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import UserManagement from '@/pages/UserManagement';
import CourseManagement from '@/pages/CourseManagement';
import CourseDetail from '@/pages/CourseDetail';
import VideoPlayer from '@/pages/VideoPlayer';
import QuizPage from '@/pages/QuizPage';
import DistributorDashboard from '@/pages/DistributorDashboard';
import ProfilePage from '@/pages/ProfilePage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-10 h-10 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'distributor' ? '/dashboard' : '/admin'} /> : <LoginPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['super_admin', 'admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['super_admin', 'admin']}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute roles={['super_admin', 'admin']}><CourseManagement /></ProtectedRoute>} />
      <Route path="/admin/courses/:courseId" element={<ProtectedRoute roles={['super_admin', 'admin']}><CourseDetail /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['super_admin', 'admin']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['super_admin', 'admin']}><SettingsPage /></ProtectedRoute>} />
      
      {/* Distributor Routes */}
      <Route path="/dashboard" element={<ProtectedRoute roles={['distributor']}><DistributorDashboard /></ProtectedRoute>} />
      <Route path="/course/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
      <Route path="/video/:videoId" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />
      <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      
      {/* Shared Routes */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      
      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
