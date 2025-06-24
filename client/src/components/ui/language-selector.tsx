import React from "react";
import { Languages } from "lucide-react";

export default function LanguageSelector() {
  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <span>PT</span>
    </div>
  );
}