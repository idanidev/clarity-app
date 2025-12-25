import React, { useState, useRef, useCallback, useEffect } from 'react';

interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  /** Ref del contenedor scrollable para detectar scroll */
  scrollContainerRef?: React.RefObject<HTMLElement>;
  /** Callback cuando cambia el estado collapsed */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Modo oscuro */
  darkMode?: boolean;
  /** Contenido derecho (botones, etc) */
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * iOS Large Title Header
 * El título grande se encoge al hacer scroll, como en la app de Ajustes de iOS
 */
export const LargeTitleHeader: React.FC<LargeTitleHeaderProps> = ({
  title,
  subtitle,
  scrollContainerRef,
  onCollapsedChange,
  darkMode = false,
  rightContent,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  const COLLAPSE_THRESHOLD = 60;

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const scrollY = container.scrollTop;
    const progress = Math.min(scrollY / COLLAPSE_THRESHOLD, 1);
    
    setScrollProgress(progress);
    
    const shouldCollapse = scrollY > COLLAPSE_THRESHOLD;
    if (shouldCollapse !== isCollapsed) {
      setIsCollapsed(shouldCollapse);
      onCollapsedChange?.(shouldCollapse);
    }
  }, [scrollContainerRef, isCollapsed, onCollapsedChange]);

  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef, handleScroll]);

  // Interpolación de tamaño de fuente
  const titleFontSize = 34 - (scrollProgress * 17); // 34px -> 17px
  const titleOpacity = 1 - (scrollProgress * 0.3);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 ${
        darkMode ? 'bg-gray-900/95' : 'bg-white/95'
      }`}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Header colapsado (siempre visible pero con opacity) */}
      <div 
        className={`flex items-center justify-between px-4 h-11 border-b transition-opacity ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}
        style={{ opacity: scrollProgress }}
      >
        <h1 className={`text-base font-semibold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h1>
        {rightContent}
      </div>

      {/* Título grande */}
      <div 
        className="px-4 pt-2 pb-3 transition-all"
        style={{
          transform: `translateY(${-scrollProgress * 20}px)`,
          opacity: 1 - scrollProgress,
          height: isCollapsed ? 0 : 'auto',
          overflow: 'hidden',
        }}
      >
        <h1 
          className={`font-bold tracking-tight ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            fontSize: `${titleFontSize}px`,
            opacity: titleOpacity,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-1 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Contenido adicional (filtros, etc) */}
      {children && (
        <div className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          {children}
        </div>
      )}
    </header>
  );
};

export default LargeTitleHeader;
