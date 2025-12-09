import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  target?: number;
  progress?: number;
  className?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "border-border",
  success: "border-chart-1 bg-chart-1/5",
  warning: "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
  destructive: "border-destructive bg-destructive/5"
};

export default function MetricCard({
  title,
  value,
  unit = "",
  target,
  progress,
  className,
  icon,
  variant = "default"
}: MetricCardProps) {
  return (
    <Card className={cn("hover-elevate", variantStyles[variant], className)} data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}{unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {target && (
          <p className="text-xs text-muted-foreground mt-1">
            Meta: {target}{unit}
          </p>
        )}
        {typeof progress === 'number' && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress.toFixed(0)}% da meta
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}