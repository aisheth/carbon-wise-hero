import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { generateWeeklyMissions, isoDate, weekStart } from "@/lib/missions";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Target, Upload } from "lucide-react";
import { useRef } from "react";

export const Route = createFileRoute("/_authenticated/missions")({
  head: () => ({ meta: [{ title: "Weekly Missions — Carbon Coach" }] }),
  component: MissionsPage,
});

function MissionsPage() {
  const qc = useQueryClient();
  const ws = isoDate(weekStart());

  const { data, isLoading } = useQuery({
    queryKey: ["missions", ws],
    queryFn: async () => {
      const { data: missions } = await supabase
        .from("missions")
        .select("*")
        .eq("week_start", ws)
        .order("created_at");
      const { data: latest } = await supabase
        .from("assessments")
        .select("transport_kg,electricity_kg,food_kg,shopping_kg,waste_kg")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { missions: missions ?? [], latest };
    },
  });

  async function generate() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (!data?.latest) {
      toast.error("Take the assessment first");
      return;
    }
    const picks = generateWeeklyMissions(
      {
        transport: Number(data.latest.transport_kg),
        electricity: Number(data.latest.electricity_kg),
        food: Number(data.latest.food_kg),
        shopping: Number(data.latest.shopping_kg),
        waste: Number(data.latest.waste_kg),
      },
      ws,
    );
    const { error } = await supabase.from("missions").insert(
      picks.map((m) => ({
        user_id: user.id,
        title: m.title,
        description: m.description,
        category: m.category,
        estimated_co2_kg: m.estimatedCo2Kg,
        points: m.points,
        week_start: ws,
      })),
    );
    if (error) toast.error(error.message);
    else {
      toast.success("New missions ready!");
      qc.invalidateQueries({ queryKey: ["missions", ws] });
    }
  }

  async function toggle(id: string, completed: boolean, points: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("missions")
      .update({
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (!completed) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .maybeSingle();
      await supabase
        .from("profiles")
        .update({
          points: (prof?.points ?? 0) + points,
          last_active_date: new Date().toISOString().slice(0, 10),
        })
        .eq("id", user.id);
      toast.success(`+${points} eco points`);
    }
    qc.invalidateQueries();
  }

  /**
   * Uploads a user-provided proof file (photo, screenshot) for a completed
   * mission to the private `mission-proofs` bucket and stores its path on
   * the mission row with `verification_status = 'pending'`.
   */
  async function uploadProof(missionId: string, file: File) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${missionId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("mission-proofs")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const { error } = await (supabase as any)
      .from("missions")
      .update({ proof_url: path, verification_status: "pending" })
      .eq("id", missionId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Proof uploaded — pending verification");
    qc.invalidateQueries({ queryKey: ["missions", ws] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Weekly Eco Missions</h1>
          <p className="text-muted-foreground text-sm">Week of {ws}</p>
        </div>
        {data?.missions.length === 0 && (
          <Button onClick={generate}>Generate this week's missions</Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : data?.missions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="size-10 mx-auto text-primary mb-3" />
            <h3 className="font-display font-semibold">No missions yet</h3>
            <p className="text-sm text-muted-foreground">
              Generate three personalized goals for the week.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.missions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m as MissionRow}
              onToggle={toggle}
              onUploadProof={uploadProof}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MissionRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  estimated_co2_kg: number;
  points: number;
  completed: boolean;
  proof_url?: string | null;
  verification_status?: "unverified" | "pending" | "approved" | "rejected" | null;
}

function MissionCard({
  mission: m,
  onToggle,
  onUploadProof,
}: {
  mission: MissionRow;
  onToggle: (id: string, completed: boolean, points: number) => void;
  onUploadProof: (id: string, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const status = m.verification_status ?? "unverified";
  return (
    <Card className={m.completed ? "opacity-90" : ""}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <Badge variant="secondary" className="capitalize">
          {m.category}
        </Badge>
        <Checkbox
          checked={m.completed}
          onCheckedChange={() => onToggle(m.id, m.completed, m.points)}
          aria-label="Mark complete"
        />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-base flex items-start gap-2">
          {m.completed && <CheckCircle2 className="size-4 text-success mt-0.5" />}
          {m.title}
        </CardTitle>
        {m.description && <p className="text-sm text-muted-foreground mt-2">{m.description}</p>}
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-primary font-medium">
            ~{Number(m.estimated_co2_kg)} kg CO₂ saved
          </span>
          <span className="text-muted-foreground">+{m.points} pts</span>
        </div>
        {m.completed && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <VerificationBadge status={status} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadProof(m.id, f);
              }}
              aria-label="Upload proof image"
            />
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3" /> {m.proof_url ? "Replace proof" : "Add proof"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    unverified: { label: "Unverified", variant: "outline" },
    pending: { label: "Pending review", variant: "secondary" },
    approved: { label: "Verified", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
  };
  const v = map[status] ?? map.unverified;
  return (
    <Badge variant={v.variant} className="gap-1">
      <ShieldCheck className="size-3" /> {v.label}
    </Badge>
  );
}
