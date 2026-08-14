import { api } from "@storytime-poker/backend/convex/_generated/api";
import { normalizeRoomCode } from "@storytime-poker/domain";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import {
  browserRoomIdentityStore,
  createParticipantIdentity,
  type RoomIdentity,
  type RoomIdentityStore,
} from "./room-identity";

export function useRoomSession(
  routeCode: string,
  identityStore: RoomIdentityStore = browserRoomIdentityStore,
) {
  const code = normalizeRoomCode(routeCode);
  const [storedIdentity, setStoredIdentity] = useState<{
    code: string;
    identity?: RoomIdentity;
  }>();
  const identity =
    storedIdentity?.code === code ? storedIdentity.identity : undefined;
  const identityLoaded = storedIdentity?.code === code;

  useEffect(() => {
    setStoredIdentity({ code, identity: identityStore.load(code) });
  }, [code, identityStore]);

  const room = useQuery(api.rooms.get, {
    code,
    participantToken: identity?.participantToken,
  });
  const joinRoom = useMutation(api.rooms.join);
  const submitVote = useMutation(api.rooms.vote);
  const revealVotes = useMutation(api.rooms.reveal);
  const startNextRound = useMutation(api.rooms.startNextRound);
  const updateRoundLabel = useMutation(api.rooms.updateRoundLabel);

  async function join(name: string) {
    const nextIdentity = createParticipantIdentity();
    await joinRoom({
      code,
      name,
      participantToken: nextIdentity.participantToken,
    });
    identityStore.save(code, nextIdentity);
    setStoredIdentity({ code, identity: nextIdentity });
  }

  async function vote(card: string) {
    if (!identity) {
      return;
    }
    await submitVote({
      code,
      participantToken: identity.participantToken,
      card,
    });
  }

  async function reveal() {
    if (!identity?.facilitatorToken) {
      return;
    }
    await revealVotes({ code, facilitatorToken: identity.facilitatorToken });
  }

  async function nextRound() {
    if (!identity?.facilitatorToken) {
      return;
    }
    await startNextRound({ code, facilitatorToken: identity.facilitatorToken });
  }

  async function saveRoundLabel(label: string) {
    if (!identity?.facilitatorToken) {
      return;
    }
    await updateRoundLabel({
      code,
      facilitatorToken: identity.facilitatorToken,
      label,
    });
  }

  return {
    code,
    identityLoaded,
    room,
    join,
    vote,
    reveal,
    nextRound,
    saveRoundLabel,
  };
}

export type RoomSession = ReturnType<typeof useRoomSession>;
