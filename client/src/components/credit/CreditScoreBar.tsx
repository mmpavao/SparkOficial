import React from 'react';

interface CreditScoreBarProps {
  score: number;
  maxScore?: number;
  height?: string;
  showLabel?: boolean;
}

export function CreditScoreBar({ score, maxScore = 1000, height = "h-2", showLabel = false }: CreditScoreBarProps) {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  
  // Determine color based on score
  const getColorClass = () => {
    if (score >= 800) return "bg-green-500";
    if (score >= 600) return "bg-yellow-500";
    if (score >= 400) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
          Score: {score}
        </span>
      )}
      <div className="flex-1">
        <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
          <div 
            className={`${height} ${getColorClass()} rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}