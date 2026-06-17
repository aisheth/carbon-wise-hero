import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Leaf, ArrowRight, Sparkles, Target, BarChart3, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carbon Coach — Track and shrink your carbon footprint" },
      {
        name: "description",
        content:
          "AI-powered carbon footprint tracking, weekly eco missions, and personalized strategies to live a low-carbon life.",
      },
      { property: "og:title", content: "Carbon Coach — Track and shrink your carbon footprint" },
      {
        property: "og:description",
        content:
          "AI-powered carbon footprint tracking, weekly eco missions, and personalized strategies to live a low-carbon life.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-xl eco-gradient grid place-items-center">
              <Leaf className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">Carbon Coach</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-sm text-foreground/80 mb-6">
            <Sparkles className="size-3.5 text-primary" />
            Your personal AI sustainability coach
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight max-w-4xl mx-auto">
            Shrink your footprint, <span className="text-primary">one habit at a time.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Carbon Coach measures your monthly CO₂ across transport, energy, food, shopping, and
            waste — then turns it into a clear plan you'll actually stick to.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Start your assessment <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </a>
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-24 h-72 eco-gradient opacity-20 blur-3xl"
        />
      </section>

      <section id="features" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Feature
            icon={BarChart3}
            title="Know your number"
            body="A 2-minute lifestyle check gives you a clear monthly kg CO₂e, broken down by category."
          />
          <Feature
            icon={Target}
            title="Weekly Eco Missions"
            body="Three personalized goals every week with estimated CO₂ savings and streak tracking."
          />
          <Feature
            icon={ScanLine}
            title="Receipt scanner"
            body="Snap a grocery receipt and instantly see the carbon impact of what you bought."
          />
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Carbon Coach. Built with sustainability in mind.
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Leaf; title: string; body: string }) {
  return (
    <div className="card-soft p-6">
      <div className="size-10 rounded-xl bg-primary-soft grid place-items-center mb-4">
        <Icon className="size-5 text-primary" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
