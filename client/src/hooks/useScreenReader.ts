import { useRef, useCallback } from 'react';

interface ScreenReaderOptions {
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export const useScreenReader = () => {
  const ariaLiveRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, options: ScreenReaderOptions = {}) => {
    const { priority = 'polite', delay = 100 } = options;
    
    // Create or update aria-live region
    let liveRegion = document.getElementById('screen-reader-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'screen-reader-announcements';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    } else {
      liveRegion.setAttribute('aria-live', priority);
    }

    // Clear and set new message with slight delay to ensure screen reader picks it up
    liveRegion.textContent = '';
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = message;
      }
    }, delay);
  }, []);

  const announceNavigation = useCallback((pageName: string) => {
    announce(`Navegando para ${pageName}`, { priority: 'assertive' });
  }, [announce]);

  const announceAction = useCallback((action: string) => {
    announce(`Ação: ${action}`, { priority: 'polite' });
  }, [announce]);

  const announceStatusChange = useCallback((item: string, newStatus: string) => {
    announce(`${item} mudou para ${newStatus}`, { priority: 'assertive' });
  }, [announce]);

  const announceDataLoaded = useCallback((dataType: string, count?: number) => {
    const message = count !== undefined 
      ? `${dataType} carregado. ${count} itens encontrados.`
      : `${dataType} carregado com sucesso.`;
    announce(message, { priority: 'polite' });
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Erro: ${error}`, { priority: 'assertive' });
  }, [announce]);

  return {
    announce,
    announceNavigation,
    announceAction,
    announceStatusChange,
    announceDataLoaded,
    announceError,
    ariaLiveRef
  };
};