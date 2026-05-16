import { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { UserManager, WebStorageStateStore, User as OidcUser } from 'oidc-client-ts';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8180';
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'florinhas';
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'florinhas-frontend';

const userManager = new UserManager({
  authority: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
  client_id: KEYCLOAK_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/login`,
  response_type: 'code',
  scope: 'openid profile email roles',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
  silent_redirect_uri: `${window.location.origin}/auth/silent-renew`,
});

interface User {
  id: string;
  email: string;
  nome: string;
  role: 'UTENTE' | 'SECRETARIA' | 'BALNEARIO' | 'ESCOLA' | 'INTERNO';
  nif?: string;
  telefone?: string;
  active: boolean;
  requiresPasswordSetup: boolean;
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapOidcUser(oidcUser: OidcUser): User {
  const roles: string[] = (oidcUser.profile['roles'] as string[]) ?? [];
  const knownRoles = ['SECRETARIA', 'BALNEARIO', 'ESCOLA', 'INTERNO', 'UTENTE'] as const;
  const role = knownRoles.find(r => roles.includes(r)) ?? 'UTENTE';

  return {
    id: oidcUser.profile.sub,
    email: oidcUser.profile.email ?? '',
    nome: oidcUser.profile.name ?? oidcUser.profile.preferred_username ?? '',
    role,
    active: true,
    requiresPasswordSetup: false,
  };
}

function clearDashboardState() {
  [
    'lastActivity', 'token', 'user',
    'secretaryDashboardViewHistory', 'balnearioDashboardViewHistory',
    'escolaDashboardView', 'internoDashboardView',
    'secretaryDashboardView', 'balnearioDashboardView', 'adminDashboardView',
  ].forEach(k => localStorage.removeItem(k));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

  const updateActivity = () => localStorage.setItem('lastActivity', Date.now().toString());

  const handleOidcUser = (oidcUser: OidcUser | null) => {
    if (oidcUser && !oidcUser.expired) {
      setUser(mapOidcUser(oidcUser));
      setIsAuthenticated(true);
      updateActivity();
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Handle PKCE callback
    if (window.location.pathname === '/auth/callback') {
      userManager.signinRedirectCallback()
        .then(oidcUser => {
          handleOidcUser(oidcUser);
          // Restore pre-login path or go to root (App routing handles role redirect)
          const returnTo = sessionStorage.getItem('returnTo') ?? '/';
          sessionStorage.removeItem('returnTo');
          window.history.replaceState({}, '', returnTo);
        })
        .catch(() => window.location.replace('/login'))
        .finally(() => setIsLoading(false));
      return;
    }

    // Restore existing session
    userManager.getUser().then(oidcUser => {
      handleOidcUser(oidcUser);
      setIsLoading(false);
    });

    // Token renewal events
    userManager.events.addUserLoaded(oidcUser => handleOidcUser(oidcUser));
    userManager.events.addUserUnloaded(() => { setUser(null); setIsAuthenticated(false); });
    userManager.events.addSilentRenewError(() => logout());

    return () => userManager.events.removeUserLoaded(handleOidcUser);
  }, []);

  // Inactivity timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last > 60_000) { updateActivity(); last = now; }
    };
    events.forEach(e => window.addEventListener(e, onActivity));

    inactivityTimer.current = setInterval(() => {
      const saved = localStorage.getItem('lastActivity');
      if (saved && Date.now() - parseInt(saved) > INACTIVITY_TIMEOUT) logout();
    }, 60_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      if (inactivityTimer.current) clearInterval(inactivityTimer.current);
    };
  }, [isAuthenticated]);

  const login = async () => {
    sessionStorage.setItem('returnTo', window.location.pathname);
    await userManager.signinRedirect();
  };

  const logout = async () => {
    clearDashboardState();
    setUser(null);
    setIsAuthenticated(false);
    await userManager.signoutRedirect();
  };

  const getAccessToken = async (): Promise<string | null> => {
    const oidcUser = await userManager.getUser();
    return oidcUser?.access_token ?? null;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export { userManager };
