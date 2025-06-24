/**
 * Language Selector Component for Spark Comex
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/contexts/I18nContext";
import { Languages } from "lucide-react";

export default function LanguageSelector() {
  try {
    const { language, changeLanguage, availableLanguages } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            {availableLanguages.find(lang => lang.code === language)?.flag} {availableLanguages.find(lang => lang.code === language)?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  } catch (error) {
    console.error('LanguageSelector: useTranslation context not available', error);
    return (
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-muted-foreground" />
        <span>PT</span>
      </div>
    );
  }
}