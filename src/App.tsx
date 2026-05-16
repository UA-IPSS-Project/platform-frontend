import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AuthCallback from './pages/auth/AuthCallback';
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
import { TermsReacceptanceModal } from './components/dialogs/TermsReacceptanceModal';
import { useTermsCheck } from './hooks/useTermsCheck';

// Triggers Keycloak PKCE redirect on render
function LoginRedirect() {
  const { login } = useAuth();
  useEffect(() => { login(); }, []);
  return null;
}

// Triggers Keycloak PKCE redirect on render
function LoginRedirect() {
  const { login } = useAuth();
  useEffect(() => { login(); }, []);
  return null;
}

function App() {
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const { needsAcceptance, currentVersion, accept } = useTermsCheck(isAuthenticated);

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

  const ProtectedRoute = ({ children }: { children: any }) => {
    if (isLoading) return null;
    if (!isAuthenticated) return <LoginRedirect />;
    return children;
  };

  const handleLogout = () => {
    logout(); // signoutRedirect to Keycloak handled inside AuthContext
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
                  {/* Keycloak PKCE callback */}
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* /login redirects to Keycloak */}
                  <Route path="/login" element={
                    isAuthenticated
                      ? <Navigate to="/dashboard" replace />
                      : <LoginRedirect />
                  } />

                  {/* /register and /set-password no longer exist — managed by Keycloak */}
                  <Route path="/register" element={<Navigate to="/login" replace />} />
                  <Route path="/set-password" element={<Navigate to="/dashboard" replace />} />

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

        <TermsReacceptanceModal
          isOpen={isAuthenticated && needsAcceptance}
          version={currentVersion}
          onAccept={accept}
        />

        <Toaster 
          richColors 
          position="top-right" 
          expand={true}
          duration={5000}
          closeButton 
          toastOptions={{
            style: { zIndex: 99999 }
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
