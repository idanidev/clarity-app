// src/screens/Auth/components/InputField.jsx
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const InputField = ({
  label,
  name,
  type,
  icon: Icon,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  autoComplete,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;
  const hasError = touched && error;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <div className="relative">
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
            isFocused
              ? "text-purple-500 dark:text-purple-400"
              : hasError
              ? "text-red-500 dark:text-red-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full pl-11 pr-${
            type === "password" ? "11" : "4"
          } py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl
            text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
            transition-all duration-200 outline-none
            ${
              hasError
                ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            }`}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputField;












