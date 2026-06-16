import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Sprout, Flame, Target, Leaf } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Carbon Coach" }] }),
  component: LeaderboardPage,
});

const ICONS: Record<string, typeof Trophy> = { Sprout, Flame, Target, Trophy, Leaf };

function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const [{ data: leaderboard }, { data: badges }, { data: { user } }] = await Promise.all([
        supabase.from("profiles").select("id,display_name,avatar_url,points,current_streak").order("points", { ascending: false }).limit(20),
        supabase.from("badges").select("*"),
        supabase.auth.getUser(),
      ]);
      const { data: mine } = await supabase.from("user_badges").select("badge_id").eq("user_id", user!.id);
      return { leaderboard: leaderboard ?? [], badges: badges ?? [], earned: new Set(mine?.map((b) => b.badge_id) ?? []), me: user!.id };
    },
  });

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Leaderboard & Badges</h1>
        <p className="text-muted-foreground text-sm">Climb the ranks by completing missions and reducing your footprint.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Top eco-warriors</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {data?.leaderboard.map((u, i) => (
              <div key={u.id} className={`flex items-center justify-between py-3 ${u.id === data.me ? "bg-primary-soft -mx-6 px-6 rounded-lg" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-sm font-medium text-muted-foreground">#{i + 1}</span>
                  <Avatar className="size-9">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback>{(u.display_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u.display_name ?? "Anonymous"}</div>
                    <div className="text-xs text-muted-foreground">🔥 {u.current_streak ?? 0} day streak</div>
                  </div>
                </div>
                <div className="text-sm font-display font-semibold">{u.points} pts</div>
              </div>
            ))}
            {data?.leaderboard.length === 0 && <p className="py-8 text-center text-muted-foreground text-sm">No players yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your badges</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data?.badges.map((b) => {
              const earned = data.earned.has(b.id);
              const Icon = ICONS[b.icon] ?? Award;
              return (
                <div key={b.id} className={`flex items-start gap-3 p-3 rounded-lg border border-border ${earned ? "" : "opacity-50"}`}>
                  <div className={`size-10 rounded-lg grid place-items-center shrink-0 ${earned ? "eco-gradient" : "bg-muted"}`}>
                    <Icon className={`size-5 ${earned ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">{b.name} {earned && <Badge variant="secondary" className="h-5">Earned</Badge>}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
