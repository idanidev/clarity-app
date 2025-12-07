import { motion, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getTransition } from '../config/framerMotion';

const SwipeableModal = ({ 
  visible, 
  onClose, 
  title, 
  children, 
  darkMode = false 
}) => {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleDragEnd = (event, info) => {
    // Si desliza más de 150px hacia abajo, cerrar
    if (info.offset.y > 150) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            style={{ opacity }}
            transition={getTransition('fast')}
          />

          {/* Modal con Swipe */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={handleDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ y }}
              className="pointer-events-auto w-full md:max-w-lg"
            >
              <div className={`
                ${darkMode ? 'bg-gray-900' : 'bg-white'}
                rounded-t-3xl md:rounded-3xl shadow-2xl
                max-h-[90vh] md:max-h-[85vh]
                flex flex-col
              `}>
                {/* Handle para indicar que se puede deslizar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className={`w-12 h-1.5 rounded-full ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-300'
                  }`} />
                </div>

                {/* Header */}
                {title && (
                  <div className="flex items-center justify-between px-6 pb-4">
                    <h3 className={`text-xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {title}
                    </h3>
                    <button
                      onClick={onClose}
                      className={`p-2 rounded-full transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-800 text-gray-400' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 smooth-scroll">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SwipeableModal;

