import { z } from 'zod';
import { useTranslation } from 'react-i18next';

export type TranslationFunction = (key: string, options?: any) => string;

// Wrapper functions for all validation types
export const createI18nValidation = (t: TranslationFunction) => {
  return {
    // String validations
    requiredString: (minLength: number = 1, errorKey: string) => 
      z.string().min(minLength, t(errorKey)),
    
    optionalString: (errorKey?: string) => 
      z.string().optional(),
    
    email: (errorKey: string = 'validation.emailInvalid') => 
      z.string().email(t(errorKey)),
    
    // Number validations
    requiredNumber: (min: number, max: number, minErrorKey: string, maxErrorKey?: string) => 
      z.number()
        .min(min, t(minErrorKey))
        .max(max, t(maxErrorKey || 'validation.maxValue')),
    
    positiveNumber: (errorKey: string = 'validation.mustBePositive') =>
      z.number().positive(t(errorKey)),
    
    // Custom validations
    cnpj: (errorKey: string = 'validation.cnpjInvalid') =>
      z.string().refine((val) => {
        const cleanCnpj = val.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) return false;
        if (/^(\d)\1+$/.test(cleanCnpj)) return false;
        
        // CNPJ validation algorithm
        let sum = 0;
        let weight = 5;
        for (let i = 0; i < 12; i++) {
          sum += parseInt(cleanCnpj[i]) * weight;
          weight = weight === 2 ? 9 : weight - 1;
        }
        let remainder = sum % 11;
        const firstDigit = remainder < 2 ? 0 : 11 - remainder;
        if (parseInt(cleanCnpj[12]) !== firstDigit) return false;
        
        sum = 0;
        weight = 6;
        for (let i = 0; i < 13; i++) {
          sum += parseInt(cleanCnpj[i]) * weight;
          weight = weight === 2 ? 9 : weight - 1;
        }
        remainder = sum % 11;
        const secondDigit = remainder < 2 ? 0 : 11 - remainder;
        return parseInt(cleanCnpj[13]) === secondDigit;
      }, t(errorKey)),
    
    cpf: (errorKey: string = 'validation.cpfInvalid') =>
      z.string().refine((val) => {
        const cleanCpf = val.replace(/\D/g, '');
        if (cleanCpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cleanCpf)) return false;
        
        // CPF validation algorithm
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cleanCpf[i]) * (10 - i);
        }
        let remainder = sum % 11;
        const firstDigit = remainder < 2 ? 0 : 11 - remainder;
        if (parseInt(cleanCpf[9]) !== firstDigit) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cleanCpf[i]) * (11 - i);
        }
        remainder = sum % 11;
        const secondDigit = remainder < 2 ? 0 : 11 - remainder;
        return parseInt(cleanCpf[10]) === secondDigit;
      }, t(errorKey)),
    
    zipCode: (errorKey: string = 'validation.zipCodeInvalid') =>
      z.string().refine((val) => {
        const cleanZip = val.replace(/\D/g, '');
        return cleanZip.length === 8;
      }, t(errorKey)),
    
    phone: (errorKey: string = 'validation.phoneInvalid') =>
      z.string().refine((val) => {
        const cleanPhone = val.replace(/\D/g, '');
        return cleanPhone.length >= 10 && cleanPhone.length <= 11;
      }, t(errorKey)),
    
    // Enum validations
    enum: <T extends string>(values: readonly T[], errorKey: string) =>
      z.enum(values, { required_error: t(errorKey) }),
    
    // Array validations
    arrayMinLength: <T>(minLength: number, errorKey: string) =>
      z.array(z.any()).min(minLength, t(errorKey)),
    
    // Currency validations
    currency: (min: number, max: number, minErrorKey: string, maxErrorKey: string) =>
      z.string()
        .transform((val) => parseFloat(val.replace(/[,$]/g, '')))
        .refine((val) => val >= min, { message: t(minErrorKey) })
        .refine((val) => val <= max, { message: t(maxErrorKey) })
        .transform((val) => val.toString()),
    
    // Website validation
    website: (errorKey: string = 'validation.websiteInvalid') =>
      z.string().optional().refine((val) => {
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
      }, t(errorKey))
  };
};

// Hook for using i18n validation in components
export const useI18nValidation = () => {
  const { t } = useTranslation();
  return createI18nValidation(t);
};

// Common schema factories
export const createCommonSchemas = (t: TranslationFunction) => {
  const v = createI18nValidation(t);
  
  return {
    // Company info schema
    companyInfo: z.object({
      legalCompanyName: v.requiredString(2, 'validation.businessNameRequired'),
      tradingName: v.optionalString(),
      cnpj: v.cnpj(),
      stateRegistration: v.optionalString(),
      municipalRegistration: v.optionalString(),
      address: v.requiredString(5, 'validation.addressRequired'),
      city: v.requiredString(2, 'validation.cityRequired'),
      state: v.requiredString(2, 'validation.stateRequired'),
      zipCode: v.zipCode(),
      phone: v.phone(),
      email: v.email(),
      website: v.website(),
      shareholders: v.arrayMinLength(1, 'validation.shareholderRequired').refine(
        (shareholders) => shareholders.every((s: any) => 
          s.name && s.name.length >= 2 && 
          s.cpf && s.cpf.length >= 11 &&
          s.percentage >= 0 && s.percentage <= 100
        ),
        { message: t('validation.shareholderDataInvalid') }
      )
    }),
    
    // User registration schema
    userRegistration: z.object({
      companyName: v.requiredString(1, 'validation.companyNameRequired'),
      cnpj: v.cnpj(),
      fullName: v.requiredString(1, 'validation.fullNameRequired'),
      phone: v.phone(),
      email: v.email(),
      password: v.requiredString(6, 'validation.passwordMinLength'),
      confirmPassword: v.requiredString(1, 'validation.confirmPasswordRequired')
    }).refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMustMatch'),
      path: ['confirmPassword']
    }),
    
    // Import form schema
    importForm: z.object({
      importName: v.requiredString(3, 'validation.importNameRequired'),
      cargoType: v.enum(['FCL', 'LCL'], 'validation.cargoTypeRequired'),
      shippingMethod: v.enum(['sea', 'air'], 'validation.shippingMethodRequired'),
      origin: v.requiredString(2, 'validation.originRequired'),
      destination: v.requiredString(2, 'validation.destinationRequired'),
      totalValue: v.currency(1, 10000000, 'validation.minAmount', 'validation.maxAmount'),
      estimatedDelivery: v.requiredString(1, 'validation.estimatedDeliveryRequired')
    })
  };
};