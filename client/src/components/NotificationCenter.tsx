
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function NotificationItem({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: number) => void;
}) {
  const isUnread = notification.status === "unread";
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "normal": return "bg-blue-500";
      case "low": return "bg-gray-500";
      default: return "bg-blue-500";
    }
  };

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <DropdownMenuItem 
      className={`flex flex-col items-start p-4 cursor-pointer ${
        isUnread ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
            <h4 className={`text-sm font-medium truncate ${
              isUnread ? "font-semibold" : ""
            }`}>
              {notification.title}
            </h4>
            {isUnread && (
              <Badge variant="secondary" className="text-xs">
                Nova
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
        {isUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </DropdownMenuItem>
  );
}

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications(20);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isMarkingAllAsRead}
              className="h-6 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhuma notificação encontrada
            </div>
          ) : (
            Array.isArray(notifications) ? notifications.map((notification: Notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            )) : null
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
