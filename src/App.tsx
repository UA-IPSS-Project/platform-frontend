import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { UserDashboard } from './components/UserDashboard';
import { SecretaryDashboard } from './components/SecretaryDashboard';
import { Toaster } from 'sonner';
import AbstractBackground from './components/ui/AbstractBackground';

type UserType = 'user' | 'secretary' | null;

interface User {
  name: string;
  nif: string;
  contact: string;
  email: string;
  birthDate?: string;
  type: UserType;
}

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [registerInitialType, setRegisterInitialType] = useState<'user' | 'employee'>('user');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return () => root.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogin = (identifier: string, password: string) => {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user by identifier (can be NIF, contact, or email)
    const user = users.find((u: User) => 
      u.nif === identifier || 
      u.contact === identifier || 
      u.email === identifier
    );

    if (user) {
      const pwKey = user.nif && user.nif.trim() ? user.nif : user.email;
      if (localStorage.getItem(`password_${pwKey}`) === password) {
        // Determine user type based on login identifier
        let userType: UserType = 'user';
        
        // If identifier is 9 digits (NIF or contact), it's a user
        if (/^\d{9}$/.test(identifier)) {
          userType = 'user';
        } 
        // If identifier ends with @florinhas.pt, it's secretary
        else if (identifier.endsWith('@florinhas.pt')) {
          userType = 'secretary';
        }
        // If logging in with regular email but user has @florinhas.pt email
        else if (user.email.endsWith('@florinhas.pt')) {
          userType = 'secretary';
        }

        const loggedUser = { ...user, type: userType };
        setCurrentUser(loggedUser);
        setCurrentView('dashboard');
        return true;
      }
    }
    
    return false;
  };

  const handleRegister = (userData: Omit<User, 'type'> & { accountType?: 'user' | 'employee' }, password: string) => {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Determine type: employees become 'secretary' so they see staff dashboard
    const type: UserType = userData.accountType === 'employee' ? 'secretary' : 'user';
    const newUser: User = { ...userData, type };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    // store password keyed by nif when available, otherwise by email
    const pwKey = userData.nif && userData.nif.trim() ? userData.nif : userData.email;
    localStorage.setItem(`password_${pwKey}`, password);
    
    setCurrentView('login');
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
        {/* Animated background */}
        <AbstractBackground isDarkMode={isDarkMode} />

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
        {currentView === 'dashboard' && currentUser ? (
          <div className="relative z-10 min-h-screen w-full">
            {currentUser.type === 'secretary' ? (
              <SecretaryDashboard 
                user={currentUser} 
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              />
            ) : (
              <UserDashboard
                user={currentUser}
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
                  onLogin={handleLogin}
                  onNavigateToRegister={(type) => {
                    setRegisterInitialType(type ?? 'user');
                    setCurrentView('register');
                  }}
                />
            )}
              {currentView === 'register' && (
                <RegisterForm 
                  onRegister={handleRegister}
                  onNavigateToLogin={() => setCurrentView('login')}
                  initialAccountType={registerInitialType}
                />
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
