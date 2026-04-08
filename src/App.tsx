import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import NewPasswordForm from './components/auth/NewPasswordForm';
import { UserDashboard } from './pages/utente/UserDashboard';
import { SecretaryDashboard } from './pages/secretary/SecretaryDashboard';
import { BalnearioDashboard } from './pages/balneario/BalnearioDashboard';
import { InternoDashboard } from './pages/interno/InternoDashboard';
import { EscolaDashboard } from './pages/escola/EscolaDashboard';
import { Toaster } from 'sonner';
import AbstractBackground from './components/shared/AbstractBackground';
import { useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LanguageToggle } from './components/shared/LanguageToggle';

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

  // CSRF Token Preflight: Generate XSRF-TOKEN cookie on app load
  // This ensures the token is available for subsequent POST requests (e.g., login)
  // Runs once on component mount
  useEffect(() => {
    const generateCsrfToken = async () => {
      try {
        await fetch('/api/auth/me', {
          credentials: 'include',
          method: 'GET',
        });
        console.debug('[CSRF] Preflight GET successful - XSRF-TOKEN cookie generated');
      } catch (error) {
        // Silently ignore errors - token generation is a best-effort operation
        // User may not be authenticated yet, which is fine
        console.debug('[CSRF] Preflight GET failed (expected if not authenticated):', error);
      }
    };

    generateCsrfToken();
  }, []); // Empty dependency array: run once on mount

  // Protected Route Component
  const ProtectedRoute = ({ children }: { children: any }) => {
    if (isLoading) return null;

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (user && !user.active) {
      // Two inactive scenarios:
      // 1) First login with temporary password -> force password setup
      // 2) Self-registered employee pending secretary approval -> show pending message
      if (user.requiresPasswordSetup) {
        return <Navigate to="/set-password" replace />;
      }

      if (['SECRETARIA', 'BALNEARIO', 'INTERNO', 'ESCOLA'].includes(user.role)) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-card/95 backdrop-blur-md p-8 rounded-lg shadow-xl border border-border max-w-md w-full text-center">
              <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Conta Pendente</h2>
              <p className="text-muted-foreground mb-8">
                A sua conta aguarda aprovação da secretaria. Por favor, aguarde ou contacte os serviços administrativos.
              </p>
              <button
                onClick={handleLogout}
                className="w-full bg-primary text-primary-foreground font-medium px-4 py-3 rounded-md hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Voltar ao Login
              </button>
            </div>
          </div>
        );
      }

      // For non-staff users, inactive means first-login completion.
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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center transition-colors duration-300">
        <AbstractBackground isDarkMode={isDarkMode} />
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
          <AbstractBackground isDarkMode={isDarkMode} />

          {/* Theme Toggle - Only show specific pages or always? Keeping logic: not on dashboard if dashboard handles it */}
          {/* Actually dashboards have their own toggles often, but global one is useful outside */}
          {(!isAuthenticated || location.pathname === '/set-password') && (
            <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
              {(location.pathname === '/login' || location.pathname === '/register') && (
                <LanguageToggle
                     variant="full"
                  className="bg-card px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                />
              )}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="bg-card p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-warning" />
                ) : (
                  <Moon className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>
          )}

          <div className="relative z-10 min-h-screen w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="min-h-screen"
              >
                <Routes location={location}>
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

                  {/* Rota 404 - Not Found */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center p-4">
                      <div className="backdrop-blur-md p-8 rounded-lg shadow-xl border border-border text-center max-w-md w-full bg-card/95">
                        <h2 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h2>
                        <p className="text-muted-foreground mb-6">A página que procura não existe ou foi movida.</p>
                        <button
                          onClick={() => navigate('/')}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-md transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                        >
                          Voltar ao Início
                        </button>
                      </div>
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
                        user.role === 'SECRETARIA' ? (
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
                        ) : user.role === 'BALNEARIO' ? (
                          <BalnearioDashboard
                            onLogout={handleLogout}
                            isDarkMode={isDarkMode}
                            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                          />
                        ) : user.role === 'INTERNO' ? (
                          <InternoDashboard
                            onLogout={handleLogout}
                            isDarkMode={isDarkMode}
                            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                          />
                        ) : user.role === 'ESCOLA' ? (
                          <EscolaDashboard
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

                  <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        <Toaster richColors position="top-center" closeButton />
      </div>
    </ErrorBoundary>
  );
}

export default App;
