import { api } from "@storytime-poker/backend/convex/_generated/api";
import { normalizeRoomCode, ROOM_ERROR_CODES } from "@storytime-poker/domain";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { RoomCapacityError } from "./room-errors";
import {
  browserRoomIdentityStore,
  createParticipantIdentity,
  type RoomIdentity,
  type RoomIdentityStore,
} from "./room-identity";

function isRoomCapacityError(error: unknown) {
  if (!(error instanceof ConvexError)) {
    return false;
  }
  const data = error.data;
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    data.code === ROOM_ERROR_CODES.full
  );
}

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
  const selectStoryMutation = useMutation(api.stories.select);
  const storyLinks = useQuery(
    api.stories.list,
    identity && room?.isJoined
      ? { code, participantToken: identity.participantToken }
      : "skip",
  );

  async function join(name: string) {
    const nextIdentity = createParticipantIdentity();
    try {
      await joinRoom({
        code,
        name,
        participantToken: nextIdentity.participantToken,
      });
    } catch (error) {
      if (isRoomCapacityError(error)) {
        throw new RoomCapacityError();
      }
      throw error;
    }
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

  async function selectStory(url: string) {
    if (!identity?.facilitatorToken) {
      return;
    }
    await selectStoryMutation({
      code,
      facilitatorToken: identity.facilitatorToken,
      url,
    });
  }

  return {
    code,
    identityLoaded,
    room,
    storyLinks,
    join,
    vote,
    reveal,
    nextRound,
    saveRoundLabel,
    selectStory,
  };
}

export type RoomSession = ReturnType<typeof useRoomSession>;
