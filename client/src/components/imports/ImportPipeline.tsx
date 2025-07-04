import { 
  Factory, 
  Ship, 
  Plane, 
  Package, 
  FileCheck, 
  Truck, 
  CheckCircle 
} from "lucide-react";
import { IMPORT_STATUS } from "@/utils/importStatus";
import { motion } from "framer-motion";

interface ImportPipelineProps {
  currentStatus: string;
  cargoType?: string; // "FCL" ou "LCL" para determinar se é marítimo ou aéreo
}

const PIPELINE_STEPS = [
  {
    status: IMPORT_STATUS.PLANEJAMENTO,
    label: "Planejamento",
    icon: Package,
    color: "bg-blue-500"
  },
  {
    status: IMPORT_STATUS.PRODUCAO,
    label: "Produção",
    icon: Factory,
    color: "bg-orange-500"
  },
  {
    status: IMPORT_STATUS.ENTREGUE_AGENTE,
    label: "Entregue ao Agente",
    icon: FileCheck,
    color: "bg-purple-500"
  },
  {
    status: IMPORT_STATUS.TRANSPORTE_MARITIMO,
    label: "Transporte Marítimo",
    icon: Ship,
    color: "bg-cyan-500"
  },
  {
    status: IMPORT_STATUS.TRANSPORTE_AEREO,
    label: "Transporte Aéreo",
    icon: Plane,
    color: "bg-sky-500"
  },
  {
    status: IMPORT_STATUS.DESEMBARACO,
    label: "Desembaraço",
    icon: FileCheck,
    color: "bg-yellow-500"
  },
  {
    status: IMPORT_STATUS.TRANSPORTE_NACIONAL,
    label: "Transporte Nacional",
    icon: Truck,
    color: "bg-indigo-500"
  },
  {
    status: IMPORT_STATUS.CONCLUIDO,
    label: "Concluído",
    icon: CheckCircle,
    color: "bg-green-500"
  }
];

export function ImportPipeline({ currentStatus, cargoType }: ImportPipelineProps) {
  // Filtrar etapas baseado no tipo de transporte
  const getRelevantSteps = () => {
    let steps = PIPELINE_STEPS.filter(step => {
      // Sempre incluir etapas básicas
      if ([
        IMPORT_STATUS.PLANEJAMENTO,
        IMPORT_STATUS.PRODUCAO,
        IMPORT_STATUS.ENTREGUE_AGENTE,
        IMPORT_STATUS.DESEMBARACO,
        IMPORT_STATUS.TRANSPORTE_NACIONAL,
        IMPORT_STATUS.CONCLUIDO
      ].includes(step.status)) {
        return true;
      }
      
      // Incluir transporte específico baseado no tipo de carga
      if (cargoType === "FCL" && step.status === IMPORT_STATUS.TRANSPORTE_MARITIMO) {
        return true;
      }
      if (cargoType === "LCL" && step.status === IMPORT_STATUS.TRANSPORTE_AEREO) {
        return true;
      }
      
      return false;
    });
    
    return steps;
  };

  const relevantSteps = getRelevantSteps();
  const currentStepIndex = relevantSteps.findIndex(step => step.status === currentStatus);
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / relevantSteps.length) * 100 : 0;

  return (
    <div className="w-full p-4 bg-white rounded-lg border">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Pipeline de Importação</h3>
        
        {/* Barra de progresso */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
        
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500">
            {Math.round(progressPercentage)}% completo
          </span>
        </div>
      </div>

      {/* Etapas do pipeline */}
      <div className="flex justify-between items-center relative">
        {relevantSteps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const IconComponent = step.icon;

          return (
            <motion.div
              key={step.status}
              className="flex flex-col items-center relative z-10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Ícone da etapa */}
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isCompleted ? step.color : 'bg-gray-300'}
                  ${isCurrent ? 'ring-4 ring-offset-2 ring-blue-200' : ''}
                  transition-all duration-300
                `}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              >
                <IconComponent 
                  className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-500'}`}
                />
              </motion.div>

              {/* Label da etapa */}
              <span className={`
                text-xs mt-2 text-center max-w-16
                ${isCurrent ? 'font-semibold text-gray-900' : 'text-gray-600'}
              `}>
                {step.label}
              </span>

              {/* Indicador de status atual */}
              {isCurrent && (
                <motion.div
                  className="absolute -bottom-1 w-2 h-2 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Linha conectora */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-300 -z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            initial={{ width: "0%" }}
            animate={{ 
              width: currentStepIndex > 0 ? `${(currentStepIndex / (relevantSteps.length - 1)) * 100}%` : "0%" 
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}