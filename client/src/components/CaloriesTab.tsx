import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Utensils } from "lucide-react";
import MetricCard from "./MetricCard";
import type { Food, FoodEntry } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CaloriesTab() {
  const { toast } = useToast();
  const [foodDatabase, setFoodDatabase] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [customPortion, setCustomPortion] = useState("");
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Load food entries from database
  const { data: foodEntries = [], isLoading } = useQuery<FoodEntry[]>({
    queryKey: ['/api/food-entries', today],
    queryFn: async () => {
      const res = await fetch(`/api/food-entries?date=${today}`);
      if (!res.ok) throw new Error('Failed to fetch food entries');
      return res.json();
    }
  });

  // Add food entry mutation
  const addFoodMutation = useMutation({
    mutationFn: async (entry: { foodName: string; calories: number; portion: number; protein?: number; carbs?: number; fat?: number; date: string; time: string }) => {
      return await apiRequest('POST', '/api/food-entries', entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food-entries', today] });
      setSelectedFood(null);
      setCustomPortion("");
      toast({
        title: "Alimento adicionado!",
        description: "O registro foi salvo com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: "Não foi possível salvar o alimento. Tente novamente.",
      });
    }
  });

  // Delete food entry mutation
  const deleteFoodMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/food-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food-entries', today] });
      toast({
        title: "Alimento removido!",
      });
    },
  });

  const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const dailyGoal = 2200;
  const progress = (totalCalories / dailyGoal) * 100;

  // Load foods from database
  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async (search?: string) => {
    setIsLoadingFoods(true);
    try {
      const url = search ? `/api/foods?search=${encodeURIComponent(search)}` : '/api/foods';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFoodDatabase(data);
      }
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setIsLoadingFoods(false);
    }
  };

  // Search foods when user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        loadFoods(searchQuery);
      } else if (searchQuery.length === 0) {
        loadFoods();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const selectFood = (food: Food) => {
    setSelectedFood(food);
    setCustomPortion(food.portion.toString());
    setSearchQuery("");
  };

  const addFood = () => {
    if (selectedFood && customPortion) {
      const portionMultiplier = parseFloat(customPortion) / selectedFood.portion;
      const now = new Date();
      
      addFoodMutation.mutate({
        foodName: `${selectedFood.name} (${customPortion}g)`,
        calories: Math.round(selectedFood.calories * portionMultiplier),
        portion: parseFloat(customPortion),
        protein: selectedFood.protein ? selectedFood.protein * portionMultiplier : undefined,
        carbs: selectedFood.carbs ? selectedFood.carbs * portionMultiplier : undefined,
        fat: selectedFood.fat ? selectedFood.fat * portionMultiplier : undefined,
        date: today,
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
  };

  const removeFood = (id: number) => {
    deleteFoodMutation.mutate(id);
  };

  const showSearchResults = searchQuery.length >= 2 && !selectedFood;

  if (isLoading) {
    return <div className="text-center py-8">Carregando registros...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Calorias Hoje"
          value={totalCalories}
          unit="kcal"
          target={dailyGoal}
          progress={progress}
          icon={<Utensils className="h-4 w-4" />}
          variant={progress > 110 ? "destructive" : progress > 90 ? "warning" : "success"}
        />
        <MetricCard
          title="Restantes"
          value={Math.max(0, dailyGoal - totalCalories)}
          unit="kcal"
          icon={<Plus className="h-4 w-4" />}
        />
        <MetricCard
          title="Refeições Registradas"
          value={foodEntries.length}
          icon={<Utensils className="h-4 w-4" />}
        />
      </div>

      {/* Add Food Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Alimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Foods */}
          {!selectedFood && (
            <div>
              <Label htmlFor="food-search">Buscar Alimento</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="food-search"
                  data-testid="input-food-search"
                  placeholder="Digite para buscar: frango, arroz, banana..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Search Results */}
              {showSearchResults && (
                <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
                  {isLoadingFoods ? (
                    <p className="text-center py-4 text-muted-foreground">Buscando...</p>
                  ) : foodDatabase.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Nenhum alimento encontrado</p>
                  ) : (
                    foodDatabase.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => selectFood(food)}
                        className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                        data-testid={`button-select-food-${food.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{food.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {food.category} • {food.portion}g
                            </p>
                          </div>
                          <Badge variant="outline">{food.calories} kcal</Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Food & Portion */}
          {selectedFood && (
            <div className="space-y-3">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-primary">{selectedFood.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedFood.category}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedFood(null);
                      setCustomPortion("");
                    }}
                  >
                    Trocar
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Calorias</p>
                    <p className="font-medium">{selectedFood.calories} kcal</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Porção padrão</p>
                    <p className="font-medium">{selectedFood.portion}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Proteína</p>
                    <p className="font-medium">{selectedFood.protein || 0}g</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="custom-portion">Sua Porção (g)</Label>
                  <Input
                    id="custom-portion"
                    data-testid="input-custom-portion"
                    type="number"
                    placeholder={selectedFood.portion.toString()}
                    value={customPortion}
                    onChange={(e) => setCustomPortion(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Calorias Calculadas</Label>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md font-medium">
                    {customPortion ? Math.round((selectedFood.calories / selectedFood.portion) * parseFloat(customPortion)) : 0} kcal
                  </div>
                </div>
              </div>

              <Button 
                onClick={addFood} 
                className="w-full" 
                data-testid="button-add-selected-food"
                disabled={!customPortion || addFoodMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addFoodMutation.isPending ? "Adicionando..." : "Adicionar ao Diário"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Food Log */}
      <Card>
        <CardHeader>
          <CardTitle>Registro Alimentar de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {foodEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum alimento registrado hoje
              </p>
            ) : (
              foodEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  data-testid={`food-entry-${entry.id}`}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{entry.foodName}</h4>
                    <p className="text-sm text-muted-foreground">{entry.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-medium">
                      {entry.calories} kcal
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFood(entry.id)}
                      data-testid={`button-remove-${entry.id}`}
                      disabled={deleteFoodMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
