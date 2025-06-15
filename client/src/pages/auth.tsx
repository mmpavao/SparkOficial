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
import { formatCnpj } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import { Shield, Clock, TrendingUp } from "lucide-react";

export default function AuthPage() {
  console.log("AuthPage renderizando...");
  
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  
  // Try-catch para capturar erros de tradução
  let t;
  try {
    const translation = useTranslation();
    t = translation.t;
    console.log("Tradução carregada com sucesso");
  } catch (error) {
    console.error("Erro na tradução:", error);
    // Fallback básico
    t = {
      auth: {
        welcomeBack: "Bem-vindo de volta",
        loginDescription: "Faça login na sua conta",
        email: "E-mail",
        password: "Senha",
        signIn: "Entrar",
        signingIn: "Entrando...",
        rememberMe: "Lembrar de mim",
        forgotPassword: "Esqueci a senha",
        dontHaveAccount: "Não tem uma conta?",
        registerButton: "Cadastre-se",
        createAccount: "Criar conta",
        createAccountDescription: "Crie sua conta empresarial",
        companyName: "Nome da Empresa",
        cnpj: "CNPJ",
        fullName: "Nome Completo",
        phone: "Telefone",
        confirmPassword: "Confirmar Senha",
        acceptTerms: "Aceito os",
        termsOfUse: "Termos de Uso",
        privacyPolicy: "Política de Privacidade",
        creatingAccount: "Criando conta...",
        haveAccount: "Já tem uma conta?",
        signInNow: "Entre agora",
        platformDescription: "Plataforma completa para importação do Brasil",
        secure: "Seguro",
        fast: "Rápido",
        efficient: "Eficiente",
        loginSuccess: "Login realizado com sucesso",
        registerSuccess: "Cadastro realizado com sucesso"
      },
      errors: {
        loginFailed: "Erro no login",
        registrationFailed: "Erro no cadastro"
      }
    };
  }
  
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
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
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
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t.auth.registerSuccess,
        description: "Bem-vindo à Spark Comex.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.errors.registrationFailed,
        description: error.message || t.errors.registrationFailed,
        variant: "destructive",
      });
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
              src="/spark-logo.png" 
              alt="Spark Comex" 
              className="h-20 w-auto mx-auto mb-4"
            />
          </div>
          <p className="text-lg opacity-90 mb-8">
            {t.auth.platformDescription}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.auth.welcomeBack}</h2>
                <p className="text-gray-600">{t.auth.loginDescription}</p>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.auth.email}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="seu@email.com" 
                            {...field} 
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
                        <FormLabel>{t.auth.password}</FormLabel>
                        <FormControl>
                          <PasswordInput 
                            placeholder="••••••••" 
                            {...field} 
                            className="focus:ring-spark-500 focus:border-spark-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <Checkbox className="data-[state=checked]:bg-spark-600 data-[state=checked]:border-spark-600" />
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
            <div className="space-y-6">
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
                              {...field}
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
                              {...field}
                              onChange={(e) => {
                                const formatted = formatCnpj(e.target.value);
                                field.onChange(formatted);
                              }}
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
                        <FormLabel>{t.auth.fullName}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Seu nome completo" 
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
                          <FormLabel>{t.auth.phone}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              {...field}
                              onChange={(e) => {
                                const formatted = formatPhone(e.target.value);
                                field.onChange(formatted);
                              }}
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
                              {...field}
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
                              {...field}
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
                              {...field}
                              className="focus:ring-spark-500 focus:border-spark-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-start">
                    <Checkbox 
                      required 
                      className="mt-1 data-[state=checked]:bg-spark-600 data-[state=checked]:border-spark-600" 
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {t.auth.acceptTerms}{" "}
                      <Button variant="link" className="text-spark-600 hover:text-spark-700 p-0 h-auto">
                        {t.auth.termsOfUse}
                      </Button>{" "}
                      e{" "}
                      <Button variant="link" className="text-spark-600 hover:text-spark-700 p-0 h-auto">
                        {t.auth.privacyPolicy}
                      </Button>
                    </span>
                  </div>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
