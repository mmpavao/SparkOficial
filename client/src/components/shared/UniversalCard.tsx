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
      className={`border-l-4 ${status.borderColor} hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            {/* Icon with badge */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-spark-50 rounded-xl flex items-center justify-center">
                {icon}
              </div>

            </div>
            
            {/* Main info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 text-lg truncate">
                  {title}
                </h3>
                {companyBadge && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {companyBadge}
                  </Badge>
                )}
              </div>
              
              {subtitle && (
                <p className="text-sm text-gray-600 mb-2">{subtitle}</p>
              )}
              
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <Badge variant="outline" className={`${status.color} border text-xs`}>
                  {status.label}
                </Badge>
                
                {/* Credit Score Bar */}
                {creditScore !== undefined && creditScore > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Score:</span>
                    <div className="w-32">
                      <CreditScoreBar score={creditScore} height="h-1.5" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{creditScore}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Custom Actions */}
          {customActions && (
            <div className="ml-2">
              {customActions}
            </div>
          )}
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
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

        {/* Mini Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {miniCards.map((miniCard, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${miniCard.color || 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 flex items-center justify-center">
                  {miniCard.icon}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {miniCard.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
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