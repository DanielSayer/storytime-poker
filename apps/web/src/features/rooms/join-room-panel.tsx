import { Button } from "@storytime-poker/ui/components/button";
import { Input } from "@storytime-poker/ui/components/input";
import { Users } from "lucide-react";
import { type FormEvent, useState } from "react";

type JoinRoomPanelProps = {
  code: string;
  onJoin(name: string): Promise<void>;
};

export function JoinRoomPanel({ code, onJoin }: JoinRoomPanelProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [isJoining, setIsJoining] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter your name to join the room.");
      return;
    }
    setError(undefined);
    setIsJoining(true);
    try {
      await onJoin(name);
    } catch {
      setError("You couldn't join with that name. Try a different name.");
      setIsJoining(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10">
      <section className="w-full rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Users className="size-5" />
        </div>
        <p className="font-medium text-muted-foreground text-sm">Room {code}</p>
        <h1 className="mt-1 font-semibold text-2xl">Join the vote</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Enter the name your team will recognise.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            className="h-11 rounded-lg px-3 text-base md:text-base"
            maxLength={30}
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button
            className="h-11 w-full rounded-lg text-sm"
            disabled={isJoining}
            type="submit"
          >
            {isJoining ? "Joining..." : "Join room"}
          </Button>
        </form>
      </section>
    </main>
  );
}
