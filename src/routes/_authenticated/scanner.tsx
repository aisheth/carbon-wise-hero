import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseReceiptText, totalReceiptImpact } from "@/lib/receipt";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scanner")({
  head: () => ({ meta: [{ title: "Receipt Scanner — Carbon Coach" }] }),
  component: ScannerPage,
});

const SAMPLE = `Whole Foods Market\n  Organic Apples 2.50\n  Beef Ribeye Steak 18.99\n  Almond Milk 3.49\n  Sourdough Bread 4.50\n  Cheddar Cheese 6.20\n  Tomatoes 1.99\nTotal 37.67`;

function ScannerPage() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<ReturnType<typeof parseReceiptText>>([]);
  const total = totalReceiptImpact(items);

  function analyze() {
    const parsed = parseReceiptText(text);
    setItems(parsed);
    if (parsed.length === 0) toast.message("No recognized items — try the sample receipt.");
  }

  async function save() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("receipts").insert({
      user_id: user.id,
      ocr_text: text,
      items: items as never,
      estimated_co2_kg: total,
    });
    if (error) toast.error(error.message);
    else toast.success(`Saved — ${total} kg CO₂e logged`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Receipt Scanner</h1>
        <p className="text-muted-foreground text-sm">
          Paste receipt text (or upload an OCR-extracted text file) to estimate the carbon impact of
          your purchases.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipt text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your receipt here…"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={analyze} className="gap-2">
                <ScanLine className="size-4" /> Analyze
              </Button>
              <Button variant="outline" onClick={() => setText(SAMPLE)}>
                Try sample
              </Button>
              <label className="inline-flex items-center gap-2 cursor-pointer border border-input rounded-md px-3 py-2 text-sm hover:bg-muted">
                <Upload className="size-4" /> Upload .txt
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setText(await f.text());
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Real OCR (image scanning) requires a cloud OCR service. For now, paste text from
              your receipt app or use the sample.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Estimated impact</CardTitle>
            {items.length > 0 && (
              <Button size="sm" variant="outline" onClick={save}>
                Save to history
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Items will appear here after analysis.
              </p>
            ) : (
              <>
                <div className="rounded-xl bg-primary-soft p-4 mb-4 text-center">
                  <div className="text-xs text-muted-foreground">Total estimated CO₂e</div>
                  <div className="text-3xl font-display font-semibold text-primary mt-1">
                    {total} kg
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className="capitalize">
                          {it.category}
                        </Badge>
                        <span className="text-sm truncate">{it.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{it.co2Kg} kg</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
