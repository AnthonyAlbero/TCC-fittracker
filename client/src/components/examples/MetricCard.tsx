import MetricCard from '../MetricCard';
import { Flame, Target, Zap } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <MetricCard
        title="Calories Consumed"
        value={1850}
        unit="kcal"
        target={2200}
        progress={84}
        icon={<Flame className="h-4 w-4" />}
        variant="success"
      />
      <MetricCard
        title="Daily Goal"
        value={2200}
        unit="kcal"
        icon={<Target className="h-4 w-4" />}
      />
      <MetricCard
        title="Calories Burned"
        value={450}
        unit="kcal"
        icon={<Zap className="h-4 w-4" />}
        variant="warning"
      />
    </div>
  );
}