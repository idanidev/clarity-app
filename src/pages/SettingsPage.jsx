import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IconSettings, IconMoon, IconSun, IconLanguage } from '@tabler/icons-react';
import { useExpenseStore } from '../store/expenseStore';
import { useSaveTheme } from '../hooks/useExpenseQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Label } from '../components/ui/Label';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const toggleDarkMode = useExpenseStore((state) => state.toggleDarkMode);

  // TODO: Obtener userId del contexto de auth
  const userId = 'user-id-placeholder';
  const saveTheme = useSaveTheme(userId);

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';
  const textSecondaryClass = darkMode ? 'text-gray-400' : 'text-purple-600';

  const handleThemeToggle = async () => {
    toggleDarkMode();
    try {
      await saveTheme.mutateAsync(darkMode ? 'light' : 'dark');
    } catch (error) {
      toast.error('Error al guardar el tema');
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    toast.success(`Idioma cambiado a ${lang === 'es' ? 'Español' : 'English'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <IconSettings className="w-8 h-8 text-purple-600" />
          <h1 className={cn('text-3xl font-bold', textClass)}>{t('settings')}</h1>
        </div>
      </motion.div>

      {/* Apariencia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>
              Personaliza la apariencia de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Modo Oscuro */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <IconMoon className="w-5 h-5 text-purple-400" />
                ) : (
                  <IconSun className="w-5 h-5 text-purple-600" />
                )}
                <div>
                  <Label htmlFor="dark-mode" className="text-base">
                    {darkMode ? t('darkMode') : t('lightMode')}
                  </Label>
                  <p className={cn('text-sm mt-1', textSecondaryClass)}>
                    {t('changeTheme')}
                  </p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Idioma */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Idioma</CardTitle>
            <CardDescription>Selecciona tu idioma preferido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <IconLanguage className="w-5 h-5 text-purple-600" />
              <Label className="text-base">Idioma de la aplicación</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('es')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all text-left',
                  i18n.language === 'es'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : darkMode
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="font-semibold">🇪🇸 Español</div>
                <div className={cn('text-sm', textSecondaryClass)}>Spanish</div>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all text-left',
                  i18n.language === 'en'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : darkMode
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="font-semibold">🇬🇧 English</div>
                <div className={cn('text-sm', textSecondaryClass)}>Inglés</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Acerca de */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('aboutClarity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={textSecondaryClass}>{t('version')}</span>
              <span className={cn('font-semibold', textClass)}>2.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={textSecondaryClass}>Descripción</span>
              <span className={cn('font-semibold', textClass)}>
                {t('personalExpenseManagement')}
              </span>
            </div>
            <div className="pt-4 border-t dark:border-gray-700">
              <p className={cn('text-sm text-center', textSecondaryClass)}>
                Desarrollado con 💜 por el equipo de Clarity
              </p>
              <p className={cn('text-xs text-center mt-2', textSecondaryClass)}>
                © 2025 Clarity. Todos los derechos reservados.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Información del Sistema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className={textSecondaryClass}>Framework</span>
              <span className={cn('font-mono', textClass)}>React 18.3</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={textSecondaryClass}>Build Tool</span>
              <span className={cn('font-mono', textClass)}>Vite 5.2</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={textSecondaryClass}>Estado Global</span>
              <span className={cn('font-mono', textClass)}>Zustand 4.5</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={textSecondaryClass}>Data Fetching</span>
              <span className={cn('font-mono', textClass)}>Tanstack Query 5.32</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={textSecondaryClass}>UI Components</span>
              <span className={cn('font-mono', textClass)}>Shadcn UI</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
