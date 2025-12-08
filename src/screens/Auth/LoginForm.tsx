import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Fingerprint } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFormValidation } from "../../hooks/useFormValidation";
import { isValidEmail } from "../../utils/validators";
import InputField from "./components/InputField";
import BiometricSetup from "./components/BiometricSetup";
import { useShake, ShakeWrapper } from "../../hooks/useShake";
import { checkBiometricAvailable, authenticate } from "../../services/biometric";
import { isIOS } from "../../utils/platform";
import { hapticSuccess, hapticError } from "../../utils/haptics";

interface LoginFormProps {
  onForgotPassword: () => void;
}

const LoginForm = ({ onForgotPassword }: LoginFormProps) => {
  const {
    signIn,
    loading,
    error: authError,
    user,
    biometricAvailable: webAuthnAvailable,
    hasBiometricCredentials,
  } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [nativeBiometricAvailable, setNativeBiometricAvailable] = useState(false);
  const { isShaking, shake } = useShake();

  // Verificar disponibilidad de biométrico nativo
  useEffect(() => {
    if (isIOS) {
      checkBiometricAvailable().then(setNativeBiometricAvailable);
    }
  }, []);

  const {
    values,
    errors,
    touched,
    setValues,
    handleChange,
    handleBlur,
    validateForm,
  } = useFormValidation(
    {
      email: (value) =>
        !value
          ? "El email es obligatorio"
          : !isValidEmail(value)
          ? "Introduce un email válido"
          : null,
      password: (value) =>
        !value
          ? "La contraseña es obligatoria"
          : value.length < 8
          ? "La contraseña debe tener al menos 8 caracteres"
          : null,
    },
    { email: "", password: "" }
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Activar shake si hay errores de validación
    if (!validateForm()) {
      shake();
      return;
    }

    const isValid = validateForm();
    if (!isValid) {
      shake();
      return;
    }

    try {
      const loggedUser = await signIn(values.email, values.password);
      hapticSuccess();

      // Mostrar setup de biometría si está disponible y no está configurado
      if (loggedUser && (webAuthnAvailable || nativeBiometricAvailable) && !hasBiometricCredentials()) {
        setShowBiometricSetup(true);
      }
    } catch {
      hapticError();
      setFormError("No se ha podido iniciar sesión. Revisa tus datos.");
      shake();
    }
  };

  // Handler para Face ID nativo (iOS)
  const handleNativeBiometricLogin = async () => {
    if (!nativeBiometricAvailable) return;

    try {
      const success = await authenticate("Accede a Clarity con Face ID");
      if (success) {
        hapticSuccess();
        // Aquí deberías cargar las credenciales guardadas y hacer login automático
        // Por ahora solo mostramos un mensaje
        setFormError(null);
        // TODO: Implementar carga de credenciales guardadas y login automático
        // const savedEmail = localStorage.getItem('biometric_user_email');
        // if (savedEmail) {
        //   await signIn(savedEmail, savedPassword); // Necesitarías guardar password de forma segura
        // }
      } else {
        hapticError();
      }
    } catch (error) {
      console.error("Error en autenticación biométrica:", error);
      hapticError();
    }
  };

  // Callback cuando se autentica con biometría desde SocialLoginButtons
  const handleBiometricSuccess = (email: string) => {
    // Autocompletar el email cuando se autentica con biometría
    setValues({ ...values, email });
  };

  const finalError = formError || authError;

  return (
    <>
      <ShakeWrapper isShaking={isShaking}>
        <motion.form
          key="login"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {finalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3"
            >
              {finalError}
            </motion.div>
          )}

          <InputField
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            value={values.email || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
            placeholder="tu@email.com"
            autoComplete="email"
          />

          <InputField
            label="Contraseña"
            name="password"
            type="password"
            icon={Lock}
            value={values.password || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            touched={touched.password}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón Face ID (solo iOS nativo) */}
          {isIOS && nativeBiometricAvailable && (
            <button
              type="button"
              onClick={handleNativeBiometricLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-5 h-5" />
              Acceder con Face ID
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar sesión
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </motion.form>
      </ShakeWrapper>

      {/* Modal de setup biométrico */}
      {showBiometricSetup && user && (
        <BiometricSetup
          onClose={() => setShowBiometricSetup(false)}
          userEmail={values.email}
          userId={user.uid}
        />
      )}
    </>
  );
};

export default LoginForm;

