import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHaptics } from '../../hooks/useHaptics';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  /** Duración del long-press en ms */
  longPressDuration?: number;
  /** Modo oscuro */
  darkMode?: boolean;
  /** Deshabilitar el menú */
  disabled?: boolean;
}

/**
 * iOS-style Context Menu
 * Long-press para mostrar opciones con efecto de blur
 * 
 * @example
 * <ContextMenu
 *   items={[
 *     { label: 'Editar', icon: <Edit />, onClick: handleEdit },
 *     { label: 'Eliminar', icon: <Trash />, onClick: handleDelete, destructive: true },
 *   ]}
 * >
 *   <ExpenseCard expense={expense} />
 * </ContextMenu>
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  longPressDuration = 500,
  darkMode = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mediumImpact, lightImpact } = useHaptics();

  const openMenu = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    
    mediumImpact();
    
    // Calcular posición del menú
    const menuWidth = 200;
    const menuHeight = items.length * 44 + 16;
    const padding = 16;
    
    let x = clientX;
    let y = clientY;
    
    // Ajustar si se sale de la pantalla
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    
    setMenuPosition({ x, y });
    setIsOpen(true);
  }, [disabled, items.length, mediumImpact]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setIsPressed(false);
  }, []);

  const handleItemClick = useCallback((item: ContextMenuItem) => {
    if (item.disabled) return;
    lightImpact();
    closeMenu();
    item.onClick();
  }, [closeMenu, lightImpact]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(true);
    const touch = e.touches[0];
    
    longPressTimer.current = setTimeout(() => {
      openMenu(touch.clientX, touch.clientY);
    }, longPressDuration);
  }, [disabled, longPressDuration, openMenu]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancelar si se mueve el dedo
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Backdrop click handler
  useEffect(() => {
    if (!isOpen) return;
    
    const handleBackdropClick = () => closeMenu();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    
    document.addEventListener('click', handleBackdropClick);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleBackdropClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeMenu]);

  const menuContent = isOpen && createPortal(
    <>
      {/* Backdrop con blur */}
      <div 
        className="fixed inset-0 z-[9998]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
        onClick={closeMenu}
      />
      
      {/* Menu */}
      <div
        className={`fixed z-[9999] rounded-xl overflow-hidden shadow-2xl ${
          darkMode ? 'bg-gray-800/95' : 'bg-white/95'
        }`}
        style={{
          left: menuPosition.x,
          top: menuPosition.y,
          minWidth: 200,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          animation: 'contextMenuIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
              item.disabled
                ? 'opacity-40 cursor-not-allowed'
                : item.destructive
                  ? 'text-red-500 active:bg-red-500/10'
                  : darkMode
                    ? 'text-white active:bg-white/10'
                    : 'text-gray-900 active:bg-gray-100'
            } ${index !== items.length - 1 ? (darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : ''}`}
          >
            {item.icon && (
              <span className="w-5 h-5 flex-shrink-0">
                {item.icon}
              </span>
            )}
            <span className="text-base font-medium">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      
      <style>{`
        @keyframes contextMenuIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>,
    document.body
  );

  return (
    <>
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY);
        }}
        className="pressable"
        style={{
          transform: isPressed ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
      {menuContent}
    </>
  );
};

export default ContextMenu;
