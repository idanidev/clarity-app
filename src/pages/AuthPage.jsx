import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { IconMail, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { auth, googleProvider } from '../firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const AuthPage = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Sesión iniciada correctamente');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Cuenta creada correctamente');
      }
    } catch (err) {
      const errorMessages = {
        'auth/email-already-in-use': 'Email ya registrado',
        'auth/invalid-email': 'Email inválido',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/weak-password': 'Contraseña muy débil (mínimo 6 caracteres)',
      };
      toast.error(errorMessages[err.code] || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Sesión iniciada con Google');
    } catch (err) {
      console.error('Google auth error:', err);
      toast.error('Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error('Introduce tu email para recuperar la contraseña');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast.success('Email de recuperación enviado');
    } catch (err) {
      toast.error('Error al enviar email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <motion.h1
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
              >
                Clarity
              </motion.h1>
              <p className="text-purple-600 dark:text-purple-400">
                Gestiona tus gastos con claridad
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setResetSent(false);
                }}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-all',
                  isLogin
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/60 dark:bg-gray-700 text-purple-600 dark:text-purple-400 hover:bg-white/80 dark:hover:bg-gray-600'
                )}
              >
                {t('login')}
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setResetSent(false);
                }}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-all',
                  !isLogin
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/60 dark:bg-gray-700 text-purple-600 dark:text-purple-400 hover:bg-white/80 dark:hover:bg-gray-600'
                )}
              >
                {t('register')}
              </button>
            </div>

            {/* Success Message */}
            {resetSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4"
              >
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Email de recuperación enviado. Revisa tu bandeja de entrada.
                </p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative mt-2">
                  <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative mt-2">
                  <IconLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {isLogin && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                >
                  {t('forgotPassword')}
                </button>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cargando...
                  </span>
                ) : isLogin ? (
                  t('login')
                ) : (
                  t('register')
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400">
                  {t('continueWith')}
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            {/* Terms */}
            <p className="text-xs text-purple-500 dark:text-purple-400 text-center mt-6">
              Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
