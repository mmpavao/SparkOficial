import { useEffect, useRef, useCallback } from 'react';
import { useScreenReader } from './useScreenReader';

interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean;
  enableTabTrapping?: boolean;
  enableEscapeKey?: boolean;
  onEscape?: () => void;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const { 
    enableArrowKeys = true, 
    enableTabTrapping = false, 
    enableEscapeKey = true,
    onEscape 
  } = options;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { announce } = useScreenReader();

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]'
    ].join(', ');
    
    return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    switch (event.key) {
      case 'ArrowDown':
        if (enableArrowKeys && focusableElements.length > 0) {
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex]?.focus();
          announce(`Item ${nextIndex + 1} de ${focusableElements.length} focado`);
        }
        break;
        
      case 'ArrowUp':
        if (enableArrowKeys && focusableElements.length > 0) {
          event.preventDefault();
          const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
          focusableElements[prevIndex]?.focus();
          announce(`Item ${prevIndex + 1} de ${focusableElements.length} focado`);
        }
        break;
        
      case 'Home':
        if (enableArrowKeys && focusableElements.length > 0) {
          event.preventDefault();
          focusableElements[0]?.focus();
          announce('Primeiro item focado');
        }
        break;
        
      case 'End':
        if (enableArrowKeys && focusableElements.length > 0) {
          event.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
          announce('Último item focado');
        }
        break;
        
      case 'Escape':
        if (enableEscapeKey) {
          event.preventDefault();
          onEscape?.();
          announce('Menu fechado');
        }
        break;
        
      case 'Tab':
        if (enableTabTrapping && focusableElements.length > 0) {
          if (event.shiftKey) {
            if (currentIndex <= 0) {
              event.preventDefault();
              focusableElements[focusableElements.length - 1]?.focus();
            }
          } else {
            if (currentIndex >= focusableElements.length - 1) {
              event.preventDefault();
              focusableElements[0]?.focus();
            }
          }
        }
        break;
    }
  }, [enableArrowKeys, enableTabTrapping, enableEscapeKey, onEscape, getFocusableElements, announce]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      announce('Navegação por teclado ativada');
    }
  }, [getFocusableElements, announce]);

  const announceFocusedElement = useCallback((element: HTMLElement) => {
    const elementText = element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || 'Elemento';
    const elementType = element.tagName.toLowerCase();
    const roleType = element.getAttribute('role') || elementType;
    
    announce(`${elementText}, ${roleType}`, { priority: 'polite' });
  }, [announce]);

  return {
    containerRef,
    focusFirstElement,
    announceFocusedElement,
    getFocusableElements
  };
};