import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Loader2 } from "lucide-react";

export default function LanguageSelector() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isChanging, availableLanguages } = useLanguage();

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode !== currentLanguage && !isChanging) {
      changeLanguage(languageCode);
    }
  };

  const getCurrentLanguage = () => {
    return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];
  };

  return (
    <div className="relative">
      <Select 
        value={currentLanguage} 
        onValueChange={handleLanguageChange}
        disabled={isChanging}
      >
        <SelectTrigger className="w-auto min-w-[120px] h-9 border border-gray-200 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 disabled:opacity-50 transition-all duration-200">
          <SelectValue>
            <div className="flex items-center gap-2">
              {isChanging ? (
                <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-base">{getCurrentLanguage().flag}</span>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {getCurrentLanguage().name}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-[160px] bg-white border border-gray-200 shadow-lg rounded-md">
          {availableLanguages.map((lang) => (
            <SelectItem 
              key={lang.code} 
              value={lang.code}
              className="cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 px-3 py-2 transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
                {lang.code === currentLanguage && (
                  <span className="text-xs text-emerald-600 font-medium ml-auto">✓</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Accessibility - Screen Reader */}
      <div className="sr-only">
        {t('language')} - {getCurrentLanguage().name} - Status: {isChanging ? t('common.loading') : 'Ready'}
      </div>
    </div>
  );
}