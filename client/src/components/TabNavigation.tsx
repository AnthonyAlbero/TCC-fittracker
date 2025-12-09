import { cn } from "@/lib/utils";
import { Utensils, User, Dumbbell, Calculator } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: "calories", label: "Calorias", icon: Utensils },
  { id: "profile", label: "Perfil", icon: User },
  { id: "workouts", label: "Treinos", icon: Dumbbell },
  { id: "bodyfat", label: "Gordura", icon: Calculator },
];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                console.log('Tab changed to:', tab.id);
              }}
              data-testid={`button-tab-${tab.id}`}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover-elevate",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}