import { useTranslation } from "react-i18next";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const displayText = text || t('common.loading');

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-4 border-spark-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label={t('common.loading')}
      />
      {displayText && (
        <p className="text-gray-600 text-sm">{displayText}</p>
      )}
    </div>
  );
}