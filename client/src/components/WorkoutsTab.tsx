import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, Clock, Zap, Trash2, Search } from "lucide-react";
import MetricCard from "./MetricCard";
import type { Exercise, WorkoutEntry } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WorkoutsTab() {
  const { toast } = useToast();
  const [exerciseDatabase, setExerciseDatabase] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [duration, setDuration] = useState("");
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Load workout entries from database
  const { data: workouts = [], isLoading } = useQuery<WorkoutEntry[]>({
    queryKey: ['/api/workout-entries', today],
    queryFn: async () => {
      const res = await fetch(`/api/workout-entries?date=${today}`);
      if (!res.ok) throw new Error('Failed to fetch workout entries');
      return res.json();
    }
  });

  // Add workout entry mutation
  const addWorkoutMutation = useMutation({
    mutationFn: async (entry: { exerciseName: string; category: string; duration: number; caloriesBurned: number; intensity?: string; date: string; time: string }) => {
      return await apiRequest('POST', '/api/workout-entries', entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-entries', today] });
      setSelectedExercise(null);
      setDuration("");
      toast({
        title: "Treino adicionado!",
        description: "O registro foi salvo com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: "Não foi possível salvar o treino. Tente novamente.",
      });
    }
  });

  // Delete workout entry mutation
  const deleteWorkoutMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/workout-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-entries', today] });
      toast({
        title: "Treino removido!",
      });
    },
  });

  // Load exercises from database
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async (search?: string) => {
    setIsLoadingExercises(true);
    try {
      const url = search ? `/api/exercises?search=${encodeURIComponent(search)}` : '/api/exercises';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setExerciseDatabase(data);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  // Search exercises when user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        loadExercises(searchQuery);
      } else if (searchQuery.length === 0) {
        loadExercises();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSearchQuery("");
  };

  const addWorkout = () => {
    if (selectedExercise && duration) {
      const durationMinutes = parseInt(duration);
      const caloriesBurned = Math.round(selectedExercise.caloriesPerMinute * durationMinutes);
      const now = new Date();
      
      addWorkoutMutation.mutate({
        exerciseName: selectedExercise.name,
        category: selectedExercise.category,
        duration: durationMinutes,
        caloriesBurned,
        intensity: selectedExercise.intensity,
        date: today,
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    }
  };

  const removeWorkout = (id: number) => {
    deleteWorkoutMutation.mutate(id);
  };

  const totalCaloriesBurned = workouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0);
  const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0);
  const highIntensityWorkouts = workouts.filter(w => w.intensity === 'Intenso').length;
  const averageIntensity = workouts.length > 0 ? (highIntensityWorkouts / workouts.length * 100) : 0;

  const showSearchResults = searchQuery.length >= 2 && !selectedExercise;

  if (isLoading) {
    return <div className="text-center py-8">Carregando registros...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Workout Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Calorias Queimadas"
          value={totalCaloriesBurned}
          unit="kcal"
          icon={<Zap className="h-4 w-4" />}
          variant="success"
        />
        <MetricCard
          title="Tempo Total"
          value={totalDuration}
          unit="min"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="Treinos Hoje"
          value={workouts.length}
          icon={<Dumbbell className="h-4 w-4" />}
        />
        <MetricCard
          title="Alta Intensidade"
          value={Math.round(averageIntensity)}
          unit="%"
          icon={<Zap className="h-4 w-4" />}
          variant={averageIntensity > 50 ? "success" : "default"}
        />
      </div>

      {/* Add Workout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Treino
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Exercises */}
          {!selectedExercise && (
            <div>
              <Label htmlFor="exercise-search">Buscar Exercício</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="exercise-search"
                  data-testid="input-exercise-search"
                  placeholder="Digite para buscar: corrida, musculação, yoga..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Search Results */}
              {showSearchResults && (
                <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
                  {isLoadingExercises ? (
                    <p className="text-center py-4 text-muted-foreground">Buscando...</p>
                  ) : exerciseDatabase.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Nenhum exercício encontrado</p>
                  ) : (
                    exerciseDatabase.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => selectExercise(exercise)}
                        className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                        data-testid={`button-select-exercise-${exercise.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {exercise.category} • {exercise.intensity}
                            </p>
                          </div>
                          <Badge variant="outline">{exercise.caloriesPerMinute} kcal/min</Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Exercise & Duration */}
          {selectedExercise && (
            <div className="space-y-3">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-primary">{selectedExercise.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedExercise.category}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedExercise(null);
                      setDuration("");
                    }}
                  >
                    Trocar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Intensidade</p>
                    <p className="font-medium">{selectedExercise.intensity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Queima por minuto</p>
                    <p className="font-medium">{selectedExercise.caloriesPerMinute} kcal</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="workout-duration">Duração (minutos)</Label>
                  <Input
                    id="workout-duration"
                    data-testid="input-workout-duration"
                    type="number"
                    placeholder="30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Calorias Queimadas</Label>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md font-medium">
                    {duration ? Math.round(selectedExercise.caloriesPerMinute * parseInt(duration)) : 0} kcal
                  </div>
                </div>
              </div>

              <Button 
                onClick={addWorkout} 
                className="w-full" 
                data-testid="button-add-workout"
                disabled={!duration || addWorkoutMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addWorkoutMutation.isPending ? "Adicionando..." : "Adicionar ao Diário"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workout Log */}
      <Card>
        <CardHeader>
          <CardTitle>Treinos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum treino registrado hoje
              </p>
            ) : (
              workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  data-testid={`workout-entry-${workout.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{workout.exerciseName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {workout.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {workout.duration} min • {workout.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-medium">
                      {workout.caloriesBurned} kcal
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkout(workout.id)}
                      data-testid={`button-remove-workout-${workout.id}`}
                      disabled={deleteWorkoutMutation.isPending}
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
