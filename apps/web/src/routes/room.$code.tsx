import { Button } from "@storytime-poker/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { JoinRoomPanel } from "@/features/rooms/join-room-panel";
import { PokerRoom } from "@/features/rooms/poker-room";
import { useRoomSession } from "@/features/rooms/use-room-session";

export const Route = createFileRoute("/room/$code")({
  component: RoomRoute,
});

function RoomRoute() {
  const { code } = Route.useParams();
  const session = useRoomSession(code);

  if (!session.identityLoaded || session.room === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading room"
        />
      </main>
    );
  }

  if (session.room === null) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="font-semibold text-3xl">Room not found</h1>
        <p className="mt-3 text-muted-foreground">
          This link may be incorrect or the room may no longer exist.
        </p>
        <Button className="mt-6 rounded-lg" render={<Link to="/" />}>
          Create a new room
        </Button>
      </main>
    );
  }

  if (!session.room.isJoined) {
    return <JoinRoomPanel code={session.code} onJoin={session.join} />;
  }

  return (
    <PokerRoom
      room={session.room}
      onVote={session.vote}
      onReveal={session.reveal}
      onNextRound={session.nextRound}
      onSaveRoundLabel={session.saveRoundLabel}
    />
  );
}
