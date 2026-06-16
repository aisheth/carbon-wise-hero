import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { assess, type AssessmentInputs, type CarType, type DietType, type ShoppingHabit, type WasteHabit } from "@/lib/carbon";
import { supabase } from "@/integrations/supabase/client";
import { generateWeeklyMissions, weekStart, isoDate } from "@/lib/missions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({ meta: [{ title: "Assessment — Carbon Coach" }] }),
  component: AssessmentPage,
});

const DEFAULTS: AssessmentInputs = {
  carKmPerWeek: 100,
  carType: "gasoline",
  transitKmPerWeek: 20,
  flightHoursPerYear: 4,
  electricityKwhPerMonth: 300,
  renewableShare: 0.2,
  diet: "omnivore",
  shopping: "average",
  waste: "medium",
  recycles: true,
};

function AssessmentPage() {
  const [v, setV] = useState<AssessmentInputs>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();

  function set<K extends keyof AssessmentInputs>(k: K, val: AssessmentInputs[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function submit() {
    setSaving(true);
    try {
      const result = assess(v);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { error } = await supabase.from("assessments").insert({
        user_id: user.id,
        inputs: v as never,
        transport_kg: result.transport,
        electricity_kg: result.electricity,
        food_kg: result.food,
        shopping_kg: result.shopping,
        waste_kg: result.waste,
        total_kg: result.total,
        score: result.score,
      });
      if (error) throw error;

      // Auto-generate weekly missions if none exist this week
      const ws = isoDate(weekStart());
      const { data: existing } = await supabase
        .from("missions").select("id").eq("user_id", user.id).eq("week_start", ws).limit(1);
      if (!existing || existing.length === 0) {
        const picks = generateWeeklyMissions(
          { transport: result.transport, electricity: result.electricity, food: result.food, shopping: result.shopping, waste: result.waste },
          ws,
        );
        await supabase.from("missions").insert(
          picks.map((m) => ({
            user_id: user.id, title: m.title, description: m.description,
            category: m.category, estimated_co2_kg: m.estimatedCo2Kg, points: m.points, week_start: ws,
          })),
        );
      }

      // First-steps badge
      await supabase.from("user_badges").insert({ user_id: user.id, badge_id: "first_steps" }).then(() => {});

      toast.success(`Score: ${result.score}/100 — ${Math.round(result.total)} kg CO₂/mo`);
      qc.invalidateQueries();
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save assessment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold">Carbon Assessment</h1>
        <p className="text-muted-foreground mt-1">Five quick categories. Defaults are average for context.</p>
      </div>

      <Section title="Transportation">
        <Slide label={`Car kilometers per week: ${v.carKmPerWeek} km`} value={v.carKmPerWeek} min={0} max={1000} step={10} onChange={(n) => set("carKmPerWeek", n)} />
        <div className="space-y-2">
          <Label>Car type</Label>
          <RadioGroup value={v.carType} onValueChange={(x) => set("carType", x as CarType)} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(["none","ev","hybrid","gasoline","diesel"] as CarType[]).map((c) => (
              <label key={c} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
                <RadioGroupItem value={c} /> <span className="capitalize text-sm">{c}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <Slide label={`Transit km/week: ${v.transitKmPerWeek}`} value={v.transitKmPerWeek} min={0} max={500} step={5} onChange={(n) => set("transitKmPerWeek", n)} />
        <Slide label={`Flight hours per year: ${v.flightHoursPerYear}`} value={v.flightHoursPerYear} min={0} max={80} step={1} onChange={(n) => set("flightHoursPerYear", n)} />
      </Section>

      <Section title="Electricity">
        <div className="space-y-2">
          <Label htmlFor="kwh">Monthly home electricity (kWh)</Label>
          <Input id="kwh" type="number" min={0} value={v.electricityKwhPerMonth} onChange={(e) => set("electricityKwhPerMonth", Number(e.target.value) || 0)} />
        </div>
        <Slide label={`Renewable share: ${Math.round(v.renewableShare * 100)}%`} value={v.renewableShare * 100} min={0} max={100} step={5} onChange={(n) => set("renewableShare", n / 100)} />
      </Section>

      <Section title="Food">
        <RadioGroup value={v.diet} onValueChange={(x) => set("diet", x as DietType)} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(["vegan","vegetarian","pescatarian","omnivore","heavy_meat"] as DietType[]).map((c) => (
            <label key={c} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
              <RadioGroupItem value={c} /> <span className="capitalize text-sm">{c.replace("_", " ")}</span>
            </label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="Shopping">
        <RadioGroup value={v.shopping} onValueChange={(x) => set("shopping", x as ShoppingHabit)} className="grid grid-cols-3 gap-2">
          {(["minimal","average","frequent"] as ShoppingHabit[]).map((c) => (
            <label key={c} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
              <RadioGroupItem value={c} /> <span className="capitalize text-sm">{c}</span>
            </label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="Waste">
        <RadioGroup value={v.waste} onValueChange={(x) => set("waste", x as WasteHabit)} className="grid grid-cols-3 gap-2">
          {(["low","medium","high"] as WasteHabit[]).map((c) => (
            <label key={c} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
              <RadioGroupItem value={c} /> <span className="capitalize text-sm">{c}</span>
            </label>
          ))}
        </RadioGroup>
        <div className="flex items-center gap-3 pt-2">
          <Switch checked={v.recycles} onCheckedChange={(c) => set("recycles", c)} id="recycles" />
          <Label htmlFor="recycles">I recycle regularly</Label>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button size="lg" onClick={submit} disabled={saving}>{saving ? "Calculating…" : "Calculate my footprint"}</Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function Slide({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
