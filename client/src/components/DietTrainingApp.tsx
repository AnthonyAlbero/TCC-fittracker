import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from "./ThemeToggle";
import TabNavigation from "./TabNavigation";
import CaloriesTab from "./CaloriesTab";
import ProfileTab from "./ProfileTab";
import WorkoutsTab from "./WorkoutsTab";
import BodyFatTab from "./BodyFatTab";
import { Activity } from "lucide-react";

type TabId = "calories" | "profile" | "workouts" | "bodyfat";

const tabTitles: Record<TabId, string> = {
  calories: "Controle de Calorias",
  profile: "Perfil e Estatísticas", 
  workouts: "Registro de Treinos",
  bodyfat: "Análise de Gordura Corporal"
};

export default function DietTrainingApp() {
  const [activeTab, setActiveTab] = useState<TabId>("calories");

  const renderTabContent = () => {
    switch (activeTab) {
      case "calories":
        return <CaloriesTab />;
      case "profile":
        return <ProfileTab />;
      case "workouts":
        return <WorkoutsTab />;
      case "bodyfat":
        return <BodyFatTab />;
      default:
        return <CaloriesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">FitTracker</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {tabTitles[activeTab]}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 pb-20 md:pb-4 max-w-7xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{tabTitles[activeTab]}</h2>
            <p className="text-muted-foreground">
              {activeTab === "calories" && "Registre sua alimentação diária e monitore o consumo de calorias"}
              {activeTab === "profile" && "Gerencie suas informações pessoais e calcule suas necessidades energéticas diárias"}
              {activeTab === "workouts" && "Registre seus exercícios e acompanhe as calorias queimadas nos treinos"}
              {activeTab === "bodyfat" && "Estime o percentual de gordura corporal usando medições ou análise de foto com IA"}
            </p>
          </div>
          
          {renderTabContent()}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
        <TabNavigation activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as TabId)} />
      </div>

      {/* Side Navigation - Desktop */}
      <div className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-30">
        <Card className="p-2">
          <CardContent className="p-0 space-y-2">
            {[
              { id: "calories" as TabId, icon: "🍽️", label: "Calorias" },
              { id: "profile" as TabId, icon: "👤", label: "Perfil" },
              { id: "workouts" as TabId, icon: "💪", label: "Treinos" },
              { id: "bodyfat" as TabId, icon: "📊", label: "Gordura" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`button-desktop-tab-${tab.id}`}
                className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors hover-elevate ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="text-lg mb-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}