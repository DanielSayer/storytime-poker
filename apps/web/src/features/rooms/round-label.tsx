import { ROOM_LIMITS } from "@storytime-poker/domain";
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
    return (
      <div>
        <span className="block text-[11px] uppercase tracking-[1px] opacity-70">
          Now estimating
        </span>
        <strong className="mt-1 block font-bold text-xl leading-[1.2] [overflow-wrap:anywhere]">
          {label || "No story selected"}
        </strong>
      </div>
    );
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
    <div>
      <label
        className="block text-[11px] uppercase tracking-[1px] opacity-70"
        htmlFor="round-label"
      >
        Now estimating{" "}
        <span className="text-[9px] normal-case tracking-normal">
          (optional)
        </span>
      </label>
      <div className="mt-1.5 flex justify-center gap-1.5">
        <input
          className="min-w-0 rounded-[10px_12px_9px_13px] border-2 border-foreground bg-card/85 px-2.5 py-2 font-semibold text-foreground text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          id="round-label"
          maxLength={ROOM_LIMITS.labelLength}
          placeholder="e.g. PROJ-123 - Export reports"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          className="cursor-pointer rounded-[9px_12px_10px_8px] border-2 border-foreground bg-card px-2.5 py-1.5 font-bold text-[11px] text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-60"
          disabled={isSaving}
          type="button"
          onClick={handleSave}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
