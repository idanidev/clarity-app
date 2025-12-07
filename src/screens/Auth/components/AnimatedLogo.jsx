// src/screens/Auth/components/AnimatedLogo.jsx
import { motion } from "framer-motion";

const AnimatedLogo = ({ className = "" }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 shadow-xl flex items-center justify-center border border-white/40 backdrop-blur-xl"
      >
        <span className="text-2xl font-bold text-white">C</span>
      </motion.div>
      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 text-3xl font-bold bg-gradient-to-r from-purple-100 to-white bg-clip-text text-transparent"
      >
        Clarity
      </motion.h1>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-sm text-purple-100/80"
      >
        Gestiona tus gastos con claridad
      </motion.p>
    </div>
  );
};

export default AnimatedLogo;








