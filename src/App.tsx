
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import NewPasswordForm from './components/NewPasswordForm';
import { UserDashboard } from './components/UserDashboard';
import { SecretaryDashboard } from './components/SecretaryDashboard';
import { Toaster } from 'sonner';
import AbstractBackground from './components/ui/AbstractBackground';
import { useAuth } from './contexts/AuthContext';

function App() {
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [registerInitialType, setRegisterInitialType] = useState<'user' | 'employee'>('user');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    return () => root.classList.remove('dark');
  }, [isDarkMode]);

  // Protected Route Component
  const ProtectedRoute = ({ children }: { children: any }) => {
    if (isLoading) return null;

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (user && !user.active) {
      // If a Funcionario is somehow logged in but inactive (e.g. waiting for approval),
      // show a specific message instead of redirecting to set-password
      if (user.role === 'FUNCIONARIO') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Conta Pendente</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                A sua conta aguarda aprovação da secretaria. Por favor, aguarde ou contacte os serviços administrativos.
              </p>
              <button
                onClick={handleLogout}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Voltar ao Login
              </button>
            </div>
          </div>
        );
      }

      // For Utentes (or others), redirect to set-password/terms
      return <Navigate to="/set-password" replace />;
    }

    return children;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
        <AbstractBackground isDarkMode={isDarkMode} />

        {/* Theme Toggle - Only show specific pages or always? Keeping logic: not on dashboard if dashboard handles it */}
        {/* Actually dashboards have their own toggles often, but global one is useful outside */}
        {(!isAuthenticated || location.pathname === '/set-password') && (
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="absolute top-6 right-6 z-50 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-purple-600" />
            )}
          </button>
        )}

        <div className="relative z-10 min-h-screen w-full">
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> :
                <div className="min-h-screen flex items-center justify-center p-4">
                  <LoginForm
                    isDarkMode={isDarkMode}
                    onNavigateToRegister={(type) => {
                      setRegisterInitialType(type ?? 'user');
                      navigate('/register');
                    }}
                  />
                </div>
            } />

            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> :
                <div className="min-h-screen flex items-center justify-center p-4">
                  <RegisterForm
                    onNavigateToLogin={() => navigate('/login')}
                    initialAccountType={registerInitialType}
                  />
                </div>
            } />

            <Route path="/set-password" element={
              isAuthenticated ? (
                <div className="min-h-screen flex items-center justify-center p-4">
                  <NewPasswordForm
                    onSuccess={() => navigate('/dashboard')}
                    isDarkMode={isDarkMode}
                  />
                </div>
              ) : <Navigate to="/login" replace />
            } />

            <Route path="/dashboard/*" element={
              <ProtectedRoute>
                {user ? (
                  user.role === 'FUNCIONARIO' ? (
                    <SecretaryDashboard
                      user={{
                        name: user.nome || '',
                        nif: user.nif || '',
                        contact: user.telefone || '',
                        email: user.email || ''
                      }}
                      onLogout={handleLogout}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                    />
                  ) : (
                    <UserDashboard
                      user={{
                        name: user.nome || '',
                        nif: user.nif || '',
                        contact: user.telefone || '',
                        email: user.email || ''
                      }}
                      onLogout={handleLogout}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                    />
                  )
                ) : null}
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </div>

      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
      <Toaster richColors position="top-center" closeButton />
    </div>
  );
}

export default App;
