import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { GlassCard } from '../../components/ui/glass-card';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  const error = searchParams.get('error');

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 border border-border/40">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={'/assets/LogoSemTexto.png'}
              alt="Logo Florinhas"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('auth.welcome')}</h1>
          <p className="text-muted-foreground">{t('auth.platformSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
             {error === 'invalid_scope' 
               ? 'Erro de configuração: Os parâmetros de autenticação (scopes) não são permitidos pelo servidor.' 
               : `Erro ao autenticar: ${error}`}
          </div>
        )}

        <div className="space-y-6">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-lg transition-colors duration-200 text-lg font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('auth.loggingIn', 'A entrar...')}
              </div>
            ) : (
              t('auth.login')
            )}
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground">
              {t('auth.noAccount', 'Ainda não tem conta?')}{' '}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                {t('auth.createAccount')}
              </Link>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
