import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ReactNode } from "react";
import { CreditScoreBar } from "@/components/credit/CreditScoreBar";
import { useIsMobile } from "@/hooks/useIsMobile";
import { truncateText, formatTextForMobile } from "@/lib/textUtils";

interface MiniCard {
  icon: ReactNode;
  label: string;
  value: string;
  color?: string;
}

interface ActionItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  show?: boolean;
}

interface UniversalCardProps {
  // Header section
  icon: ReactNode;
  title: string;
  subtitle?: string;
  applicationNumber?: string;
  companyBadge?: string;
  
  // Status section
  status: {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  };
  
  // Main content - mini cards organizados em grid
  miniCards: MiniCard[];
  
  // Actions dropdown
  actions: ActionItem[];
  
  // Custom actions (additional buttons)
  customActions?: ReactNode;
  
  // Footer section (optional)
  footer?: ReactNode;
  
  // Credit score (optional)
  creditScore?: number;
  
  // Card behavior
  onClick?: () => void;
  className?: string;
}

export function UniversalCard({
  icon,
  title,
  subtitle,
  applicationNumber,
  companyBadge,
  status,
  miniCards,
  actions,
  customActions,
  footer,
  creditScore,
  onClick,
  className = ""
}: UniversalCardProps) {
  const isMobile = useIsMobile();
  return (
    <Card 
      className={`border-l-4 ${status.borderColor} hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 space-y-3 md:space-y-0">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Icon with badge */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-spark-50 rounded-xl flex items-center justify-center">
                {icon}
              </div>
            </div>
            
            {/* Main info */}
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate" title={title}>
                  {formatTextForMobile(title, isMobile)}
                </h3>
                {companyBadge && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">
                    {truncateText(companyBadge, isMobile ? 15 : 30)}
                  </Badge>
                )}
              </div>
              
              {subtitle && (
                <p className="text-sm text-gray-600 mb-2" title={subtitle}>
                  {formatTextForMobile(subtitle, isMobile)}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                {/* Status Badge */}
                <Badge variant="outline" className={`${status.color} border text-xs w-fit`}>
                  {status.label}
                </Badge>
                
                {/* Credit Score Bar - Mobile optimized */}
                {creditScore && creditScore > 0 && (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded text-xs">
                    <span className="text-gray-600 font-medium shrink-0">Credit Score:</span>
                    <div className="w-16 sm:w-24 flex-1">
                      <CreditScoreBar score={creditScore} height="h-2" />
                    </div>
                    <span className="font-bold text-gray-800 shrink-0">{creditScore}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Section - Mobile optimized */}
          <div className="flex items-center gap-2 justify-end md:ml-2">
            {/* Custom Actions */}
            {customActions && (
              <div className="shrink-0">
                {customActions}
              </div>
            )}
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.filter(action => action.show !== false).map((action, index) => (
                  <DropdownMenuItem 
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mini Cards Grid - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {miniCards.map((miniCard, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${miniCard.color || 'bg-gray-50 border-gray-200'} min-w-0`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shrink-0">
                  {miniCard.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 truncate" title={miniCard.label}>
                  {formatTextForMobile(miniCard.label, isMobile)}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate" title={miniCard.value}>
                {formatTextForMobile(miniCard.value, isMobile)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        {footer && (
          <div className="pt-3 border-t border-gray-100">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}