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
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/I18nContext";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema, loginSchema, type InsertUser, type LoginUser } from "@shared/schema";
import { formatCnpj, validateCnpj } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import { Shield, Clock, TrendingUp } from "lucide-react";

import logo_spark_bco from "@assets/logo-spark-bco.jpg";

import logo_spark_comex_green_bg from "@assets/logo spark comex green bg.png";

import logo_spark_fundo_color_ from "@assets/logo spark fundo color .png";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      return await apiRequest("/api/auth/login", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t.auth.loginSuccess,
        description: "Bem-vindo de volta à Spark Comex.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.errors.loginFailed,
        description: error.message || t.errors.loginFailed,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      return await apiRequest("/api/auth/register", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t.auth.registerSuccess,
        description: "Bem-vindo à Spark Comex.",
      });
    },
    onError: (error: any) => {
      console.log("Registration error:", error); // Debug log
      
      const isConflict = error.status === 409;
      const errorData = error.data || {};
      
      if (isConflict && errorData.type === "cnpj_exists") {
        toast({
          title: "CNPJ já cadastrado",
          description: errorData.suggestion || "Este CNPJ já possui uma conta cadastrada. Verifique se sua empresa já possui conta ou entre em contato conosco.",
          variant: "default",
        });
      } else if (isConflict && errorData.type === "email_exists") {
        toast({
          title: "E-mail já cadastrado",
          description: errorData.suggestion || "Este e-mail já possui uma conta cadastrada. Tente fazer login ou use a opção 'Esqueci minha senha'.",
          variant: "default",
        });
      } else if (isConflict) {
        // Generic conflict error (CNPJ or email exists but type not specified)
        const message = error.message || errorData.message || "Dados já cadastrados";
        if (message.toLowerCase().includes("cnpj")) {
          toast({
            title: "CNPJ já cadastrado",
            description: "Este CNPJ já possui uma conta cadastrada. Verifique se sua empresa já possui conta ou entre em contato conosco.",
            variant: "default",
          });
        } else if (message.toLowerCase().includes("email") || message.toLowerCase().includes("e-mail")) {
          toast({
            title: "E-mail já cadastrado", 
            description: "Este e-mail já possui uma conta cadastrada. Tente fazer login ou use a opção 'Esqueci minha senha'.",
            variant: "default",
          });
        } else {
          toast({
            title: "Dados já cadastrados",
            description: message,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Falha no cadastro",
          description: error.message || "Ocorreu um erro ao criar sua conta. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const onLoginSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: InsertUser) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-spark flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <img 
              src={logo_spark_fundo_color_} 
              alt="Spark Comex" 
              className="h-20 w-auto mx-auto mb-4"
            />
          </div>
          <p className="text-lg opacity-90 mb-8">
            Plataforma completa para gestão de importações e crédito comercial do Brasil para a China
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm opacity-75">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              <span>{t.auth.secure}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>{t.auth.fast}</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span>{t.auth.efficient}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/spark-logo.png" 
              alt="Spark Comex" 
              className="h-12 w-auto mx-auto"
            />
          </div>

          {/* Login Form */}
          {isLogin ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h2>
                <p className="text-gray-600">Faça login na sua conta Spark Comex</p>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
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
                        <FormLabel>Senha</FormLabel>
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
                        onCheckedChange={setRememberMe}
                        className="peer shrink-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1 h-6 w-6 border-3 border-gray-600 rounded data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white shadow-md ml-[0px] mr-[0px] bg-[#e1e3e2]" 
                      />
                      <span className="ml-2 text-sm text-gray-600">{t.auth.rememberMe}</span>
                    </label>
                    <Button variant="link" className="text-spark-600 hover:text-spark-700 p-0">
                      {t.auth.forgotPassword}
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-spark-600 hover:bg-spark-700 focus:ring-4 focus:ring-spark-200"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? t.auth.signingIn : t.auth.signIn}
                  </Button>
                </form>
              </Form>

              <div className="text-center">
                <span className="text-gray-600">{t.auth.dontHaveAccount} </span>
                <Button 
                  variant="link" 
                  onClick={() => setIsLogin(false)}
                  className="text-spark-600 hover:text-spark-700 p-0 font-medium"
                >
                  {t.auth.registerButton}
                </Button>
              </div>
            </div>
          ) : (
            /* Register Form */
            (<div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.auth.createAccount}</h2>
                <p className="text-gray-600">{t.auth.createAccountDescription}</p>
              </div>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.companyName}</FormLabel>
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
                          <FormLabel>{t.auth.cnpj}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00.000.000/0000-00" 
                              value={field.value || ""}
                              onChange={(e) => {
                                const formatted = formatCnpj(e.target.value);
                                field.onChange(formatted);
                              }}
                              onBlur={async (e) => {
                                field.onBlur();
                                // Trigger validation immediately when user finishes typing
                                await registerForm.trigger("cnpj");
                              }}
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.auth.fullName}
                    </label>
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={registerForm.watch("fullName") || ""}
                      onChange={(e) => registerForm.setValue("fullName", e.target.value)}
                      name="fullname_field"
                      autoComplete="off"
                      data-lpignore="true"
                      spellCheck="false"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.phone}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              value={field.value || ""}
                              onChange={(e) => {
                                const formatted = formatPhone(e.target.value);
                                field.onChange(formatted);
                              }}
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
                          <FormLabel>{t.auth.email}</FormLabel>
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
                          <FormLabel>{t.auth.password}</FormLabel>
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
                          <FormLabel>{t.auth.confirmPassword}</FormLabel>
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
                      <FormItem className="flex items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="peer shrink-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1 h-6 w-6 border-3 border-gray-600 rounded data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white shadow-md ml-[0px] mr-[0px] bg-[#e1e3e2]" 
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <span className="text-sm text-gray-600">
                            {t.auth.acceptTerms}{" "}
                            <Button variant="link" className="text-spark-600 hover:text-spark-700 p-0 h-auto">
                              {t.auth.termsOfUse}
                            </Button>{" "}
                            e{" "}
                            <Button variant="link" className="text-spark-600 hover:text-spark-700 p-0 h-auto">
                              {t.auth.privacyPolicy}
                            </Button>
                          </span>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-spark-600 hover:bg-spark-700 focus:ring-4 focus:ring-spark-200"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? t.auth.creatingAccount : t.auth.createAccount}
                  </Button>
                </form>
              </Form>
              <div className="text-center">
                <span className="text-gray-600">{t.auth.haveAccount} </span>
                <Button 
                  variant="link" 
                  onClick={() => setIsLogin(true)}
                  className="text-spark-600 hover:text-spark-700 p-0 font-medium"
                >
                  {t.auth.signInNow}
                </Button>
              </div>
            </div>)
          )}
        </div>
      </div>
    </div>
  );
}