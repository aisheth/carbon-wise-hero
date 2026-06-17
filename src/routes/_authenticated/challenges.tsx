import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, Target } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({ meta: [{ title: "Community Challenges — Carbon Coach" }] }),
  component: ChallengesPage,
});

interface ChallengeRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  goal_co2_kg: number;
  ends_at: string;
}
interface ProgressRow {
  challenge_id: string;
  participant_count: number;
  total_kg: number;
}

function ChallengesPage() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ["challenges", user?.id ?? null],
    queryFn: async () => {
      // `as any` reads are safe — RLS + GRANTs scope what we can fetch.
      const sb = supabase as unknown as {
        from: (t: string) => ReturnType<typeof supabase.from>;
        rpc: (n: string) => ReturnType<typeof supabase.rpc>;
      };
      const [{ data: challenges }, { data: progress }, { data: mine }] = await Promise.all([
        sb.from("challenges").select("*").order("ends_at"),
        sb.rpc("get_challenge_progress"),
        user
          ? sb
              .from("challenge_participants")
              .select("challenge_id,contributed_kg")
              .eq("user_id", user.id)
          : Promise.resolve({
              data: [] as Array<{ challenge_id: string; contributed_kg: number }>,
            }),
      ]);
      const progressByChallenge = new Map<string, ProgressRow>(
        ((progress ?? []) as unknown as ProgressRow[]).map((p) => [p.challenge_id, p]),
      );
      const joinedIds = new Set(
        ((mine ?? []) as unknown as Array<{ challenge_id: string }>).map((m) => m.challenge_id),
      );
      return { challenges: (challenges ?? []) as ChallengeRow[], progressByChallenge, joinedIds };
    },
  });

  async function join(challengeId: string) {
    if (!user) return;
    const { error } = await supabase
      .from("challenge_participants")
      .insert({ challenge_id: challengeId, user_id: user.id, contributed_kg: 0 });
    if (error) toast.error(error.message);
    else {
      toast.success("You're in! Track your savings via missions.");
      qc.invalidateQueries({ queryKey: ["challenges"] });
    }
  }

  async function leave(challengeId: string) {
    if (!user) return;
    const { error } = await supabase
      .from("challenge_participants")
      .delete()
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Left challenge");
      qc.invalidateQueries({ queryKey: ["challenges"] });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Community Challenges</h1>
        <p className="text-muted-foreground text-sm">
          Join collective goals and watch the community footprint shrink.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {data?.challenges.map((c) => {
          const p = data.progressByChallenge.get(c.id);
          const totalKg = Number(p?.total_kg ?? 0);
          const participants = Number(p?.participant_count ?? 0);
          const pct = Math.min(
            100,
            Math.round((totalKg / Math.max(1, Number(c.goal_co2_kg))) * 100),
          );
          const joined = data.joinedIds.has(c.id);
          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="capitalize mb-2">
                    {c.category}
                  </Badge>
                  <CardTitle>{c.name}</CardTitle>
                </div>
                <Target className="size-5 text-primary" aria-hidden />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <Progress value={pct} aria-label={`${pct}% of goal`} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {totalKg.toFixed(0)} / {Number(c.goal_co2_kg).toFixed(0)} kg CO₂ reduced
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" />
                    {participants}
                  </span>
                </div>
                {joined ? (
                  <Button variant="outline" className="w-full" onClick={() => leave(c.id)}>
                    Leave challenge
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => join(c.id)} disabled={!user}>
                    Join challenge
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {data?.challenges.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No active challenges yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
