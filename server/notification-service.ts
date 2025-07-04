/**
 * SISTEMA COMPLETO DE NOTIFICAÇÕES AUTOMÁTICAS - SPARK COMEX
 * Gera notificações inteligentes baseadas em eventos do sistema
 */

import { storage } from "./storage";

export type NotificationType = 
  | 'credit_application_submitted'
  | 'credit_pre_approved'
  | 'credit_submitted_to_financial'
  | 'credit_approved'
  | 'credit_rejected'
  | 'credit_finalized'
  | 'import_created'
  | 'import_status_changed'
  | 'payment_due_reminder'
  | 'payment_overdue'
  | 'payment_completed'
  | 'document_uploaded'
  | 'document_missing'
  | 'supplier_added'
  | 'system_alert'
  | 'credit_limit_warning'
  | 'import_delivery_reminder';

export interface NotificationData {
  type: NotificationType;
  userId: number;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class NotificationService {
  /**
   * Cria uma nova notificação no sistema
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      await storage.createNotification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
        priority: data.priority,
        isRead: false
      });

      console.log(`🔔 Notificação criada: ${data.type} para usuário ${data.userId}`);
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }

  /**
   * EVENTOS DE CRÉDITO
   */
  
  // Quando importador submete solicitação de crédito
  async onCreditApplicationSubmitted(userId: number, applicationId: number, companyName: string): Promise<void> {
    await this.createNotification({
      type: 'credit_application_submitted',
      userId,
      title: 'Solicitação de Crédito Enviada',
      message: `Sua solicitação de crédito foi recebida e está em análise. Acompanhe o status na área de crédito.`,
      actionUrl: `/credit/${applicationId}`,
      priority: 'medium',
      metadata: { applicationId, companyName }
    });

    // Notificar administradores sobre nova solicitação
    const admins = await storage.getUsersByRole('admin');
    for (const admin of admins) {
      await this.createNotification({
        type: 'credit_application_submitted',
        userId: admin.id,
        title: 'Nova Solicitação de Crédito',
        message: `${companyName} enviou uma nova solicitação de crédito para análise.`,
        actionUrl: `/credit/${applicationId}`,
        priority: 'high',
        metadata: { applicationId, companyName, importerUserId: userId }
      });
    }
  }

  // Quando admin pré-aprova crédito
  async onCreditPreApproved(userId: number, applicationId: number, adminName: string): Promise<void> {
    await this.createNotification({
      type: 'credit_pre_approved',
      userId,
      title: 'Crédito Pré-Aprovado',
      message: `Sua solicitação de crédito foi pré-aprovada e enviada para análise financeira final.`,
      actionUrl: `/credit/${applicationId}`,
      priority: 'high',
      metadata: { applicationId, adminName }
    });

    // Notificar financeira sobre nova análise
    const financeiras = await storage.getUsersByRole('financeira');
    for (const financeira of financeiras) {
      await this.createNotification({
        type: 'credit_submitted_to_financial',
        userId: financeira.id,
        title: 'Nova Análise Financeira',
        message: `Solicitação de crédito pré-aprovada aguarda análise financeira final.`,
        actionUrl: `/credit/${applicationId}`,
        priority: 'high',
        metadata: { applicationId, adminName }
      });
    }
  }

  // Quando financeira aprova crédito
  async onCreditApproved(userId: number, applicationId: number, creditLimit: number): Promise<void> {
    await this.createNotification({
      type: 'credit_approved',
      userId,
      title: 'Crédito Aprovado',
      message: `Parabéns! Seu crédito foi aprovado. Aguarde a finalização dos termos pelo administrador.`,
      actionUrl: `/credit/${applicationId}`,
      priority: 'high',
      metadata: { applicationId, creditLimit }
    });

    // Notificar admins para finalização
    const admins = await storage.getUsersByRole('admin');
    for (const admin of admins) {
      await this.createNotification({
        type: 'credit_approved',
        userId: admin.id,
        title: 'Crédito Aprovado - Finalizar Termos',
        message: `Crédito aprovado pela financeira. Finalize os termos para liberar ao cliente.`,
        actionUrl: `/credit/${applicationId}`,
        priority: 'high',
        metadata: { applicationId, creditLimit }
      });
    }
  }

  // Quando financeira rejeita crédito
  async onCreditRejected(userId: number, applicationId: number, reason?: string): Promise<void> {
    await this.createNotification({
      type: 'credit_rejected',
      userId,
      title: 'Solicitação de Crédito Negada',
      message: `Infelizmente sua solicitação de crédito foi negada. ${reason ? `Motivo: ${reason}` : 'Entre em contato para mais informações.'}`,
      actionUrl: `/credit/${applicationId}`,
      priority: 'high',
      metadata: { applicationId, reason }
    });
  }

  // Quando admin finaliza termos do crédito
  async onCreditFinalized(userId: number, applicationId: number, finalCreditLimit: number): Promise<void> {
    await this.createNotification({
      type: 'credit_finalized',
      userId,
      title: 'Crédito Liberado!',
      message: `Seu crédito de US$ ${finalCreditLimit.toLocaleString()} está liberado e disponível para uso!`,
      actionUrl: `/credit/${applicationId}`,
      priority: 'urgent',
      metadata: { applicationId, finalCreditLimit }
    });
  }

  /**
   * EVENTOS DE IMPORTAÇÃO
   */

  // Quando nova importação é criada
  async onImportCreated(userId: number, importId: number, importName: string, totalValue: number): Promise<void> {
    await this.createNotification({
      type: 'import_created',
      userId,
      title: 'Nova Importação Criada',
      message: `Importação "${importName}" foi criada com sucesso. Valor: US$ ${totalValue.toLocaleString()}.`,
      actionUrl: `/imports/${importId}`,
      priority: 'medium',
      metadata: { importId, importName, totalValue }
    });
  }

  // Quando status da importação muda
  async onImportStatusChanged(userId: number, importId: number, importName: string, oldStatus: string, newStatus: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      'planejamento': 'em planejamento',
      'producao': 'em produção',
      'entregue_agente': 'entregue ao agente',
      'transporte_maritimo': 'em transporte marítimo',
      'transporte_aereo': 'em transporte aéreo',
      'desembaraco': 'em desembaraço',
      'transporte_nacional': 'em transporte nacional',
      'concluido': 'concluída'
    };

    const statusMessage = statusMessages[newStatus] || newStatus;
    
    await this.createNotification({
      type: 'import_status_changed',
      userId,
      title: 'Status da Importação Atualizado',
      message: `"${importName}" está agora ${statusMessage}.`,
      actionUrl: `/imports/${importId}`,
      priority: newStatus === 'concluido' ? 'high' : 'medium',
      metadata: { importId, importName, oldStatus, newStatus }
    });
  }

