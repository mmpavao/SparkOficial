import { useRef } from 'react';

export const SkipToMain = () => {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  const handleSkipToMain = (e: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      ref={skipLinkRef}
      href="#main-content"
      onClick={handleSkipToMain}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSkipToMain(e);
        }
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      tabIndex={0}
    >
      Pular para conteúdo principal
    </a>
  );
};

export default SkipToMain;