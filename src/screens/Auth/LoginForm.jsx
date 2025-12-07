import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFormValidation } from "../../hooks/useFormValidation";
import { isValidEmail } from "../../utils/validators";
import InputField from "./components/InputField";
import BiometricSetup from "./components/BiometricSetup";
import { useShake, ShakeWrapper } from "../../hooks/useShake";

const LoginForm = ({ onForgotPassword }) => {
  const {
    signIn,
    loading,
    error: authError,
    user,
    biometricAvailable,
    hasBiometricCredentials,
  } = useAuth();
  const [formError, setFormError] = useState(null);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const { isShaking, shake } = useShake();

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

  const handleSubmit = async (e) => {
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

      // Mostrar setup de biometría si está disponible y no está configurado
      if (loggedUser && biometricAvailable && !hasBiometricCredentials()) {
        setShowBiometricSetup(true);
      }
    } catch {
      setFormError("No se ha podido iniciar sesión. Revisa tus datos.");
      shake();
    }
  };

  // Callback cuando se autentica con biometría desde SocialLoginButtons
  const handleBiometricSuccess = (email) => {
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




