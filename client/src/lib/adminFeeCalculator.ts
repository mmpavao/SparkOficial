/**
 * Utilitários para cálculo de taxa administrativa em importações
 */

export interface AdminFeeCalculation {
  importValue: number;
  downPaymentPercentage: number;
  downPaymentAmount: number;
  financedAmount: number;
  adminFeePercentage: number;
  adminFeeAmount: number;
  totalWithFee: number;
}

/**
 * Calcula a taxa administrativa aplicada apenas no valor financiado
 * @param importValue Valor total da importação
 * @param downPaymentPercentage Percentual de entrada (ex: 30 para 30%)
 * @param adminFeePercentage Taxa administrativa em percentual (ex: 10 para 10%)
 * @returns Objeto com todos os valores calculados
 */
export function calculateAdminFee(
  importValue: number,
  downPaymentPercentage: number,
  adminFeePercentage: number
): AdminFeeCalculation {
  const downPaymentAmount = (importValue * downPaymentPercentage) / 100;
  const financedAmount = importValue - downPaymentAmount;
  const adminFeeAmount = (financedAmount * adminFeePercentage) / 100;
  const totalWithFee = importValue + adminFeeAmount;

  return {
    importValue,
    downPaymentPercentage,
    downPaymentAmount,
    financedAmount,
    adminFeePercentage,
    adminFeeAmount,
    totalWithFee
  };
}

/**
 * Obter taxa administrativa de uma aplicação de crédito
 * @param creditApplication Aplicação de crédito com dados de finalização admin
 * @returns Taxa administrativa em percentual (padrão 0 se não configurada)
 */
export function getAdminFeeFromCredit(creditApplication: any): number {
  if (!creditApplication) return 0;
  
  // Usar taxa final do admin se disponível, senão usar 0
  const adminFee = creditApplication.adminFee || "0";
  return parseFloat(adminFee);
}

/**
 * Obter percentual de entrada de uma aplicação de crédito
 * @param creditApplication Aplicação de crédito com dados de finalização admin
 * @returns Percentual de entrada (padrão 30 se não configurado)
 */
export function getDownPaymentFromCredit(creditApplication: any): number {
  if (!creditApplication) return 30;
  
  // Usar entrada final do admin se disponível, senão usar padrão
  const downPayment = creditApplication.finalDownPayment || "30";
  return parseFloat(downPayment);
}

/**
 * Formatar valor monetário com símbolo USD
 * @param value Valor numérico
 * @returns String formatada (ex: "US$ 10,000")
 */
export function formatUSD(value: number): string {
  return `US$ ${value.toLocaleString('en-US')}`;
}