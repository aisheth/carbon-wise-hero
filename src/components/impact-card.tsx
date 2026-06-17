import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, TreePine, Zap } from "lucide-react";
import { computeImpact } from "@/lib/impact";

/**
 * Impact Dashboard widget — translates a monthly CO₂ reduction into
 * intuitive real-world equivalents (trees, water, energy).
 */
export function ImpactCard({ co2Kg }: { co2Kg: number }) {
  const impact = computeImpact(co2Kg);
  const items: Array<{ label: string; value: string; hint: string; Icon: typeof Cloud }> = [
    { label: "CO₂ avoided", value: `${impact.co2Kg} kg`, hint: "this month", Icon: Cloud },
    {
      label: "Tree-years",
      value: `${impact.trees}`,
      hint: "absorption equivalent",
      Icon: TreePine,
    },
    {
      label: "Water saved",
      value: `${impact.waterLitres} L`,
      hint: "vs. avoided generation",
      Icon: Droplets,
    },
    { label: "Energy saved", value: `${impact.energyKwh} kWh`, hint: "grid equivalent", Icon: Zap },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map(({ label, value, hint, Icon }) => (
            <div key={label} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Icon className="size-4 text-primary" aria-hidden /> {label}
              </div>
              <div className="mt-2 text-2xl font-display font-semibold">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{hint}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
