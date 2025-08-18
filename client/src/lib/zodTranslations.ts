import { z } from 'zod';

export type TranslationFunction = (key: string, options?: any) => string;

export const createTranslatedSchemas = (t: TranslationFunction) => {
  const companyInfoSchema = z.object({
    legalCompanyName: z.string().min(2, t('validation.businessNameRequired')),
    tradingName: z.string().optional(),
    cnpj: z.string().min(14, t('validation.cnpjInvalid')),
    stateRegistration: z.string().optional(),
    municipalRegistration: z.string().optional(),
    address: z.string().min(5, t('validation.addressRequired')),
    city: z.string().min(2, t('validation.cityRequired')),
    state: z.string().min(2, t('validation.stateRequired')),
    zipCode: z.string().min(8, t('validation.zipCodeInvalid')),
    phone: z.string().min(10, t('validation.phoneRequired')),
    email: z.string().email(t('validation.emailInvalid')),
    website: z.string().optional().refine((val) => {
      if (!val) return true;
      try {
        if (val.startsWith('http://') || val.startsWith('https://')) {
          new URL(val);
          return true;
        }
        return /^(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(val);
      } catch {
        return false;
      }
    }, t('validation.websiteInvalid')),
    shareholders: z.array(z.object({
      name: z.string().min(2, t('validation.shareholderNameRequired')),
      cpf: z.string().min(11, t('validation.cpfInvalid')),
      percentage: z.number().min(0).max(100, t('validation.percentageRange')),
    })).min(1, t('validation.shareholderRequired')),
  });

  const commercialInfoSchema = z.object({
    businessSector: z.string().min(1, t('validation.businessSectorRequired')),
    annualRevenue: z.string().min(1, t('validation.annualRevenueRequired')),
    mainImportedProducts: z.string().min(10, t('validation.importedProductsRequired')),
    mainOriginMarkets: z.string().min(5, t('validation.originMarketsRequired')),
  });

  const creditInfoSchema = z.object({
    requestedAmount: z.string()
      .transform((val) => parseFloat(val.replace(/[,$]/g, '')))
      .refine((val) => val >= 100000, { message: t('validation.minAmount') })
      .refine((val) => val <= 1000000, { message: t('validation.maxAmount') })
      .transform((val) => val.toString()),
    productsToImport: z.array(z.string()).min(1, t('validation.productsRequired')),
    monthlyImportVolume: z.string().min(1, t('validation.monthlyVolumeRequired')),
    justification: z.string().min(20, t('validation.justificationMinLength')),
  });

  const editCreditApplicationSchema = z.object({
    legalCompanyName: z.string().min(1, t('validation.businessNameRequired')),
    tradingName: z.string().optional(),
    cnpj: z.string().min(1, t('validation.cnpjInvalid')),
    stateRegistration: z.string().optional(),
    municipalRegistration: z.string().optional(),
    address: z.string().min(1, t('validation.addressRequired')),
    city: z.string().min(1, t('validation.cityRequired')),
    state: z.string().min(1, t('validation.stateRequired')),
    zipCode: z.string().min(1, t('validation.zipCodeInvalid')),
    phone: z.string().min(1, t('validation.phoneRequired')),
    email: z.string().email(t('validation.emailInvalid')),
    website: z.string().optional(),
    businessSector: z.string().min(1, t('validation.businessSectorRequired')),
    annualRevenue: z.string().min(1, t('validation.annualRevenueRequired')),
    mainImportedProducts: z.string().min(1, t('validation.importedProductsRequired')),
    mainOriginMarkets: z.string().min(1, t('validation.originMarketsRequired')),
    requestedAmount: z.string().min(1, t('validation.minAmount')),
    monthlyImportVolume: z.string().min(1, t('validation.monthlyVolumeRequired')),
    justification: z.string().min(10, t('validation.justificationMinLength')),
  });

  return {
    companyInfoSchema,
    commercialInfoSchema,
    creditInfoSchema,
    editCreditApplicationSchema,
  };
};