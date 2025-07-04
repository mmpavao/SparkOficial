import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Shield, CreditCard, ArrowRight } from "lucide-react";

interface PayComexConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentData: {
    amount: string;
    currency: string;
    description: string;
  };
  onConnectionSuccess: (sessionToken: string) => void;
}

export default function PayComexConnectionModal({
  open,
  onOpenChange,
  paymentData,
  onConnectionSuccess
}: PayComexConnectionModalProps) {
  const [step, setStep] = useState<'login' | 'token' | 'connecting'>('login');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [tokenData, setTokenData] = useState({
    code: '',
    verificationTokenId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simular chamada para Pay Comex API
      // Em produção, substituir por chamada real para /api/v1/public/auth/spark-comex-login
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - em produção usar response real
      const mockResponse = {
        success: true,
        token_sent: true,
        verification_token_id: "vtk_demo_123456789",
        message: "Token de verificação enviado para o email",
        expires_in: 300
      };

      setTokenData(prev => ({ ...prev, verificationTokenId: mockResponse.verification_token_id }));
      setStep('token');
      
      toast({
        title: "Token enviado",
        description: "Verifique seu email para o código de confirmação (válido por 5 minutos)."
      });
    } catch (error) {
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar com Pay Comex. Verifique suas credenciais.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenVerification = async () => {
    if (!tokenData.code || tokenData.code.length !== 6) {
      toast({
        title: "Token inválido",
        description: "Digite o código de 6 dígitos enviado por email.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStep('connecting');
    
    try {
      // Simular verificação do token e transferência de dados
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock response - em produção usar response real
      const mockResponse = {
        success: true,
        authenticated: true,
        session_token: "st_paycomex_demo_abcdef123456",
        user_profile: {
          id: "usr_sparkcomex_12345",
          email: loginData.email,
          profile_complete: true
        }
      };

      onConnectionSuccess(mockResponse.session_token);
      
      toast({
        title: "Conexão bem-sucedida!",
        description: "Dados transferidos automaticamente. Redirecionando para checkout Pay Comex..."
      });

      // Fechar modal após sucesso
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Código inválido ou expirado. Tente novamente.",
        variant: "destructive"
      });
      setStep('token');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'login':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Conectar com Pay Comex</h3>
              <p className="text-sm text-gray-600">
                Faça login na sua conta Pay Comex para processar o pagamento
              </p>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Seus dados serão transferidos automaticamente</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Informações da empresa e crédito aprovado no Spark Comex
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email Pay Comex</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha Pay Comex</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Conectar e Enviar Token
                </>
              )}
            </Button>
          </div>
        );

      case 'token':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Confirme seu Email</h3>
              <p className="text-sm text-gray-600">
                Enviamos um código de 6 dígitos para <strong>{loginData.email}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="token">Código de Verificação</Label>
              <Input
                id="token"
                type="text"
                maxLength={6}
                value={tokenData.code}
                onChange={(e) => setTokenData(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
                placeholder="000000"
                className="text-center text-lg tracking-wider"
              />
              <p className="text-xs text-gray-500 mt-1">
                Válido por 5 minutos
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('login')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleTokenVerification} 
                className="flex-1" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Conectando contas...</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Autenticação confirmada</p>
              <p>✓ Transferindo dados da empresa</p>
              <p>✓ Configurando perfil Pay Comex</p>
              <p className="animate-pulse">→ Preparando checkout...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            Pay Comex Integration
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta Pay Comex para processar pagamentos internacionais
          </DialogDescription>
        </DialogHeader>

        {/* Payment Summary */}
        <Card className="bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resumo do Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Valor:</span>
              <span className="font-semibold">{paymentData.amount} {paymentData.currency}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">Descrição:</span>
              <Badge variant="outline" className="text-xs">
                {paymentData.description}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}