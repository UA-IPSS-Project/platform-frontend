import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoonIcon,
  SunIcon,
  GlobeIcon,
  BellIcon,
  ZapIcon,
  ShieldCheckIcon,
  Trash2Icon,
  RefreshCwIcon,
  ChevronDownIcon,
  InfoIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Volume2Icon,
  VolumeXIcon,
  HardDriveIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { GlassCard } from '../components/ui/glass-card';
import { toast } from 'sonner';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onBack?: () => void;
}

export function SettingsPage({ isDarkMode, onToggleDarkMode }: SettingsPageProps) {
  const { t, i18n } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    interface: true,
    notifications: true,
    system: true,
    data: false
  });

  const [notificationsSound, setNotificationsSound] = useState(() => {
    return localStorage.getItem('notifications_sound') !== 'false';
  });

  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);
  const [checkingSystem, setCheckingSystem] = useState(false);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    setCheckingSystem(true);
    try {
      // Simple ping to check connectivity
      await fetch(import.meta.env.VITE_API_URL || '', { mode: 'no-cors' });
      setSystemOnline(true);
    } catch (error) {
      setSystemOnline(false);
    } finally {
      setCheckingSystem(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    toast.success(t('settings.messages.languageChanged'));
  };

  const toggleSound = () => {
    const newValue = !notificationsSound;
    setNotificationsSound(newValue);
    localStorage.setItem('notifications_sound', String(newValue));
    toast.info(newValue ? t('settings.sounds.enabled') : t('settings.sounds.disabled'));
  };

  const handleClearCache = () => {
    if (window.confirm(t('settings.clearCache.description'))) {
      const currentTheme = localStorage.getItem('theme');
      localStorage.clear();
      sessionStorage.clear();
      if (currentTheme) localStorage.setItem('theme', currentTheme);
      toast.success(t('settings.clearCache.success'));
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const renderSectionHeader = (id: string, icon: React.ReactNode, title: string) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 transition-colors rounded-t-xl group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <motion.div
        animate={{ rotate: expandedSections[id] ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
      </motion.div>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <div className="grid gap-6">
        {/* INTERFACE SECTION */}
        <GlassCard className="overflow-hidden border-none shadow-md">
          {renderSectionHeader('interface', <GlobeIcon className="w-5 h-5" />, t('settings.sections.interface'))}
          <AnimatePresence>
            {expandedSections.interface && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-6 bg-card/50">
                  {/* Theme Selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background/40 border border-border/50">
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">{t('settings.theme.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('settings.theme.description')}</p>
                    </div>
                    <div className="flex p-1 bg-primary/5 rounded-lg border border-primary/20">
                      <button
                        onClick={onToggleDarkMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${!isDarkMode ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <SunIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('settings.theme.light')}</span>
                      </button>
                      <button
                        onClick={onToggleDarkMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${isDarkMode ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <MoonIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('settings.theme.dark')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background/40 border border-border/50">
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">{t('settings.language.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('settings.language.description')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={i18n.language === 'pt' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => changeLanguage('pt')}
                        className="min-w-[80px]"
                      >
                        PT
                      </Button>
                      <Button
                        variant={i18n.language === 'en' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => changeLanguage('en')}
                        className="min-w-[80px]"
                      >
                        EN
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* NOTIFICATIONS SECTION */}
        <GlassCard className="overflow-hidden border-none shadow-md">
          {renderSectionHeader('notifications', <BellIcon className="w-5 h-5" />, t('settings.sections.notifications'))}
          <AnimatePresence>
            {expandedSections.notifications && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-card/50">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${notificationsSound ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {notificationsSound ? <Volume2Icon className="w-5 h-5" /> : <VolumeXIcon className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-foreground">{t('settings.sounds.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('settings.sounds.description')}</p>
                      </div>
                    </div>
                    <Button
                      variant={notificationsSound ? 'default' : 'outline'}
                      onClick={toggleSound}
                      className="min-w-[120px]"
                    >
                      {notificationsSound ? t('settings.sounds.enabled') : t('settings.sounds.disabled')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* SYSTEM STATUS SECTION */}
        <GlassCard className="overflow-hidden border-none shadow-md">
          {renderSectionHeader('system', <ZapIcon className="w-5 h-5" />, t('settings.sections.system'))}
          <AnimatePresence>
            {expandedSections.system && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-4 bg-card/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Connectivity card */}
                    <div className="p-4 rounded-xl bg-background/40 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${systemOnline ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {systemOnline ? <ShieldCheckIcon className="w-5 h-5" /> : <AlertCircleIcon className="w-5 h-5" />}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs text-muted-foreground">{t('settings.systemStatus.title')}</span>
                          <p className="font-semibold text-foreground">
                            {systemOnline ? t('settings.systemStatus.online') : t('settings.systemStatus.offline')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={checkSystemHealth}
                        className={`p-2 rounded-lg hover:bg-primary/5 text-muted-foreground transition-all ${checkingSystem ? 'animate-spin text-primary' : ''}`}
                      >
                        <RefreshCwIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Version card */}
                    <div className="p-4 rounded-xl bg-background/40 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                          <InfoIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs text-muted-foreground">{t('settings.systemStatus.version')}</span>
                          <p className="font-semibold text-foreground">v1.2.4-stable</p>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 bg-blue-500/20 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                        Production
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 text-primary-foreground/90 border border-primary/10">
                    <CheckCircle2Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground/80">{t('settings.systemStatus.lastChecked')}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* DATA MANAGEMENT SECTION */}
        <GlassCard className="overflow-hidden border-none shadow-md">
          {renderSectionHeader('data', <HardDriveIcon className="w-5 h-5" />, t('settings.sections.data'))}
          <AnimatePresence>
            {expandedSections.data && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-card/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20 transition-all hover:bg-destructive/10">
                    <div className="space-y-1">
                      <h4 className="font-medium text-destructive flex items-center gap-2">
                        <Trash2Icon className="w-4 h-4" />
                        {t('settings.clearCache.title')}
                      </h4>
                      <p className="text-sm text-muted-foreground">{t('settings.clearCache.description')}</p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleClearCache}
                      className="min-w-[160px] shadow-sm active:scale-95 transition-transform"
                    >
                      {t('settings.clearCache.action')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
}
