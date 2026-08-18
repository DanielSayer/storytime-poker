import { api } from "@storytime-poker/backend/convex/_generated/api";
import { Button } from "@storytime-poker/ui/components/button";
import { Card, CardContent } from "@storytime-poker/ui/components/card";
import { Input } from "@storytime-poker/ui/components/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowRight, Link2, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";

import {
  browserRoomIdentityStore,
  createFacilitatorIdentity,
  createRoomCode,
} from "@/features/rooms/room-identity";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const createRoom = useMutation(api.rooms.create);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter your name to create a room.");
      return;
    }
    setError(undefined);
    setIsCreating(true);
    const identity = createFacilitatorIdentity();
    const code = createRoomCode();
    try {
      await createRoom({
        code,
        name,
        participantToken: identity.participantToken,
        facilitatorToken: identity.facilitatorToken,
      });
      browserRoomIdentityStore.save(code, identity);
      await navigate({ to: "/room/$code", params: { code } });
    } catch {
      setError("The room could not be created. Please try again.");
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-12 sm:px-6">
      <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-muted-foreground text-sm">
            <Sparkles className="size-4" />
            Fast estimates, less ceremony
          </div>
          <h1 className="max-w-2xl text-balance font-bold text-5xl tracking-tight sm:text-6xl">
            Get your team on the same page.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
            Create a room, share the link, and reveal estimates together. No
            accounts or setup required.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-muted-foreground text-sm">
            <span>Private votes</span>
            <span>Live results</span>
            <span>Fibonacci deck</span>
          </div>
        </section>

        <Card className="rounded-2xl border bg-card/90 py-0 shadow-black/5 shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Link2 className="size-5" />
            </div>
            <h2 className="font-semibold text-2xl">Create a room</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              You’ll be the facilitator. Anyone with the link can join.
            </p>
            <form className="mt-7 space-y-4" onSubmit={handleCreate}>
              <label className="block space-y-2" htmlFor="creator-name">
                <span className="font-medium text-sm">Your name</span>
                <Input
                  className="h-11 rounded-lg px-3 text-base md:text-base"
                  id="creator-name"
                  maxLength={30}
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
              </label>
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}
              <Button
                className="h-11 w-full rounded-lg text-sm"
                disabled={isCreating}
                type="submit"
              >
                {isCreating ? "Creating room…" : "Create room"}
                {isCreating ? null : <ArrowRight />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
