import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { I18nProvider } from "@/contexts/I18nContext";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import CreditPage from "@/pages/credit";
import CreditApplicationPage from "@/pages/credit-application";
import CreditDetailsPage from "@/pages/credit-details";
import CreditEditPage from "@/pages/credit-edit";
import ImportsPage from "@/pages/imports";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AdminPage from "@/pages/admin";
import AdminUsersPage from "@/pages/admin-users";
import NotFound from "@/pages/not-found";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-spark-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        <AuthenticatedLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/credit" component={CreditPage} />
            <Route path="/credit/new" component={CreditApplicationPage} />
            <Route path="/credit/details/:id" component={CreditDetailsPage} />
            <Route path="/credit/edit/:id" component={CreditEditPage} />
            <Route path="/imports" component={ImportsPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/admin/users" component={AdminUsersPage} />
            <Route component={NotFound} />
          </Switch>
        </AuthenticatedLayout>
      ) : (
        <Route path="/" component={AuthPage} />
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
