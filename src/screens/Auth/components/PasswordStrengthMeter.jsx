// src/screens/Auth/components/PasswordStrengthMeter.jsx
import { getPasswordStrength } from "../../../utils/validators";

const strengthColors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];

const PasswordStrengthMeter = ({ password }) => {
  const { score, label, requirements } = getPasswordStrength(password);

  const bars = [0, 1, 2, 3];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {bars.map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? strengthColors[score - 1] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600">Fortaleza: {label}</p>
      <ul className="text-[11px] text-gray-600 grid grid-cols-2 gap-1">
        <li className={requirements.length ? "text-green-600" : ""}>
          • Mínimo 8 caracteres
        </li>
        <li className={requirements.uppercase ? "text-green-600" : ""}>
          • Al menos 1 mayúscula
        </li>
        <li className={requirements.number ? "text-green-600" : ""}>
          • Al menos 1 número
        </li>
        <li className={requirements.specialChar ? "text-green-600" : ""}>
          • 1 carácter especial
        </li>
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;





