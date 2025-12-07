import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFormValidation } from "../../hooks/useFormValidation";
import { isValidEmail } from "../../utils/validators";
import InputField from "./components/InputField";

const ForgotPasswordForm = ({ onBack }) => {
  const { resetPassword, loading, error: authError } = useAuth();
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
      },
      { email: "" } // ✅ Valores iniciales
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const isValid = validateForm();
    if (!isValid) return;

    try {
      await resetPassword(values.email);
      setSuccessMessage(
        "Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña."
      );
    } catch {
      setFormError(
        "No se ha podido enviar el email de recuperación. Inténtalo de nuevo más tarde."
      );
    }
  };

  const finalError = formError || authError;

  return (
    <motion.form
      key="forgot"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <p className="text-sm text-white/80">
        Introduce tu email y te enviaremos un enlace para restablecer tu
        contraseña.
      </p>

      {finalError && (
        <div className="bg-red-500/10 border border-red-400/60 text-red-100 text-sm rounded-xl px-3 py-2">
          {finalError}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-400/60 text-emerald-100 text-sm rounded-xl px-3 py-2">
          {successMessage}
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

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-white/20 text-white/90 font-semibold py-3 rounded-xl hover:bg-white/5 transition-all"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-white text-purple-700 font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </div>
    </motion.form>
  );
};

export default ForgotPasswordForm;






