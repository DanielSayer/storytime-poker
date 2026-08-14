import { ROOM_LIMITS } from "@storytime-poker/domain";
import { Button } from "@storytime-poker/ui/components/button";
import { Input } from "@storytime-poker/ui/components/input";
import { useEffect, useState } from "react";

type RoundLabelProps = {
  label?: string;
  canEdit: boolean;
  onSave(label: string): Promise<void>;
};

export function RoundLabel({ label, canEdit, onSave }: RoundLabelProps) {
  const [draft, setDraft] = useState(label ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(label ?? "");
  }, [label]);

  if (!canEdit) {
    return label ? (
      <div className="mb-8 rounded-xl border bg-card p-4">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          This round
        </p>
        <p className="mt-1 font-medium">{label}</p>
      </div>
    ) : null;
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl border bg-card p-4">
      <label className="font-medium text-sm" htmlFor="round-label">
        Optional round label
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          className="h-10 rounded-lg"
          id="round-label"
          maxLength={ROOM_LIMITS.labelLength}
          placeholder="e.g. PROJ-123 - Export reports"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          className="h-10 rounded-lg"
          variant="secondary"
          disabled={isSaving}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
