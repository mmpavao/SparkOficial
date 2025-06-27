import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Volume2, VolumeX } from "lucide-react";
import { useSoundEffects } from "@/utils/soundEffects";
import { useState, useEffect } from "react";

export default function SoundEffectsSettings() {
  const { isEnabled, setEnabled, playApprovalSound, playPaymentSound, playStatusChangeSound, playNotificationSound } = useSoundEffects();
  const [soundEnabled, setSoundEnabled] = useState(isEnabled());

  useEffect(() => {
    setSoundEnabled(isEnabled());
  }, [isEnabled]);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setEnabled(enabled);
  };

  const testSounds = [
    {
      name: "Aprovação de Crédito",
      description: "Som tocado quando crédito é aprovado",
      action: playApprovalSound,
      color: "text-green-600"
    },
    {
      name: "Pagamento Concluído",
      description: "Som tocado quando pagamento é processado",
      action: playPaymentSound,
      color: "text-blue-600"
    },
    {
      name: "Mudança de Status",
      description: "Som tocado quando status é atualizado",
      action: playStatusChangeSound,
      color: "text-orange-600"
    },
    {
      name: "Nova Notificação",
      description: "Som tocado para novas notificações",
      action: playNotificationSound,
      color: "text-purple-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {soundEnabled ? (
            <Volume2 className="h-5 w-5 text-green-600" />
          ) : (
            <VolumeX className="h-5 w-5 text-gray-400" />
          )}
          Efeitos Sonoros
        </CardTitle>
        <CardDescription>
          Configure os sons para ações financeiras positivas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-effects" className="text-base">
              Ativar Efeitos Sonoros
            </Label>
            <div className="text-sm text-muted-foreground">
              Sons tocam automaticamente para aprovações, pagamentos e notificações
            </div>
          </div>
          <Switch
            id="sound-effects"
            checked={soundEnabled}
            onCheckedChange={handleToggleSound}
          />
        </div>

        {soundEnabled && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Testar Sons</h4>
              <div className="grid gap-3">
                {testSounds.map((sound, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className={`font-medium text-sm ${sound.color}`}>
                        {sound.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sound.description}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sound.action}
                      className="text-xs"
                    >
                      Testar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Volume2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">
                    Sobre os Efeitos Sonoros
                  </div>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>• Sons tocam automaticamente para ações positivas</li>
                    <li>• Volume controlado pelas configurações do sistema</li>
                    <li>• Preferência salva localmente no navegador</li>
                    <li>• Compatível com todos os navegadores modernos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}