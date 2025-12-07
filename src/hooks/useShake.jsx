import { useState, useCallback } from 'react';

export const useShake = () => {
  const [isShaking, setIsShaking] = useState(false);

  const shake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  return { isShaking, shake };
};

// Componente wrapper con shake
export const ShakeWrapper = ({ children, isShaking, className = '' }) => {
  return (
    <div className={`${isShaking ? 'shake' : ''} ${className}`}>
      {children}
    </div>
  );
};

