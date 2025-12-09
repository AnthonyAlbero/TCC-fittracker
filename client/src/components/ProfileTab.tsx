import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Activity, Calculator, Save } from "lucide-react";
import MetricCard from "./MetricCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@shared/schema";

interface UserProfileForm {
  age: string;
  height: string;
  weight: string;
  gender: string;
  activityLevel: string;
  goal: string;
}

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

const activityLabels = {
  sedentary: "Sedentário (pouco ou nenhum exercício)",
  light: "Leve (exercício leve 1-3 dias/semana)",
  moderate: "Moderado (exercício moderado 3-5 dias/semana)",
  active: "Ativo (exercício intenso 6-7 dias/semana)",
  very_active: "Muito Ativo (exercício muito intenso, trabalho físico)"
};

const goalLabels = {
  maintain: "Manutenção (manter peso atual)",
  lean_bulk: "Ganhos Secos (ganhar massa aos poucos)",
  aggressive_bulk: "Ganhos Agressivos (ganhar massa rápido)",
  cut: "Emagrecer (perder gordura com calma)",
  aggressive_cut: "Emagrecer Agressivo (perder gordura rápido)"
};

const goalCalorieAdjustments = {
  maintain: 0,
  lean_bulk: 250,
  aggressive_bulk: 500,
  cut: -300,
  aggressive_cut: -500
};

export default function ProfileTab() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfileForm>({
    age: "",
    height: "",
    weight: "",
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain"
  });

  // Load profile from database
  const { data: savedProfile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['/api/profile'],
  });

  // Update form when profile loads
  useEffect(() => {
    if (savedProfile) {
      setProfile({
        age: savedProfile.age.toString(),
        height: savedProfile.height.toString(),
        weight: savedProfile.weight.toString(),
        gender: savedProfile.gender,
        activityLevel: savedProfile.activityLevel,
        goal: savedProfile.goal || 'maintain'
      });
    }
  }, [savedProfile]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: UserProfileForm) => {
      return await apiRequest('POST', '/api/profile', {
        age: parseInt(data.age),
        height: parseInt(data.height),
        weight: parseFloat(data.weight),
        gender: data.gender,
        activityLevel: data.activityLevel,
        goal: data.goal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Perfil salvo!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o perfil. Tente novamente.",
      });
    }
  });

  const calculateBMR = () => {
    if (!profile.age || !profile.height || !profile.weight || !profile.gender) return 0;
    
    const age = parseFloat(profile.age);
    const height = parseFloat(profile.height);
    const weight = parseFloat(profile.weight);
    
    // Mifflin-St Jeor Equation
    if (profile.gender === "male") {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const multiplier = activityMultipliers[profile.activityLevel as keyof typeof activityMultipliers] || 1.2;
    return bmr * multiplier;
  };

  const calculateDailyCalorieGoal = () => {
    const tdee = calculateTDEE();
    const adjustment = goalCalorieAdjustments[profile.goal as keyof typeof goalCalorieAdjustments] || 0;
    return tdee + adjustment;
  };

  const calculateBMI = () => {
    if (!profile.height || !profile.weight) return 0;
    const height = parseFloat(profile.height) / 100; // convert cm to m
    const weight = parseFloat(profile.weight);
    return weight / (height * height);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Abaixo do peso", variant: "warning" as const };
    if (bmi < 25) return { category: "Normal", variant: "success" as const };
    if (bmi < 30) return { category: "Sobrepeso", variant: "warning" as const };
    return { category: "Obesidade", variant: "destructive" as const };
  };

  const saveProfile = () => {
    if (!profile.age || !profile.height || !profile.weight) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de salvar.",
      });
      return;
    }
    saveProfileMutation.mutate(profile);
  };

  const bmr = calculateBMR();
  const tdee = calculateTDEE();
  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);
  const dailyCalorieGoal = calculateDailyCalorieGoal();

  if (isLoading) {
    return <div className="text-center py-8">Carregando perfil...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="TMB"
          value={Math.round(bmr)}
          unit="kcal/day"
          icon={<Calculator className="h-4 w-4" />}
          variant="default"
        />
        <MetricCard
          title="TDEE"
          value={Math.round(tdee)}
          unit="kcal/day"
          icon={<Activity className="h-4 w-4" />}
          variant="default"
        />
        <MetricCard
          title="Meta Calórica"
          value={Math.round(dailyCalorieGoal)}
          unit="kcal/day"
          icon={<Activity className="h-4 w-4" />}
          variant="success"
        />
        <MetricCard
          title="IMC"
          value={bmi.toFixed(1)}
          icon={<User className="h-4 w-4" />}
          variant={bmiInfo.variant}
        />
        <MetricCard
          title="Categoria"
          value={bmiInfo.category}
          icon={<User className="h-4 w-4" />}
          variant={bmiInfo.variant}
        />
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                data-testid="input-age"
                type="number"
                placeholder="25"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gênero</Label>
              <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                <SelectTrigger data-testid="select-gender">
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                data-testid="input-height"
                type="number"
                placeholder="170"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                data-testid="input-weight"
                type="number"
                placeholder="70"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="activity-level">Nível de Atividade</Label>
            <Select value={profile.activityLevel} onValueChange={(value) => setProfile({ ...profile, activityLevel: value })}>
              <SelectTrigger data-testid="select-activity-level">
                <SelectValue placeholder="Selecione o nível de atividade" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="goal">Objetivo</Label>
            <Select value={profile.goal} onValueChange={(value) => setProfile({ ...profile, goal: value })}>
              <SelectTrigger data-testid="select-goal">
                <SelectValue placeholder="Selecione seu objetivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(goalLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={saveProfile} 
            className="w-full md:w-auto" 
            data-testid="button-save-profile"
            disabled={saveProfileMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveProfileMutation.isPending ? "Salvando..." : "Salvar Perfil"}
          </Button>
        </CardContent>
      </Card>

      {/* Calculations Info */}
      <Card>
        <CardHeader>
          <CardTitle>Explicação dos Cálculos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>TMB (Taxa Metabólica Basal):</strong> O número de calorias que seu corpo precisa para manter as funções fisiológicas básicas em repouso.
            </p>
            <p>
              <strong>TDEE (Gasto Energético Diário Total):</strong> Sua TMB multiplicada pelo seu nível de atividade. Representa o total de calorias que você queima em um dia.
            </p>
            <p>
              <strong>Meta Calórica:</strong> Seu TDEE ajustado conforme seu objetivo. Ganhos Secos (+250 kcal), Ganhos Agressivos (+500 kcal), Emagrecer (-300 kcal), Emagrecer Agressivo (-500 kcal).
            </p>
            <p>
              <strong>IMC (Índice de Massa Corporal):</strong> Uma medida de gordura corporal baseada na altura e peso. Faixa normal é 18,5-24,9.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
