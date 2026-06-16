import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ArrowRight, Flame, Leaf, TrendingDown, Trophy } from "lucide-react";
import { format, subMonths } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Carbon Coach" }] }),
  component: DashboardPage,
});

const CHART_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#84cc16", "#06b6d4"];

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [{ data: profile }, { data: assessments }, { data: missions }] = await Promise.all([
        supabase.from("profiles").select("*").maybeSingle(),
        supabase.from("assessments").select("*").order("created_at", { ascending: false }).limit(6),
        supabase.from("missions").select("*").eq("completed", false).limit(3),
      ]);
      return { profile, assessments: assessments ?? [], missions: missions ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const latest = data?.assessments[0];
  if (!latest) {
    return <EmptyState />;
  }

  const breakdown = [
    { name: "Transport", value: Number(latest.transport_kg) },
    { name: "Electricity", value: Number(latest.electricity_kg) },
    { name: "Food", value: Number(latest.food_kg) },
    { name: "Shopping", value: Number(latest.shopping_kg) },
    { name: "Waste", value: Number(latest.waste_kg) },
  ];
  const trend = [...(data?.assessments ?? [])]
    .reverse()
    .map((a) => ({ month: format(new Date(a.created_at), "MMM d"), total: Number(a.total_kg) }));
  while (trend.length < 6) {
    trend.unshift({ month: format(subMonths(new Date(), 6 - trend.length), "MMM"), total: 0 });
  }
  const biggest = [...breakdown].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hi {data?.profile?.display_name ?? "there"} 👋</p>
          <h1 className="text-3xl font-semibold">Your carbon dashboard</h1>
        </div>
        <Link to="/assessment"><Button variant="outline">Retake assessment</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Leaf} label="Monthly footprint" value={`${Number(latest.total_kg).toFixed(0)} kg CO₂e`} hint="kilograms per month" />
        <StatCard icon={TrendingDown} label="Eco score" value={`${latest.score}/100`} hint={scoreLabel(latest.score)}>
          <Progress value={latest.score} className="mt-3" />
        </StatCard>
        <StatCard icon={Flame} label="Streak" value={`${data?.profile?.current_streak ?? 0} days`} hint={`${data?.profile?.points ?? 0} eco points`}>
          <Trophy className="size-4 text-warning inline-block mr-1" />
          <span className="text-xs text-muted-foreground">Longest: {data?.profile?.longest_streak ?? 0} days</span>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 160)" />
                  <XAxis dataKey="month" stroke="currentColor" fontSize={12} />
                  <YAxis stroke="currentColor" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Where it comes from</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {breakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Biggest source: <span className="text-foreground font-medium">{biggest.name}</span> ({biggest.value.toFixed(0)} kg)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>This week's missions</CardTitle>
          <Link to="/missions"><Button variant="ghost" size="sm" className="gap-1">All missions <ArrowRight className="size-4" /></Button></Link>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          {data?.missions.length ? data.missions.map((m) => (
            <div key={m.id} className="rounded-lg border border-border p-4">
              <Badge variant="secondary" className="mb-2 capitalize">{m.category}</Badge>
              <h4 className="font-medium">{m.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">Save ~{Number(m.estimated_co2_kg)} kg CO₂</p>
            </div>
          )) : (
            <div className="sm:col-span-3 text-sm text-muted-foreground">
              No active missions. <Link to="/missions" className="text-primary underline">Generate this week's set</Link>.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, children }: { icon: typeof Leaf; label: string; value: string; hint?: string; children?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Icon className="size-4 text-primary" /> {label}
        </div>
        <div className="mt-2 text-3xl font-display font-semibold">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        {children}
      </CardContent>
    </Card>
  );
}

function scoreLabel(n: number) {
  if (n >= 80) return "Excellent — keep going!";
  if (n >= 60) return "Great — small wins ahead";
  if (n >= 40) return "Plenty of room to improve";
  return "High footprint — start with one habit";
}

function EmptyState() {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div className="size-14 mx-auto rounded-2xl eco-gradient grid place-items-center mb-4">
        <Leaf className="size-7 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-display font-semibold">Welcome to Carbon Coach</h2>
      <p className="text-muted-foreground mt-2">Take the 2-minute assessment to see your monthly footprint and get a personalized plan.</p>
      <Link to="/assessment"><Button className="mt-6">Start assessment</Button></Link>
    </div>
  );
}
