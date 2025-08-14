import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, loginSchema, type InsertUser, type LoginUser } from "@shared/schema";
import { formatCnpj, validateCnpj } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import { Shield, Clock, TrendingUp } from "lucide-react";

import logo_spark_bco from "@assets/logo-spark-bco.jpg";
import logo_spark_comex_green_bg from "@assets/logo spark comex green bg.png";
import logo_spark_fundo_color_ from "@assets/logo spark fundo color .png";

import { useTranslation } from 'react-i18next';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Form switching handlers with reset
  const switchToRegister = () => {
    setIsLogin(false);
    registerForm.reset({
      companyName: "",
      cnpj: "",
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    });
  };

  const switchToLogin = () => {
    setIsLogin(true);
    loginForm.reset({
      email: "",
      password: "",
    });
  };

  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      companyName: "",
      cnpj: "",
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onChange",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("/api/auth/login", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("/api/auth/register", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Sucesso!",
        description: "Conta criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: InsertUser) => {
    // Validate CNPJ
    if (!validateCnpj(data.cnpj)) {
      toast({
        title: "Erro",
        description: "CNPJ inválido",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#29bc86] text-white relative overflow-hidden">
        <div className="w-full flex flex-col justify-center items-center p-12 text-center">
          <div className="mb-8">
            <img 
              src={logo_spark_fundo_color_} 
              alt="Spark Comex" 
              className="h-20 w-auto mx-auto mb-4"
            />
          </div>
          <p className="text-lg opacity-90 mb-8">
            {t('auth.platformDescription')}
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm opacity-75">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              <span>{t('auth.secure')}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>{t('auth.fast')}</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span>{t('auth.efficient')}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-8 lg:p-12">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/spark-logo.png" 
              alt="Spark Comex" 
              className="h-16 w-auto mx-auto"
            />
          </div>

          {/* Login Form */}
          {isLogin ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.welcomeBack')}</h2>
                <p className="text-gray-600">{t('auth.loginDescription')}</p>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.email}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="seu@email.com" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            className="focus:ring-spark-500 focus:border-spark-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.password}</FormLabel>
                        <FormControl>
                          <PasswordInput 
                            placeholder="••••••••" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            className="focus:ring-spark-500 focus:border-spark-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <Checkbox 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="peer shrink-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1 h-6 w-6 border-3 border-gray-600 rounded data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white shadow-md ml-[0px] mr-[0px] bg-[#e1e3e2]" 
                      />
                      <span className="ml-2 text-sm text-gray-600">{t("auth.rememberMe}</span>
                    </label>
                    <Button variant="link" className="text-spark-600 hover:text-spark-700 p-0">
                      {t("auth.forgotPassword}
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-spark-600 hover:bg-spark-700 focus:ring-4 focus:ring-spark-200"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? t("auth.signingIn : t("auth.signIn}
                  </Button>
                </form>
              </Form>

              <div className="text-center">
                <span className="text-gray-600">{t("auth.dontHaveAccount} </span>
                <Button 
                  variant="link" 
                  onClick={switchToRegister}
                  className="text-spark-600 hover:text-spark-700 p-0 font-medium"
                >
                  {t("auth.registerButton}
                </Button>
              </div>
            </div>
          ) : (
            /* Register Form */
            (<div className="space-y-6" key="register-form">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("auth.createAccount}</h2>
                <p className="text-gray-600">{t("auth.createAccountDescription}</p>
              </div>
              <Form {...registerForm} key="register-form-inner">
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Usuário</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-spark-500 focus:border-spark-500">
                              <SelectValue placeholder="Selecione o tipo de usuário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="importer">Importador</SelectItem>
                            <SelectItem value="customs_broker">Despachante Aduaneiro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.companyName}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Sua Empresa Ltda" 
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="focus:ring-spark-500 focus:border-spark-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.cnpj}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00.000.000/0000-00"
                              value={formatCnpj(field.value || ""}
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="focus:ring-spark-500 focus:border-spark-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.fullName}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Seu Nome Completo"
                            {...field}
                            className="focus:ring-spark-500 focus:border-spark-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.phone}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999"
                              value={formatPhone(field.value || ""}
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="focus:ring-spark-500 focus:border-spark-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.email}</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="seu@email.com"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="focus:ring-spark-500 focus:border-spark-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.password}</FormLabel>
                          <FormControl>
                            <PasswordInput 
                              placeholder="••••••••"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="focus:ring-spark-500 focus:border-spark-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.confirmPassword}</FormLabel>
                          <FormControl>
                            <PasswordInput 
                              placeholder="••••••••"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="focus:ring-spark-500 focus:border-spark-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            className="peer shrink-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1 h-6 w-6 border-3 border-gray-600 rounded data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white shadow-md ml-[0px] mr-[0px] bg-[#e1e3e2]"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-gray-600">
                            {t("auth.acceptTerms}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-spark-600 hover:bg-spark-700 focus:ring-4 focus:ring-spark-200"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? t("auth.registering : t("auth.register}
                  </Button>
                </form>
              </Form>
              <div className="text-center">
                <span className="text-gray-600">{t("auth.alreadyHaveAccount} </span>
                <Button 
                  variant="link" 
                  onClick={switchToLogin}
                  className="text-spark-600 hover:text-spark-700 p-0 font-medium"
                >
                  {t("auth.loginButton}
                </Button>
              </div>
            </div>)
          )}
        </div>
      </div>
      
      {/* Version tag in bottom right corner */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
        <div className="flex items-center text-xs text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="font-medium">v1.0.3</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          09/07/2025 - 2:45 AM
        </div>
      </div>
    </div>
  );
}