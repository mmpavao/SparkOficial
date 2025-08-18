import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useTranslation } from 'react-i18next';

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  userId: number;
  assignedTo?: number;
  messages?: SupportMessage[];
}

interface SupportMessage {
  id: number;
  ticketId: number;
  message: string;
  isFromAdmin: boolean;
  createdAt: string;
  userId: number;
}

export default function SupportPage() {
  const { t } = useTranslation();
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as const
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's support tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/support/tickets'],
    queryFn: () => apiRequest('/api/support/tickets', 'GET'),
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; priority: string }) => {
      // Transform frontend data to match backend expectations
      const payload = {
        subject: data.title,
        message: data.description,
        priority: data.priority,
        category: 'general_inquiry' // Default category
      };
      return await apiRequest('/api/support/tickets', 'POST', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      setIsCreatingTicket(false);
      setNewTicket({ title: '', description: '', priority: 'medium' });
      toast({
        title: t("common.success"),
        description: t("support.ticketCreatedSuccess"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("support.ticketCreationError"),
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: t("common.error"),
        description: t("validation.fillRequiredFields"),
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(newTicket);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: "secondary", icon: Clock, label: t("status.open") },
      in_progress: { variant: "default", icon: ArrowRight, label: t("status.inProgress") },
      resolved: { variant: "success", icon: CheckCircle, label: t("status.resolved") },
      closed: { variant: "outline", icon: CheckCircle, label: t("status.closed") }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: "secondary", label: t("priority.low") },
      medium: { variant: "default", label: t("priority.medium") },
      high: { variant: "destructive", label: t("priority.high") }
    } as const;

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("support.title")}
          </h1>
          <p className="text-gray-600">{t("support.subtitle")}</p>
        </div>
        <Button 
          onClick={() => setIsCreatingTicket(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("support.newTicket")}
        </Button>
      </div>

      {/* Create Ticket Form */}
      {isCreatingTicket && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t("support.createNewTicket")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">{t("support.ticketTitle")}</Label>
              <Input
                id="title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder={t("placeholders.describeProblemBriefly")}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="priority">{t("common.priority")}</Label>
              <Select 
                value={newTicket.priority} 
                onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as any })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priority.low")}</SelectItem>
                  <SelectItem value="medium">{t("priority.medium")}</SelectItem>
                  <SelectItem value="high">{t("priority.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">{t("support.detailedDescription")}</Label>
              <Textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder={t("placeholders.describeDetailedProblem")}
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTicket}
                disabled={createTicketMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {t("support.createTicket")}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreatingTicket(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("support.myTickets")}</h2>
        
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("support.noTicketsFound")}</h3>
              <p className="text-gray-500 mb-4">{t("support.noTicketsCreated")}</p>
              <Button onClick={() => setIsCreatingTicket(true)}>
                {t("support.createFirstTicket")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket: SupportTicket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">#{ticket.id} - {ticket.title}</h3>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{t("common.created")}: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span>{t("common.updated")}: {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/support/ticket/${ticket.id}`)}
                    >
                      {t("common.viewDetails")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}