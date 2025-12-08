import { motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFormValidation } from "../../hooks/useFormValidation";
import { isValidEmail } from "../../utils/validators";
import InputField from "./components/InputField";
import PasswordStrengthMeter from "./components/PasswordStrengthMeter";

const RegisterForm = () => {
  const { signUp, loading, error: authError, isEmailVerified } = useAuth();
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { values, errors, touched, handleChange, handleBlur, validateForm } =
    useFormValidation(
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
        confirmPassword: (value, allValues) =>
          !value
            ? "Confirma tu contraseña"
            : value !== allValues.password
            ? "Las contraseñas no coinciden"
            : null,
      },
      { email: "", password: "", confirmPassword: "" } // ✅ Valores iniciales
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const isValid = validateForm();
    if (!isValid) return;

    try {
      await signUp(values.email, values.password);
      setSuccessMessage(
        "Cuenta creada correctamente. Te hemos enviado un email para verificar tu cuenta."
      );
    } catch {
      setFormError(
        "No se ha podido crear la cuenta. Revisa los datos o inténtalo de nuevo más tarde."
      );
    }
  };

  const finalError = formError || authError;

  return (
    <motion.form
      key="register"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {finalError && (
        <div className="bg-red-500/10 border border-red-400/60 text-red-100 text-sm rounded-xl px-3 py-2">
          {finalError}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-400/60 text-emerald-100 text-sm rounded-xl px-3 py-2">
          {successMessage}
          {!isEmailVerified && (
            <div className="mt-1 text-[11px] text-emerald-100/80">
              Revisa tu bandeja de entrada y la carpeta de spam.
            </div>
          )}
        </div>
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

      <div>
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
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={values.password || ""} />
      </div>

      <InputField
        label="Confirmar contraseña"
        name="confirmPassword"
        type="password"
        icon={Lock}
        value={values.confirmPassword || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.confirmPassword}
        touched={touched.confirmPassword}
        placeholder="Repite tu contraseña"
        autoComplete="new-password"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-white text-purple-700 font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </motion.form>
  );
};

export default RegisterForm;










