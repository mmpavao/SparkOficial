import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const permissions = useUserPermissions();

  // Redirect if not admin
  if (!permissions.isAdmin && !permissions.isFinanceira && !permissions.isSuperAdmin) {
    window.location.href = "/";
    return null;
  }

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/support/tickets', statusFilter, priorityFilter],
    queryFn: () => apiRequest('/api/support/tickets', 'GET'),
  });

  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">
          <Clock className="w-3 h-3 mr-1" />
          Aberto
        </Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Em Andamento
        </Badge>;
      case 'waiting_response':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">
          <MessageSquare className="w-3 h-3 mr-1" />
          Aguardando Resposta
        </Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolvido
        </Badge>;
      case 'closed':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Fechado
        </Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-gray-100 text-gray-700">Baixa</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-700">Média</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">Alta</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700">Urgente</Badge>;
      default:
        return null;
    }
  };

  const openTickets = tickets.filter((t: any) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t: any) => t.status === 'in_progress').length;
  const waitingResponseTickets = tickets.filter((t: any) => t.status === 'waiting_response').length;
  const resolvedTickets = tickets.filter((t: any) => t.status === 'resolved').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Central de Suporte</h1>
        <p className="text-gray-600 mt-2">Gerencie todos os tickets de suporte dos importadores</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abertos</p>
                <p className="text-2xl font-bold text-blue-600">{openTickets}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-600">{inProgressTickets}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aguardando</p>
                <p className="text-2xl font-bold text-orange-600">{waitingResponseTickets}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolvidos</p>
                <p className="text-2xl font-bold text-green-600">{resolvedTickets}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por assunto ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="waiting_response">Aguardando Resposta</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Suporte</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Carregando tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum ticket encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket: any) => (
                <Link key={ticket.id} href={`/support/ticket/${ticket.id}`}>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{ticket.subject}</h3>
                          <span className="text-sm text-gray-500">#{ticket.ticketNumber}</span>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{ticket.createdByName || 'Importador'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                          </div>
                          {ticket.category && (
                            <Badge variant="outline">{ticket.category}</Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}