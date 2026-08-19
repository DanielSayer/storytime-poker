import { useCallback, useEffect, useState } from "react";

import {
  acquireAzureDevOpsToken,
  isAzureDevOpsConfigured,
} from "./azure-devops-auth";
import {
  type AzureDevOpsTicket,
  AzureDevOpsTicketError,
  fetchAzureDevOpsTicket,
  getCachedAzureDevOpsTicket,
} from "./azure-devops-ticket";

type TicketState =
  | { status: "empty" | "loading" | "needs-auth" | "unconfigured" }
  | { status: "ready"; ticket: AzureDevOpsTicket }
  | { status: "access-denied" | "error" };

function stateForError(error: unknown): TicketState {
  return error instanceof AzureDevOpsTicketError && error.kind === "access"
    ? { status: "access-denied" }
    : { status: "error" };
}

export function useAzureDevOpsTicket(url: string | undefined) {
  const [state, setState] = useState<TicketState>({ status: "empty" });

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setState({ status: "empty" });
      return () => {
        cancelled = true;
      };
    }
    const cached = getCachedAzureDevOpsTicket(url);
    if (cached) {
      setState({ status: "ready", ticket: cached });
      return () => {
        cancelled = true;
      };
    }
    if (!isAzureDevOpsConfigured()) {
      setState({ status: "unconfigured" });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: "loading" });
    void (async () => {
      try {
        const token = await acquireAzureDevOpsToken(false);
        if (!token) {
          if (!cancelled) {
            setState({ status: "needs-auth" });
          }
          return;
        }
        const ticket = await fetchAzureDevOpsTicket(url, token);
        if (!cancelled) {
          setState({ status: "ready", ticket });
        }
      } catch (error) {
        if (!cancelled) {
          setState(stateForError(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const connect = useCallback(async () => {
    if (!url || !isAzureDevOpsConfigured()) {
      return;
    }
    setState({ status: "loading" });
    try {
      const token = await acquireAzureDevOpsToken(true);
      if (!token) {
        setState({ status: "needs-auth" });
        return;
      }
      const ticket = await fetchAzureDevOpsTicket(url, token);
      setState({ status: "ready", ticket });
    } catch (error) {
      setState(stateForError(error));
    }
  }, [url]);

  return { ...state, connect };
}
