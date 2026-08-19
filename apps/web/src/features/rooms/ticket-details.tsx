import { Button } from "@storytime-poker/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@storytime-poker/ui/components/dialog";
import { ExternalLink, Loader2 } from "lucide-react";

import { useAzureDevOpsTicket } from "./use-azure-devops-ticket";

type TicketDetailsProps = {
  id: string;
  url: string;
};

function StoryLink({ url }: { url: string }) {
  return (
    <a
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px_13px_9px_12px] border-2 border-foreground bg-card px-3.5 font-bold text-xs shadow-[2px_2px_0_rgb(74_53_32/25%)] hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary/40"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      Open in Azure DevOps
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}

function WorkItemCard({ id }: { id: string }) {
  return (
    <span
      className="relative block h-[112px] w-[206px] text-[#3f3328] transition-transform duration-150 group-hover:-translate-y-1 group-focus-visible:-translate-y-1"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 206 112"
      >
        <title>Azure DevOps work item card</title>
        <path
          d="M8 9.5Q8 5 13 5h175l10 11v82q0 7-7 7H14q-7 0-7-7z"
          fill="#fff8e7"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M188 5v10q0 4 4 4h6"
          fill="#dceeff"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path d="M8.5 9h30v95H14q-5.5 0-5.5-6z" fill="#1684ce" />
        <path
          d="M18 34h11M23.5 34v13M18 47h11M23.5 47v13M18 60h11"
          fill="none"
          stroke="#fff8e7"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle cx="18" cy="34" r="3.5" fill="#fff8e7" />
        <circle cx="29" cy="47" r="3.5" fill="#fff8e7" />
        <circle cx="18" cy="60" r="3.5" fill="#fff8e7" />
        <path
          d="M51 66h124M51 76h96M51 86h72"
          fill="none"
          stroke="#d9cbb8"
          strokeLinecap="round"
          strokeWidth="5"
        />
      </svg>
      <span className="absolute top-[16px] left-[51px] font-bold text-[9px] uppercase tracking-[1.25px] opacity-60">
        Azure DevOps
      </span>
      <strong className="absolute top-[30px] left-[50px] font-extrabold text-[25px] leading-none">
        #{id}
      </strong>
      <span className="absolute right-[14px] bottom-[10px] font-bold text-[8px] uppercase tracking-[0.8px] opacity-55">
        View details
      </span>
    </span>
  );
}

export function TicketDetails({ id, url }: TicketDetailsProps) {
  const ticket = useAzureDevOpsTicket(url);

  return (
    <Dialog>
      <DialogTrigger
        className="group cursor-pointer rounded-[13px_17px_12px_16px] font-[inherit] outline-none focus-visible:ring-4 focus-visible:ring-card/65"
        aria-label={`View Azure DevOps work item ${id}`}
      >
        <WorkItemCard id={id} />
      </DialogTrigger>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] overflow-hidden rounded-[20px_25px_18px_23px] border-2 border-foreground bg-card p-5 font-[Trebuchet_MS,Comic_Sans_MS,cursive] text-foreground shadow-[7px_7px_0_rgb(74_53_32/38%)] ring-0 sm:max-w-2xl sm:p-7">
        <DialogHeader className="border-foreground/15 border-b pr-9 pb-4">
          <p className="m-0 font-bold text-[10px] text-primary uppercase tracking-[1.2px]">
            Azure DevOps work item #{id}
          </p>
          <DialogTitle className="font-bold text-xl leading-tight sm:text-2xl">
            {ticket.status === "ready"
              ? ticket.ticket.title
              : `Work item #${id}`}
          </DialogTitle>
        </DialogHeader>

        {ticket.status === "ready" ? (
          <>
            <DialogDescription className="sr-only">
              Azure DevOps work item description
            </DialogDescription>
            {ticket.ticket.description ? (
              <div
                className="ticket-description min-h-0 overflow-y-auto pr-2 text-foreground/80 text-sm leading-relaxed sm:text-[15px]"
                // Azure DevOps returns System.Description as rich-text HTML.
                // The fetch layer sanitises it before it reaches this component.
                dangerouslySetInnerHTML={{ __html: ticket.ticket.description }}
              />
            ) : (
              <p className="m-0 text-foreground/70 text-sm">
                This work item has no description.
              </p>
            )}
          </>
        ) : null}

        {ticket.status === "loading" ? (
          <DialogDescription className="flex items-center gap-2 text-foreground/70 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading this work item with your Azure DevOps account...
          </DialogDescription>
        ) : null}

        {ticket.status === "needs-auth" ? (
          <DialogDescription className="text-foreground/75 text-sm">
            Connect your Azure DevOps account to view the title and description.
          </DialogDescription>
        ) : null}

        {ticket.status === "access-denied" ? (
          <DialogDescription className="text-foreground/75 text-sm">
            Your Azure DevOps account cannot access this work item.
          </DialogDescription>
        ) : null}

        {ticket.status === "unconfigured" ? (
          <DialogDescription className="text-foreground/75 text-sm">
            Azure DevOps access has not been configured for this app.
          </DialogDescription>
        ) : null}

        {ticket.status === "error" ? (
          <DialogDescription className="text-foreground/75 text-sm">
            This work item could not be loaded with your Azure DevOps account.
          </DialogDescription>
        ) : null}

        <DialogFooter className="mt-1 flex-row justify-end border-foreground/15 border-t pt-4">
          {ticket.status === "needs-auth" ? (
            <Button
              className="h-9 rounded-[11px_14px_10px_13px] px-4 font-bold"
              type="button"
              onClick={() => void ticket.connect()}
            >
              Connect
            </Button>
          ) : null}
          {ticket.status === "error" ? (
            <Button
              className="h-9 rounded-[11px_14px_10px_13px] px-4 font-bold"
              type="button"
              variant="outline"
              onClick={() => void ticket.connect()}
            >
              Try again
            </Button>
          ) : null}
          <StoryLink url={url} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