  /**
   * EVENTOS DE PAGAMENTO
   */

  // Lembrete de pagamento próximo ao vencimento (3 dias antes)
  async onPaymentDueReminder(userId: number, paymentId: number, amount: number, dueDate: string, importName: string): Promise<void> {
    await this.createNotification({
      type: 'payment_due_reminder',
      userId,
      title: 'Pagamento Próximo ao Vencimento',
      message: `Pagamento de US$ ${amount.toLocaleString()} da importação "${importName}" vence em 3 dias (${new Date(dueDate).toLocaleDateString('pt-BR')}).`,
      actionUrl: `/payments/${paymentId}`,
      priority: 'high',
      metadata: { paymentId, amount, dueDate, importName }
    });
  }

  // Pagamento em atraso
  async onPaymentOverdue(userId: number, paymentId: number, amount: number, dueDate: string, importName: string): Promise<void> {
    await this.createNotification({
      type: 'payment_overdue',
      userId,
      title: 'Pagamento em Atraso',
      message: `URGENTE: Pagamento de US$ ${amount.toLocaleString()} da importação "${importName}" está em atraso desde ${new Date(dueDate).toLocaleDateString('pt-BR')}.`,
      actionUrl: `/payments/${paymentId}`,
      priority: 'urgent',
      metadata: { paymentId, amount, dueDate, importName }
    });
  }

  // Pagamento realizado
  async onPaymentCompleted(userId: number, paymentId: number, amount: number, importName: string): Promise<void> {
    await this.createNotification({
      type: 'payment_completed',
      userId,
      title: 'Pagamento Confirmado',
      message: `Pagamento de US$ ${amount.toLocaleString()} da importação "${importName}" foi confirmado com sucesso.`,
      actionUrl: `/payments/${paymentId}`,
      priority: 'medium',
      metadata: { paymentId, amount, importName }
    });
  }

  /**
   * EVENTOS DE DOCUMENTOS
   */

  // Documento carregado
  async onDocumentUploaded(userId: number, documentType: string, applicationId?: number, importId?: number): Promise<void> {
    const entityUrl = applicationId ? `/credit/${applicationId}` : `/imports/${importId}`;
    
    await this.createNotification({
      type: 'document_uploaded',
      userId,
      title: 'Documento Enviado',
      message: `Documento "${documentType}" foi enviado com sucesso.`,
      actionUrl: entityUrl,
      priority: 'low',
      metadata: { documentType, applicationId, importId }
    });
  }

