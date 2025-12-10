// src/utils/validators.js

export const isValidEmail = (email) => {
  if (!email) return false;
  // Validación básica de email
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).toLowerCase());
};

export const getPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: "Muy débil",
      requirements: {
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
      },
    };
  }

  const length = password.length >= 8;
  const uppercase = /[A-Z]/.test(password);
  const number = /[0-9]/.test(password);
  const specialChar = /[^A-Za-z0-9]/.test(password);

  const passed = [length, uppercase, number, specialChar].filter(Boolean).length;

  let score = passed;
  let label = "Muy débil";

  if (score === 1) label = "Débil";
  if (score === 2) label = "Media";
  if (score === 3) label = "Fuerte";
  if (score === 4) label = "Muy fuerte";

  return {
    score,
    label,
    requirements: {
      length,
      uppercase,
      number,
      specialChar,
    },
  };
};















