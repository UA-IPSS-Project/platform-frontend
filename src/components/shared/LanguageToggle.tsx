import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface LanguageToggleProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function LanguageToggle({ variant = 'full', className = '' }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const [isSpinning, setIsSpinning] = useState(false);

  const currentLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'pt';

  const handleToggleLanguage = async () => {
    const nextLanguage = currentLanguage === 'pt' ? 'en' : 'pt';
    setIsSpinning(true);
    document.documentElement.classList.add('language-refreshing');
    await i18n.changeLanguage(nextLanguage);
    window.setTimeout(() => {
      setIsSpinning(false);
      document.documentElement.classList.remove('language-refreshing');
    }, 500);
  };

  return (
    <Button
      variant="ghost"
      size={variant === 'icon' ? 'icon' : 'sm'}
      onClick={() => void handleToggleLanguage()}
      className={`text-foreground hover:bg-accent transition-colors ${variant === 'full' ? 'px-2 gap-2' : ''} ${className}`}
      aria-label={t('header.switchLanguage')}
      title={t('header.language')}
    >
      <Globe className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
      {variant === 'full' && <span>{currentLanguage === 'pt' ? t('header.pt') : t('header.en')}</span>}
    </Button>
  );
}
