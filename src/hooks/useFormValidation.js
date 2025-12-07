import { useCallback, useState } from "react";

/**
 * Hook de validación ligera basado en un "schema" de funciones.
 *
 * schema: {
 *   campo: (value, values) => string | null  // mensaje de error o null si es válido
 * }
 * initialValues: valores iniciales para los campos del formulario
 */
export const useFormValidation = (schema = {}, initialValues = {}) => {
  const [values, setValues] = useState(initialValues); // ✅ Inicializa con initialValues
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback(
    (name, value, currentValues) => {
      const validator = schema[name];
      if (!validator) return null;
      return validator(value, currentValues);
    },
    [schema]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setValues((prev) => {
        const nextValues = { ...prev, [name]: value };
        const error = validateField(name, value, nextValues);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: error,
        }));
        return nextValues;
      });
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prevErrors) => {
        const value = values[name];
        const error = validateField(name, value, values);
        return {
          ...prevErrors,
          [name]: error,
        };
      });
    },
    [validateField, values]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(schema).forEach((name) => {
      const value = values[name];
      const error = validateField(name, value, values);
      if (error) {
        newErrors[name] = error;
      }
    });
    setErrors(newErrors);
    setTouched(
      Object.keys(schema).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return Object.keys(newErrors).length === 0;
  }, [schema, validateField, values]);

  const isValid = Object.values(errors).every((e) => !e);

  return {
    values,
    errors,
    touched,
    setValues,
    handleChange,
    handleBlur,
    validateForm,
    isValid,
  };
};








