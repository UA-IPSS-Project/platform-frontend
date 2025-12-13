import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import NewPasswordForm from './components/NewPasswordForm';
import { UserDashboard } from './components/UserDashboard';
import { SecretaryDashboard } from './components/SecretaryDashboard';
import { Toaster } from 'sonner';
import AbstractBackground from './components/ui/AbstractBackground';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard' | 'set-new-password'>('login');
  const [registerInitialType, setRegisterInitialType] = useState<'user' | 'employee'>('user');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return () => root.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    setCurrentView('login');
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
        {/* Animated background */}
        <AbstractBackground isDarkMode={isDarkMode} />

        {/* Logo - Only show on login/register */}
        {currentView !== 'dashboard' && (
          <div className="absolute top-6 left-20 z-50 transition-all duration-200">
            <img
              src="/src/assets/LogoSemTextoUltimo.png"
              alt="Logo Florinhas"
              className="w-auto h-16 md:h-20 object-contain hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {/* Theme Toggle - Only show on login/register */}
        {currentView !== 'dashboard' && (
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

        {/* Content */}
        {currentView === 'dashboard' && isAuthenticated && user ? (
          <div className="relative z-10 min-h-screen w-full">
            {user.role === 'FUNCIONARIO' ? (
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
            )}
          </div>
        ) : (
          <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
            {currentView === 'login' && (
              <LoginForm
                onNavigateToRegister={(type) => {
                  setRegisterInitialType(type ?? 'user');
                  setCurrentView('register');
                }}
              />
            )}
            {currentView === 'register' && (
              <RegisterForm
                onNavigateToLogin={() => setCurrentView('login')}
                initialAccountType={registerInitialType}
              />
            )}
            {currentView === 'set-new-password' && (
              <NewPasswordForm onSuccess={() => setCurrentView('login')} />
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      <Toaster richColors position="top-center" closeButton />
    </div>
  );
}

export default App;
