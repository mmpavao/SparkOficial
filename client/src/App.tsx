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
import NewImportPage from "@/pages/import-new";
import ImportNewFormPage from "@/pages/import-new-form";
import ImportDetailsPage from "@/pages/import-details";
import ImportEdit from "@/pages/import-edit";
import PipelineDemoPage from "@/pages/pipeline-demo";
import PipelineSimplePage from "@/pages/pipeline-simple";

import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AdminUsersPage from "@/pages/admin-users";
import AdminUserNewPage from "@/pages/admin-user-new";
import SuppliersPage from "@/pages/suppliers";
import SupplierDetailsPage from "@/pages/supplier-details";
import SupplierEditPage from "@/pages/supplier-edit";
import SupplierNewPage from "@/pages/supplier-new";
import PaymentDetailsPage from "@/pages/payment-details";
import PaymentPayPage from "@/pages/payment-pay";
import PaymentEditPage from "@/pages/payment-edit";

import NotFound from "@/pages/not-found";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import AdminRoute from "@/components/AdminRoute";

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



  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/credit" component={CreditPage} />
        <Route path="/credit/new" component={CreditApplicationPage} />
        <Route path="/credit/details/:id" component={CreditDetailsPage} />
        <Route path="/credit/edit/:id" component={CreditEditPage} />

        <Route path="/imports" component={ImportsPage} />
        <Route path="/imports/new" component={NewImportPage} />
        <Route path="/imports/new-form" component={ImportNewFormPage} />
        <Route path="/imports/pipeline-demo" component={PipelineDemoPage} />
        <Route path="/imports/pipeline" component={PipelineSimplePage} />
        <Route path="/imports/:id" component={ImportDetailsPage} />
        <Route path="/imports/:id/edit" component={ImportEdit} />

        <Route path="/suppliers" component={SuppliersPage} />
        <Route path="/suppliers/details/:id" component={SupplierDetailsPage} />
        <Route path="/suppliers/edit/:id" component={SupplierEditPage} />
        <Route path="/suppliers/new" component={SupplierNewPage} />
        <Route path="/payments/details/:id" component={PaymentDetailsPage} />
        <Route path="/payments/pay/:id" component={PaymentPayPage} />
        <Route path="/payments/edit/:id" component={PaymentEditPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/users" component={() => <AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/users/new" component={() => <AdminRoute><AdminUserNewPage /></AdminRoute>} />
        <Route path="/admin/users" component={() => <AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/users/new" component={() => <AdminRoute><AdminUserNewPage /></AdminRoute>} />

        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
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
