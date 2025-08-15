import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Globe, Loader2, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipos de idioma suportados
type Language = 'pt-BR' | 'en' | 'zh' | 'ru' | 'fr';

// Configuração dos idiomas disponíveis para clientes
const clientLanguages = [
  { code: 'pt-BR' as Language, name: 'Português', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'zh' as Language, name: '中文', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷', nativeName: 'Français' }
];

export default function ClientLanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === i18n.language || isChanging) return;
    
    setIsChanging(true);
    
    try {
      // Simular um pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Alterar o idioma usando react-i18next
      await i18n.changeLanguage(newLanguage);
      
      // Feedback visual
      console.log(`✅ Idioma alterado para: ${newLanguage}`);
      
    } catch (error) {
      console.error('❌ Erro ao alterar idioma:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const getCurrentLanguage = () => {
    return clientLanguages.find(lang => lang.code === i18n.language) || clientLanguages[0];
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isChanging}
            className="flex items-center gap-2 px-3 py-2 h-10 border border-gray-200 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 transition-all duration-200 shadow-sm rounded-md min-w-[140px]"
          >
            {isChanging ? (
              <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 text-emerald-600" />
            )}
            <span className="text-lg">{getCurrentLanguage().flag}</span>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {getCurrentLanguage().nativeName}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="min-w-[180px] bg-white border border-gray-200 shadow-lg rounded-lg p-1">
          {clientLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 px-3 py-3 transition-colors duration-150 rounded-md"
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium text-gray-900">{lang.nativeName}</span>
                  <span className="text-xs text-gray-500">{lang.name}</span>
                </div>
                {lang.code === i18n.language && (
                  <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Indicador de status para acessibilidade */}
      <div className="sr-only" aria-live="polite">
        {t('language')} - {getCurrentLanguage().nativeName} - Status: {isChanging ? t('common.loading') : t('common.ready')}
      </div>
    </div>
  );
}
