import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModernDashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "stats" | "analytics";
  children?: React.ReactNode;
}

export default function ModernDashboardCard({
  title,
  value,
  subtitle,
  className,
  variant = "primary",
  children
}: ModernDashboardCardProps) {
  const getCardVariant = () => {
    switch (variant) {
      case "primary":
        return "modern-card-gradient modern-card";
      case "secondary":
        return "stats-card-gradient modern-card";
      case "accent":
        return "analytics-card-gradient modern-card";
      case "stats":
        return "modern-gradient-secondary modern-card";
      case "analytics":
        return "modern-gradient-accent modern-card";
      default:
        return "modern-card-gradient modern-card";
    }
  };

  return (
    <Card className={cn(getCardVariant(), className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium opacity-90">{title}</h3>
            <div className="text-3xl font-bold">{value}</div>
            {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
          </div>
          {children && (
            <div className="opacity-80">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}