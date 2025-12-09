import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Ruler, Upload, Loader2, User } from "lucide-react";
import MetricCard from "./MetricCard";

interface Measurements {
  neck: string;
  waist: string;
  height: string;
  gender: string;
  age: string;
  weight: string;
}

export default function BodyFatTab() {
  const [measurements, setMeasurements] = useState<Measurements>({
    neck: "",
    waist: "",
    height: "",
    gender: "male",
    age: "",
    weight: ""
  });
  
  const [result, setResult] = useState<{ 
    manual: number; 
    ai?: number; 
    combined?: number;
    confidence?: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photos, setPhotos] = useState<{
    frontal: string | null;
    lateral: string | null;
    costas: string | null;
  }>({ frontal: null, lateral: null, costas: null });
  const frontalInputRef = useRef<HTMLInputElement>(null);
  const lateralInputRef = useRef<HTMLInputElement>(null);
  const costasInputRef = useRef<HTMLInputElement>(null);

  const calculateBodyFat = () => {
    const neck = parseFloat(measurements.neck);
    const waist = parseFloat(measurements.waist);
    const height = parseFloat(measurements.height);
    const age = parseFloat(measurements.age);
    const weight = parseFloat(measurements.weight);
    
    if (!neck || !waist || !height || !age || !weight) return 0;
    
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    const genderFactor = measurements.gender === "male" ? 1 : 0;
    const deurenbergBF = 1.20 * bmi + 0.23 * age - 10.8 * genderFactor - 5.4;
    
    let navyBF = 0;
    if (measurements.gender === "male") {
      const log10WaistNeck = Math.log10(waist - neck);
      const log10Height = Math.log10(height);
      navyBF = 495 / (1.0324 - 0.19077 * log10WaistNeck + 0.15456 * log10Height) - 450;
    } else {
      navyBF = (waist * 0.74 - neck * 0.082 - 34.89) / height * 100;
    }
    
    return (deurenbergBF + navyBF) / 2;
  };

  const getBodyFatCategory = (bodyFat: number, gender: string) => {
    if (gender === "male") {
      if (bodyFat < 6) return { category: "Gordura Essencial", variant: "destructive" as const };
      if (bodyFat < 14) return { category: "Atlético", variant: "success" as const };
      if (bodyFat < 18) return { category: "Fitness", variant: "success" as const };
      if (bodyFat < 25) return { category: "Média", variant: "default" as const };
      return { category: "Acima da Média", variant: "warning" as const };
    } else {
      if (bodyFat < 14) return { category: "Gordura Essencial", variant: "destructive" as const };
      if (bodyFat < 21) return { category: "Atlética", variant: "success" as const };
      if (bodyFat < 25) return { category: "Fitness", variant: "success" as const };
      if (bodyFat < 32) return { category: "Média", variant: "default" as const };
      return { category: "Acima da Média", variant: "warning" as const };
    }
  };

  const handlePhotoUpload = (photoType: 'frontal' | 'lateral' | 'costas') => 
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setPhotos(prev => ({ ...prev, [photoType]: base64Image }));
      };
      reader.readAsDataURL(file);
    };

  const analyzeBodyFat = async () => {
    const neck = parseFloat(measurements.neck);
    const waist = parseFloat(measurements.waist);
    const height = parseFloat(measurements.height);
    const age = parseFloat(measurements.age);
    const weight = parseFloat(measurements.weight);
    
    if (!neck || !waist || !height || !age || !weight) {
      alert('Por favor, preencha todos os campos de medição.');
      return;
    }

    setIsAnalyzing(true);
    
    // Calculate manual body fat
    const manualBF = calculateBodyFat();

    // Check if we have photos for AI analysis
    const hasPhotos = photos.frontal && photos.lateral;

    if (!hasPhotos) {
      // Only manual measurement
      setResult({ manual: manualBF });
      setIsAnalyzing(false);
      return;
    }

    // AI analysis with photos
    try {
      console.log('Starting AI body fat analysis with Gemini...');

      const images = [
        { angle: 'frontal', data: photos.frontal },
        { angle: 'lateral', data: photos.lateral }
      ];
      if (photos.costas) {
        images.push({ angle: 'costas', data: photos.costas });
      }

      const response = await fetch('/api/analyze-body-fat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          age: parseInt(measurements.age),
          height: parseInt(measurements.height),
          weight: parseFloat(measurements.weight),
          gender: measurements.gender,
          manualMeasurements: {
            neck: parseFloat(measurements.neck),
            waist: parseFloat(measurements.waist)
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha na análise de IA');
      }

      const data = await response.json();
      setResult({
        manual: manualBF,
        ai: data.bodyFatPercentage,
        combined: data.combinedEstimate,
        confidence: data.confidence
      });
      console.log('AI analysis complete:', data);
    } catch (error) {
      console.error('Error in AI analysis:', error);
      alert('Erro ao analisar as fotos. Mostrando apenas resultado manual.');
      setResult({ manual: manualBF });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const displayValue = result?.combined || result?.manual || 0;
  const bodyFatInfo = getBodyFatCategory(displayValue, measurements.gender);

  return (
    <div className="space-y-6">
      {/* Results Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Gordura Corporal"
          value={displayValue > 0 ? displayValue.toFixed(1) : "--"}
          unit="%"
          icon={<Ruler className="h-4 w-4" />}
          variant={displayValue > 0 ? bodyFatInfo.variant : "default"}
        />
        <MetricCard
          title="Categoria"
          value={displayValue > 0 ? bodyFatInfo.category : "--"}
          icon={<User className="h-4 w-4" />}
          variant={displayValue > 0 ? bodyFatInfo.variant : "default"}
        />
        <MetricCard
          title="Método"
          value={result?.combined ? "IA + Manual" : result?.manual ? "Manual" : "--"}
          icon={<Camera className="h-4 w-4" />}
          variant={result?.combined ? "success" : result?.manual ? "default" : "default"}
        />
      </div>

      {/* Unified Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Análise de Gordura Corporal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Measurements Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Dados Pessoais e Medições</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value={measurements.gender}
                  onChange={(e) => setMeasurements({ ...measurements, gender: e.target.value })}
                  data-testid="select-gender"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>
              <div>
                <Label htmlFor="age-bf">Idade (anos)</Label>
                <Input
                  id="age-bf"
                  data-testid="input-age"
                  type="number"
                  placeholder="30"
                  value={measurements.age}
                  onChange={(e) => setMeasurements({ ...measurements, age: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="height-bf">Altura (cm)</Label>
                <Input
                  id="height-bf"
                  data-testid="input-height"
                  type="number"
                  placeholder="175"
                  value={measurements.height}
                  onChange={(e) => setMeasurements({ ...measurements, height: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="weight-bf">Peso (kg)</Label>
                <Input
                  id="weight-bf"
                  data-testid="input-weight"
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={measurements.weight}
                  onChange={(e) => setMeasurements({ ...measurements, weight: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="neck">Pescoço (cm)</Label>
                <Input
                  id="neck"
                  data-testid="input-neck"
                  type="number"
                  step="0.1"
                  placeholder="38.0"
                  value={measurements.neck}
                  onChange={(e) => setMeasurements({ ...measurements, neck: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="waist">Cintura (cm)</Label>
                <Input
                  id="waist"
                  data-testid="input-waist"
                  type="number"
                  step="0.1"
                  placeholder="85.0"
                  value={measurements.waist}
                  onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Fotos para Análise com IA (opcional)</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Frontal</Label>
                {photos.frontal ? (
                  <img 
                    src={photos.frontal} 
                    alt="Frontal" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => frontalInputRef.current?.click()}
                  className="w-full"
                  data-testid="button-upload-frontal"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {photos.frontal ? 'Trocar' : 'Enviar'}
                </Button>
                <input
                  ref={frontalInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload('frontal')}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Lateral</Label>
                {photos.lateral ? (
                  <img 
                    src={photos.lateral} 
                    alt="Lateral" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => lateralInputRef.current?.click()}
                  className="w-full"
                  data-testid="button-upload-lateral"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {photos.lateral ? 'Trocar' : 'Enviar'}
                </Button>
                <input
                  ref={lateralInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload('lateral')}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Costas</Label>
                {photos.costas ? (
                  <img 
                    src={photos.costas} 
                    alt="Costas" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => costasInputRef.current?.click()}
                  className="w-full"
                  data-testid="button-upload-costas"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {photos.costas ? 'Trocar' : 'Enviar'}
                </Button>
                <input
                  ref={costasInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload('costas')}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={analyzeBodyFat}
            disabled={isAnalyzing}
            className="w-full"
            data-testid="button-analyze"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Ruler className="h-4 w-4 mr-2" />
                Analisar Gordura Corporal
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="p-4 bg-primary/10 rounded-lg space-y-3">
              <div>
                <h4 className="font-medium text-primary mb-1">Resultado da Análise</h4>
                <p className="text-3xl font-bold text-primary">{displayValue.toFixed(1)}%</p>
                <Badge 
                  variant={bodyFatInfo.variant === 'success' || bodyFatInfo.variant === 'warning' ? 'default' : bodyFatInfo.variant} 
                  className={`mt-2 ${
                    bodyFatInfo.variant === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                    bodyFatInfo.variant === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' : ''
                  }`}
                >
                  {bodyFatInfo.category}
                </Badge>
              </div>
              
              {result.combined && (
                <div className="pt-3 border-t border-primary/20 space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <strong>Método Combinado:</strong> IA (60%) + Medidas Manuais (40%)
                  </p>
                  <p className="text-muted-foreground">
                    <strong>IA:</strong> {result.ai?.toFixed(1)}% • <strong>Manual:</strong> {result.manual.toFixed(1)}%
                  </p>
                  {result.confidence && (
                    <p className="text-muted-foreground">
                      <strong>Confiança:</strong> {(result.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}
              
              {!result.combined && result.manual && (
                <p className="text-sm text-muted-foreground">
                  <strong>Método:</strong> Cálculo manual (Fórmula US Navy + Deurenberg)
                </p>
              )}
            </div>
          )}
          
          {/* Tips */}
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>📏 Como medir:</strong></p>
            <p>• <strong>Pescoço:</strong> Ao redor da parte mais larga, abaixo do pomo de adão</p>
            <p>• <strong>Cintura:</strong> Ponto mais estreito (homens) ou altura do umbigo (mulheres)</p>
            
            <p className="pt-2"><strong>📸 Fotos para maior precisão (opcional):</strong></p>
            <p>• <strong>Frontal:</strong> De frente, braços ao lado do corpo</p>
            <p>• <strong>Lateral:</strong> De lado (perfil), postura ereta</p>
            <p>• <strong>Costas:</strong> De costas (aumenta ainda mais a precisão)</p>
            <p>• Boa iluminação, roupa justa, fundo neutro</p>
            
            <p className="pt-2"><strong>💡 Como funciona:</strong></p>
            <p>• <strong>Sem fotos:</strong> Usa fórmulas científicas (US Navy + Deurenberg)</p>
            <p>• <strong>Com fotos:</strong> IA analisa visualmente + calibra com medidas = máxima precisão</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
