// src/components/CelebrationModal.jsx
import { useEffect, useState } from "react";
import { X, Trophy, Sparkles } from "lucide-react";

const CelebrationModal = ({ visible, goal, onClose, darkMode }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      // Auto-cerrar después de 5 segundos
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Esperar animación
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible && !show) return null;

  const textClass = darkMode ? "text-gray-100" : "text-gray-900";
  const bgClass = darkMode ? "bg-gray-800" : "bg-white";
  const cardBg = darkMode ? "bg-gray-700" : "bg-purple-50";

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`${bgClass} rounded-3xl p-8 max-w-md w-full border-2 border-purple-500 shadow-2xl transform transition-all ${
          show ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti effect simulado con emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute top-4 left-4 text-4xl animate-bounce">🎉</div>
          <div className="absolute top-8 right-8 text-3xl animate-bounce delay-150">✨</div>
          <div className="absolute bottom-8 left-8 text-3xl animate-bounce delay-300">🎊</div>
          <div className="absolute bottom-4 right-4 text-4xl animate-bounce delay-75">⭐</div>
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <Trophy className="w-24 h-24 text-yellow-500 relative z-10" />
            </div>
          </div>

          <h2 className={`text-3xl font-bold mb-4 ${textClass}`}>
            ¡Objetivo Alcanzado!
          </h2>

          <div className={`${cardBg} rounded-2xl p-6 mb-6`}>
            <p className={`text-xl font-semibold mb-2 ${textClass}`}>
              {goal.name || "Objetivo Mensual"}
            </p>
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Meta
                </p>
                <p className={`text-2xl font-bold ${textClass}`}>
                  €{goal.goal?.toFixed(2) || goal.targetAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-purple-500" />
              <div>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Alcanzado
                </p>
                <p className={`text-2xl font-bold text-green-500`}>
                  €{goal.amount?.toFixed(2) || goal.currentAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </div>

          <p className={`text-lg mb-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            ¡Felicitaciones! Has cumplido tu objetivo. 🎯
          </p>

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all"
          >
            ¡Genial!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;