  // Documento pendente/faltando
  async onDocumentMissing(userId: number, documentType: string, applicationId?: number, importId?: number): Promise<void> {
    const entityUrl = applicationId ? `/credit/${applicationId}` : `/imports/${importId}`;
    
    await this.createNotification({
      type: 'document_missing',
      userId,
      title: 'Documento Pendente',
      message: `O documento "${documentType}" ainda não foi enviado. Complete o envio para agilizar o processo.`,
      actionUrl: entityUrl,
      priority: 'medium',
      metadata: { documentType, applicationId, importId }
    });
  }

  /**
   * EVENTOS DE FORNECEDORES
   */

  // Novo fornecedor adicionado
  async onSupplierAdded(userId: number, supplierId: number, supplierName: string): Promise<void> {
    await this.createNotification({
      type: 'supplier_added',
      userId,
      title: 'Novo Fornecedor Cadastrado',
      message: `Fornecedor "${supplierName}" foi cadastrado com sucesso.`,
      actionUrl: `/suppliers/${supplierId}`,
      priority: 'low',
      metadata: { supplierId, supplierName }
    });
  }

  /**
   * ALERTAS DO SISTEMA
   */

  // Alerta de limite de crédito
  async onCreditLimitWarning(userId: number, usedPercentage: number, remainingCredit: number): Promise<void> {
    await this.createNotification({
      type: 'credit_limit_warning',
      userId,
      title: 'Limite de Crédito em Alerta',
      message: `Você utilizou ${usedPercentage}% do seu crédito. Restam US$ ${remainingCredit.toLocaleString()} disponíveis.`,
      actionUrl: '/credit',
      priority: usedPercentage >= 90 ? 'urgent' : 'high',
      metadata: { usedPercentage, remainingCredit }
    });
  }

  // Lembrete de entrega da importação
  async onImportDeliveryReminder(userId: number, importId: number, importName: string, estimatedDelivery: string): Promise<void> {
    await this.createNotification({
      type: 'import_delivery_reminder',
      userId,
      title: 'Importação Próxima da Entrega',
      message: `"${importName}" tem entrega prevista para ${new Date(estimatedDelivery).toLocaleDateString('pt-BR')}.`,
      actionUrl: `/imports/${importId}`,
      priority: 'medium',
      metadata: { importId, importName, estimatedDelivery }
    });
  }

  /**
   * VERIFICAÇÕES AUTOMÁTICAS PERIÓDICAS
   */

  // Verifica pagamentos próximos ao vencimento (executar diariamente)
  async checkUpcomingPayments(): Promise<void> {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const upcomingPayments = await storage.getPaymentsDueBefore(threeDaysFromNow);
      
      for (const payment of upcomingPayments) {
        // Verificar se já foi enviada notificação para este pagamento
        const existingNotification = await storage.getNotificationByPaymentReminder(payment.id);
        if (!existingNotification) {
          const importData = await storage.getImportById(payment.importId);
          if (importData) {
            await this.onPaymentDueReminder(
              importData.userId,
              payment.id,
              parseFloat(payment.amount),
              payment.dueDate.toISOString(),
              importData.importName || `Importação #${importData.id}`
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pagamentos próximos:', error);
    }
  }

  // Verifica pagamentos em atraso (executar diariamente)
  async checkOverduePayments(): Promise<void> {
    try {
      const today = new Date();
      const overduePayments = await storage.getOverduePayments(today);
      
      for (const payment of overduePayments) {
        const importData = await storage.getImportById(payment.importId);
        if (importData) {
          await this.onPaymentOverdue(
            importData.userId,
            payment.id,
            parseFloat(payment.amount),
            payment.dueDate.toISOString(),
            importData.importName || `Importação #${importData.id}`
          );
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pagamentos em atraso:', error);
    }
  }

  // Verifica limites de crédito próximos do limite (executar semanalmente)
  async checkCreditLimits(): Promise<void> {
    try {
      const users = await storage.getAllActiveUsers();
      
      for (const user of users) {
        if (user.role === 'importer') {
          const creditInfo = await storage.getCreditInfoByUser(user.id);
          if (creditInfo && creditInfo.totalCredit > 0) {
            const usedPercentage = (creditInfo.usedCredit / creditInfo.totalCredit) * 100;
            
            // Alertar se usar mais de 80% do crédito
            if (usedPercentage >= 80) {
              await this.onCreditLimitWarning(
                user.id,
                Math.round(usedPercentage),
                creditInfo.totalCredit - creditInfo.usedCredit
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar limites de crédito:', error);
    }
  }
}

export const notificationService = new NotificationService();