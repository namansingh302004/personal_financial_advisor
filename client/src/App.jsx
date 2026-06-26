import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/analytics"
            element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #dee9fd',
              color: '#121c2a',
              background: '#fff',
            },
            success: {
              iconTheme: { primary: '#064e3b', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ba1a1a', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
