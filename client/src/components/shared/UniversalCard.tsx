import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ReactNode } from "react";
import { CreditScoreBar } from "@/components/credit/CreditScoreBar";

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
  return (
    <Card 
      className={`border-l-4 ${status.borderColor} hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} mobile-card-container ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4 lg:p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 space-y-3 lg:space-y-0">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Icon with badge */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-spark-50 rounded-xl flex items-center justify-center">
                {icon}
              </div>
            </div>
            
            {/* Main info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 text-base lg:text-lg mobile-text-break lg:truncate">
                  {title}
                </h3>
                {companyBadge && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1 lg:mt-0 self-start">
                    {companyBadge}
                  </Badge>
                )}
              </div>
              
              {subtitle && (
                <p className="text-sm text-gray-600 mb-2 mobile-text-break">{subtitle}</p>
              )}
              
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
                {/* Status Badge */}
                <Badge variant="outline" className={`${status.color} border text-xs self-start`}>
                  {status.label}
                </Badge>
                
                {/* Credit Score Bar */}
                {creditScore && creditScore > 0 && (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded self-start">
                    <span className="text-xs text-gray-600 font-medium">Credit Score:</span>
                    <div className="w-16 lg:w-24">
                      <CreditScoreBar score={creditScore} height="h-2" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">{creditScore}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Section */}
          <div className="flex items-center gap-2 self-end lg:self-start">
            {/* Custom Actions */}
            {customActions && (
              <div>
                {customActions}
              </div>
            )}
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 lg:h-9 lg:w-auto lg:px-3">
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

        {/* Mini Cards Grid */}
        <div className="mobile-responsive-grid mb-4">
          {miniCards.map((miniCard, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border mobile-card-content ${miniCard.color || 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center flex-shrink-0">
                  {miniCard.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 mobile-text-break">
                  {miniCard.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mobile-text-break">
                {miniCard.value}
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