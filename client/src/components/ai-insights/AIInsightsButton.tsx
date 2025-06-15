import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";
import AIInsightsSidebar from "./AIInsightsSidebar";

export default function AIInsightsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  return (
    <>
      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={handleToggle}
          className={`
            relative h-14 w-14 rounded-full shadow-lg transition-all duration-300 
            ${isOpen ? 'bg-spark-700 hover:bg-spark-800' : 'bg-spark-600 hover:bg-spark-700'}
            ${isMinimized ? 'animate-pulse' : ''}
          `}
          size="sm"
        >
          <div className="relative">
            <Brain className="w-6 h-6 text-white" />
            {isMinimized && (
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-bounce" />
            )}
          </div>
          
          {/* Notification dot for new insights */}
          {!isOpen && !isMinimized && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
          )}
        </Button>
      </div>

      {/* AI Insights Sidebar */}
      <AIInsightsSidebar 
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
      />
    </>
  );
}