import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";

interface AdminFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function AdminFilters({ onFiltersChange }: AdminFiltersProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    status: "all",
    company: "",
    minAmount: "",
    maxAmount: "",
    riskLevel: "all",
    preAnalysisStatus: "all",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: "all",
      company: "",
      minAmount: "",
      maxAmount: "",
      riskLevel: "all",
      preAnalysisStatus: "all",
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status' || key === 'riskLevel' || key === 'preAnalysisStatus') {
      return value !== "all" && value !== "";
    }
    return value !== "" && value !== undefined;
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('credit.adminFilters')}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {t('credit.active')}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="h-4 w-4 mr-1" />
                {t('credit.clear')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t('credit.collapseFilters') : t('credit.expandFilters')}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">{t('credit.status')}</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('credit.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('credit.allStatus')}</SelectItem>
                  <SelectItem value="pending">{t('credit.pending')}</SelectItem>
                  <SelectItem value="under_review">{t('credit.underReview')}</SelectItem>
                  <SelectItem value="approved">{t('credit.approved')}</SelectItem>
                  <SelectItem value="rejected">{t('credit.rejected')}</SelectItem>
                  <SelectItem value="cancelled">{t('credit.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Filter */}
            <div className="space-y-2">
              <Label htmlFor="company">{t('credit.company')}</Label>
              <Input
                id="company"
                placeholder={t('credit.companyPlaceholder')}
                value={filters.company}
                onChange={(e) => handleFilterChange("company", e.target.value)}
              />
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label>{t('credit.minAmount')}</Label>
              <Input
                placeholder={t('credit.minAmountPlaceholder')}
                value={filters.minAmount}
                onChange={(e) => handleFilterChange("minAmount", e.target.value)}
              />
            </div>

            {/* Risk Level Filter */}
            <div className="space-y-2">
              <Label htmlFor="riskLevel">{t('credit.riskLevel')}</Label>
              <Select
                value={filters.riskLevel}
                onValueChange={(value) => handleFilterChange("riskLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('credit.allLevels')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('credit.allLevels')}</SelectItem>
                  <SelectItem value="low">{t('credit.low')}</SelectItem>
                  <SelectItem value="medium">{t('credit.medium')}</SelectItem>
                  <SelectItem value="high">{t('credit.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pre-Analysis Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="preAnalysisStatus">{t('credit.preAnalysis')}</Label>
              <Select
                value={filters.preAnalysisStatus}
                onValueChange={(value) => handleFilterChange("preAnalysisStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('credit.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('credit.allStatus')}</SelectItem>
                  <SelectItem value="pending">{t('credit.pending')}</SelectItem>
                  <SelectItem value="pre_approved">{t('credit.preApproved')}</SelectItem>
                  <SelectItem value="needs_documents">{t('credit.needsDocuments')}</SelectItem>
                  <SelectItem value="needs_clarification">{t('credit.needsClarification')}</SelectItem>
                  <SelectItem value="rejected">{t('credit.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('credit.maxAmount')}</Label>
              <Input
                placeholder={t('credit.maxAmountPlaceholder')}
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}