import { ROOM_CODE_CHARACTERS, ROOM_LIMITS } from "@storytime-poker/domain";

export type RoomIdentity = {
  participantToken: string;
  facilitatorToken?: string;
};

export type FacilitatorIdentity = RoomIdentity & {
  facilitatorToken: string;
};

export interface RoomIdentityStore {
  load(code: string): RoomIdentity | undefined;
  save(code: string, identity: RoomIdentity): void;
}

function identityKey(code: string) {
  return `storytime-poker:${code}`;
}

export const browserRoomIdentityStore: RoomIdentityStore = {
  load(code) {
    try {
      const stored = localStorage.getItem(identityKey(code));
      return stored ? (JSON.parse(stored) as RoomIdentity) : undefined;
    } catch {
      return undefined;
    }
  },
  save(code, identity) {
    localStorage.setItem(identityKey(code), JSON.stringify(identity));
  },
};

export function createParticipantIdentity(): RoomIdentity {
  return { participantToken: crypto.randomUUID() };
}

export function createFacilitatorIdentity(): FacilitatorIdentity {
  return {
    participantToken: crypto.randomUUID(),
    facilitatorToken: crypto.randomUUID(),
  };
}

export function createRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_LIMITS.codeLength));
  return Array.from(
    bytes,
    (byte) => ROOM_CODE_CHARACTERS[byte % ROOM_CODE_CHARACTERS.length],
  ).join("");
}
