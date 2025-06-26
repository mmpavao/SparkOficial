import { motion } from "framer-motion";
import { Check, Clock, AlertCircle, FileText, DollarSign, Shield } from "lucide-react";

interface CreditStatusStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'current' | 'pending';
}

interface CreditStatusTrackerProps {
  currentStatus: string;
  preAnalysisStatus?: string | null;
  financialStatus?: string | null;
  adminStatus?: string | null;
}

const statusSteps: Record<string, CreditStatusStep[]> = {
  'pending': [
    {
      id: 'submitted',
      title: 'Solicitação Enviada',
      description: 'Sua aplicação foi recebida com sucesso',
      icon: FileText,
      status: 'completed'
    },
    {
      id: 'pre_analysis',
      title: 'Pré-análise',
      description: 'Nossa equipe está revisando seus documentos',
      icon: Clock,
      status: 'current'
    },
    {
      id: 'financial_review',
      title: 'Análise Financeira',
      description: 'Avaliação pela instituição financeira',
      icon: DollarSign,
      status: 'pending'
    },
    {
      id: 'final_approval',
      title: 'Aprovação Final',
      description: 'Finalização dos termos e condições',
      icon: Shield,
      status: 'pending'
    }
  ],
  'under_review': [
    {
      id: 'submitted',
      title: 'Solicitação Enviada',
      description: 'Sua aplicação foi recebida com sucesso',
      icon: FileText,
      status: 'completed'
    },
    {
      id: 'pre_analysis',
      title: 'Pré-análise',
      description: 'Documentos sendo analisados pela nossa equipe',
      icon: Clock,
      status: 'current'
    },
    {
      id: 'financial_review',
      title: 'Análise Financeira',
      description: 'Avaliação pela instituição financeira',
      icon: DollarSign,
      status: 'pending'
    },
    {
      id: 'final_approval',
      title: 'Aprovação Final',
      description: 'Finalização dos termos e condições',
      icon: Shield,
      status: 'pending'
    }
  ],
  'pre_approved': [
    {
      id: 'submitted',
      title: 'Solicitação Enviada',
      description: 'Sua aplicação foi recebida com sucesso',
      icon: FileText,
      status: 'completed'
    },
    {
      id: 'pre_analysis',
      title: 'Pré-análise Concluída',
      description: 'Documentos aprovados pela nossa equipe',
      icon: Check,
      status: 'completed'
    },
    {
      id: 'financial_review',
      title: 'Análise Financeira',
      description: 'Em avaliação pela instituição financeira',
      icon: Clock,
      status: 'current'
    },
    {
      id: 'final_approval',
      title: 'Aprovação Final',
      description: 'Finalização dos termos e condições',
      icon: Shield,
      status: 'pending'
    }
  ],
  'financially_approved': [
    {
      id: 'submitted',
      title: 'Solicitação Enviada',
      description: 'Sua aplicação foi recebida com sucesso',
      icon: FileText,
      status: 'completed'
    },
    {
      id: 'pre_analysis',
      title: 'Pré-análise Concluída',
      description: 'Documentos aprovados pela nossa equipe',
      icon: Check,
      status: 'completed'
    },
    {
      id: 'financial_review',
      title: 'Análise Financeira Aprovada',
      description: 'Crédito aprovado pela instituição financeira',
      icon: Check,
      status: 'completed'
    },
    {
      id: 'final_approval',
      title: 'Aprovação Final',
      description: 'Finalização dos termos e condições',
      icon: Clock,
      status: 'current'
    }
  ],
  'approved': [
    {
      id: 'submitted',
      title: 'Solicitação Enviada',
      description: 'Sua aplicação foi recebida com sucesso',
      icon: FileText,
      status: 'completed'
    },
    {
      id: 'pre_analysis',
      title: 'Pré-análise Concluída',
      description: 'Documentos aprovados pela nossa equipe',
      icon: Check,
      status: 'completed'
    },
    {
      id: 'financial_review',
      title: 'Análise Financeira Aprovada',
      description: 'Crédito aprovado pela instituição financeira',
      icon: Check,
      status: 'completed'
    },
    {
      id: 'final_approval',
      title: 'Crédito Aprovado',
      description: 'Processo finalizado - crédito disponível',
      icon: Check,
      status: 'completed'
    }
  ],
  'rejected': [
    {
      id: 'submitted',
      title: 'Solicitação Enviada',
      description: 'Sua aplicação foi recebida com sucesso',
      icon: FileText,
      status: 'completed'
    },
    {
      id: 'pre_analysis',
      title: 'Análise Concluída',
      description: 'Solicitação não aprovada',
      icon: AlertCircle,
      status: 'completed'
    },
    {
      id: 'financial_review',
      title: 'Análise Financeira',
      description: 'Etapa não alcançada',
      icon: DollarSign,
      status: 'pending'
    },
    {
      id: 'final_approval',
      title: 'Aprovação Final',
      description: 'Etapa não alcançada',
      icon: Shield,
      status: 'pending'
    }
  ]
};

const CreditStatusTracker: React.FC<CreditStatusTrackerProps> = ({
  currentStatus,
  preAnalysisStatus,
  financialStatus,
  adminStatus
}) => {
  // Determine the effective status based on all status fields
  const getEffectiveStatus = () => {
    if (adminStatus === 'finalized' || currentStatus === 'approved') return 'approved';
    if (financialStatus === 'approved') return 'financially_approved';
    if (preAnalysisStatus === 'pre_approved') return 'pre_approved';
    if (currentStatus === 'rejected') return 'rejected';
    if (currentStatus === 'under_review') return 'under_review';
    return 'pending';
  };

  const effectiveStatus = getEffectiveStatus();
  const steps = statusSteps[effectiveStatus] || statusSteps['pending'];

  const getStepColor = (step: CreditStatusStep) => {
    switch (step.status) {
      case 'completed':
        return effectiveStatus === 'rejected' && step.id === 'pre_analysis' 
          ? 'bg-red-500 text-white' 
          : 'bg-green-500 text-white';
      case 'current':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-gray-200 text-gray-500';
      default:
        return 'bg-gray-200 text-gray-500';
    }
  };

  const getConnectorColor = (index: number) => {
    const currentStep = steps[index];
    const nextStep = steps[index + 1];
    
    if (currentStep.status === 'completed') {
      return 'bg-green-500';
    }
    return 'bg-gray-200';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Status da Solicitação de Crédito
      </h3>
      
      <motion.div 
        className="relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <motion.div 
              key={step.id}
              variants={itemVariants}
              className="relative flex items-start mb-8 last:mb-0"
            >
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-6 top-12 w-0.5 h-16 z-0">
                  <motion.div 
                    className={`w-full h-full ${getConnectorColor(index)}`}
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  />
                </div>
              )}
              
              {/* Step Circle */}
              <motion.div 
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getStepColor(step)}`}
                animate={step.status === 'current' ? 'pulse' : ''}
                variants={pulseVariants}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              
              {/* Step Content */}
              <div className="ml-4 flex-1">
                <motion.h4 
                  className="text-sm font-medium text-gray-900"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.1 }}
                >
                  {step.title}
                </motion.h4>
                <motion.p 
                  className="text-sm text-gray-500 mt-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.2 }}
                >
                  {step.description}
                </motion.p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Progress Summary */}
      <motion.div 
        className="mt-6 p-4 bg-gray-50 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Progresso da Solicitação
          </span>
          <span className="text-sm font-medium text-gray-900">
            {Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <motion.div 
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
            transition={{ duration: 1, delay: 1 }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default CreditStatusTracker;