import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { simulateChange, type AssessmentInputs, type DietType } from "@/lib/carbon";
import { TrendingDown, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/simulator")({
  head: () => ({ meta: [{ title: "Simulator — Carbon Coach" }] }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["latest-assessment"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data)
    return <p className="text-muted-foreground">Take the assessment first to simulate changes.</p>;

  return (
    <SimulatorInner
      base={data.inputs as unknown as AssessmentInputs}
      baseTotal={Number(data.total_kg)}
    />
  );
}

function SimulatorInner({ base, baseTotal }: { base: AssessmentInputs; baseTotal: number }) {
  const [patch, setPatch] = useState<Partial<AssessmentInputs>>({});
  const merged: AssessmentInputs = { ...base, ...patch };
  const result = useMemo(() => simulateChange(base, patch), [base, patch]);
  const diff = baseTotal - result.total;
  const pct = baseTotal > 0 ? Math.round((diff / baseTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Carbon Savings Simulator</h1>
        <p className="text-muted-foreground text-sm">
          Tweak any habit and see the impact in real time.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Try a change</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Car km/week: {merged.carKmPerWeek}</Label>
              <Slider
                value={[merged.carKmPerWeek]}
                min={0}
                max={1000}
                step={10}
                onValueChange={(v) => setPatch({ ...patch, carKmPerWeek: v[0] })}
              />
            </div>
            <div className="space-y-2">
              <Label>Electricity kWh/month: {merged.electricityKwhPerMonth}</Label>
              <Slider
                value={[merged.electricityKwhPerMonth]}
                min={0}
                max={1000}
                step={10}
                onValueChange={(v) => setPatch({ ...patch, electricityKwhPerMonth: v[0] })}
              />
            </div>
            <div className="space-y-2">
              <Label>Renewable share: {Math.round(merged.renewableShare * 100)}%</Label>
              <Slider
                value={[merged.renewableShare * 100]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setPatch({ ...patch, renewableShare: v[0] / 100 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Diet</Label>
              <RadioGroup
                value={merged.diet}
                onValueChange={(x) => setPatch({ ...patch, diet: x as DietType })}
                className="grid grid-cols-3 gap-2"
              >
                {(["vegan", "vegetarian", "omnivore"] as DietType[]).map((c) => (
                  <label
                    key={c}
                    className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted"
                  >
                    <RadioGroupItem value={c} /> <span className="capitalize text-sm">{c}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={merged.recycles}
                onCheckedChange={(c) => setPatch({ ...patch, recycles: c })}
                id="sim-recycle"
              />
              <Label htmlFor="sim-recycle">Start recycling</Label>
            </div>
            <Button variant="outline" onClick={() => setPatch({})}>
              Reset
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projected impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Current" value={`${baseTotal.toFixed(0)} kg`} />
              <Stat label="Projected" value={`${result.total.toFixed(0)} kg`} />
            </div>
            <div className="rounded-xl bg-primary-soft p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                <TrendingDown className="size-4" /> Estimated monthly change
              </div>
              <div
                className={`text-4xl font-display font-semibold mt-2 ${diff >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {diff >= 0 ? "−" : "+"}
                {Math.abs(diff).toFixed(0)} kg
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {Math.abs(pct)}% {diff >= 0 ? "lower" : "higher"} •{" "}
                {Math.round(Math.abs(diff) * 12)} kg per year
              </div>
            </div>
            {result.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Top suggestions</h4>
                <ul className="space-y-2">
                  {result.recommendations.slice(0, 3).map((r, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <ArrowRight className="size-4 text-primary shrink-0 mt-0.5" />{" "}
                      <span>{r.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-display font-semibold mt-1">{value}</div>
    </div>
  );
}
