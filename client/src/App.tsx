import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
// Removed legacy I18nProvider - now using react-i18next

import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import CreditPage from "@/pages/credit";
import CreditApplicationPage from "@/pages/credit-application";
import CreditDetailsPage from "@/pages/credit-details";
import CreditEditPage from "@/pages/credit-edit";
import ImportsPageIntegrated from "@/pages/imports-new-integrated";
import ImportsNewFormPage from "@/pages/imports-new-form";
import ImportNewEnhancedPage from "@/pages/import-new-enhanced";
import ImportDetailsPage from "@/pages/import-details";
import ImportEdit from "@/pages/import-edit";
import ImportEditOperationalPage from "@/pages/import-edit-operational";
import ImportNewExpandedPage from "@/pages/import-new-expanded";
import PipelineDemoPage from "@/pages/pipeline-demo";
import PipelineSimplePage from "@/pages/pipeline-simple";

import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AdminUsersPage from "@/pages/admin-users";
import AdminUserNewPage from "@/pages/admin-user-new";
import ImportersPage from "@/pages/importers";
import SuppliersPage from "@/pages/suppliers";
import SupplierDetailsPage from "@/pages/supplier-details";
import SupplierEditPage from "@/pages/supplier-edit";
import SupplierNewPage from "@/pages/supplier-new";
import PaymentsPage from "@/pages/payments";
import PaymentDetailsPage from "@/pages/payment-details";
import ImporterDetailsPage from "@/pages/importer-details";
import AdminSupportPage from "@/pages/admin-support";
import SupportPage from "@/pages/support";
import SupportNewPage from "@/pages/support-new";
import SupportTicketPage from "@/pages/support-ticket";
import ProductsPage from "@/pages/products";
import CustomsBrokerDashboard from "@/pages/customs-broker-dashboard";

import NotFound from "@/pages/not-found";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import AdminRoute from "@/components/AdminRoute";
import { ModuleProvider } from "./contexts/ModuleContext";

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
        <Route path="/" component={user?.role === 'customs_broker' ? CustomsBrokerDashboard : Dashboard} />
        <Route path="/credit" component={CreditPage} />
        <Route path="/credit/new" component={CreditApplicationPage} />
        <Route path="/credit/details/:id" component={CreditDetailsPage} />
        <Route path="/credit/edit/:id" component={CreditEditPage} />

        <Route path="/imports" component={ImportsPageIntegrated} />
        <Route path="/imports/new" component={() => <ImportNewEnhancedPage isEditing={false} />} />
        <Route path="/imports/new-form" component={ImportsNewFormPage} />
        <Route path="/imports/new-enhanced" component={() => <ImportNewEnhancedPage isEditing={false} />} />
        <Route path="/imports/new-expanded" component={ImportNewExpandedPage} />
        <Route path="/imports/:id" component={ImportDetailsPage} />
        <Route path="/imports/:id/edit" component={ImportEdit} />
        <Route path="/imports/operational/:id" component={ImportDetailsPage} />
        <Route path="/imports/operational/:id/edit" component={ImportEditOperationalPage} />

        <Route path="/suppliers" component={SuppliersPage} />
        <Route path="/suppliers/details/:id" component={SupplierDetailsPage} />
        <Route path="/suppliers/edit/:id" component={SupplierEditPage} />
        <Route path="/suppliers/new" component={SupplierNewPage} />
        
        <Route path="/products" component={ProductsPage} />
        
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/payments/:id" component={PaymentDetailsPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/users" component={() => <AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/users/new" component={() => <AdminRoute><AdminUserNewPage /></AdminRoute>} />
        <Route path="/importers" component={() => <AdminRoute><ImportersPage /></AdminRoute>} />
        <Route path="/importers/:id" component={() => <AdminRoute><ImporterDetailsPage /></AdminRoute>} />
        <Route path="/admin/users" component={() => <AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/users/new" component={() => <AdminRoute><AdminUserNewPage /></AdminRoute>} />
        <Route path="/admin/support" component={() => <AdminRoute><AdminSupportPage /></AdminRoute>} />
        <Route path="/support/new" component={SupportNewPage} />
        <Route path="/support/ticket/:id" component={SupportTicketPage} />

        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ModuleProvider module="IMPORTER">
          <Router />
        </ModuleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;