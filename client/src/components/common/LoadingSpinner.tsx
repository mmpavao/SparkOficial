import { useTranslation } from '@/contexts/I18nContext';
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Carregando...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-4 border-spark-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label={t.common.carregando}
      />
      {text && (
        <p className="text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
}