import { parseAzureDevOpsWorkItemUrl } from "@storytime-poker/domain";
import DOMPurify from "dompurify";

export type AzureDevOpsTicket = {
  description: string;
  id: number;
  title: string;
};

export type AzureDevOpsTicketErrorKind = "access" | "request";

export class AzureDevOpsTicketError extends Error {
  constructor(readonly kind: AzureDevOpsTicketErrorKind) {
    super(kind);
  }
}

const ticketCache = new Map<string, AzureDevOpsTicket>();

export function getCachedAzureDevOpsTicket(url: string) {
  return ticketCache.get(url);
}

const DESCRIPTION_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

function descriptionAsHtml(value: unknown, workItemUrl: string) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const cleanHtml = DOMPurify.sanitize(value, {
    ALLOWED_ATTR: ["colspan", "href", "rowspan", "title"],
    ALLOWED_TAGS: DESCRIPTION_TAGS,
  });
  const document = new DOMParser().parseFromString(cleanHtml, "text/html");

  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    try {
      const href = new URL(link.getAttribute("href") ?? "", workItemUrl);
      if (href.protocol !== "http:" && href.protocol !== "https:") {
        link.removeAttribute("href");
        continue;
      }
      link.href = href.href;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
    } catch {
      link.removeAttribute("href");
    }
  }

  return document.body.innerHTML.trim();
}

export async function fetchAzureDevOpsTicket(url: string, accessToken: string) {
  const reference = parseAzureDevOpsWorkItemUrl(url);
  if (!reference) {
    throw new AzureDevOpsTicketError("request");
  }
  const cached = ticketCache.get(reference.url);
  if (cached) {
    return cached;
  }

  const apiUrl = new URL(
    `https://dev.azure.com/${encodeURIComponent(reference.organization)}/_apis/wit/workitems/${reference.id}`,
  );
  apiUrl.searchParams.set("fields", "System.Title,System.Description");
  apiUrl.searchParams.set("api-version", "7.1");

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      cache: "no-store",
      credentials: "omit",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    throw new AzureDevOpsTicketError("request");
  }
  if (
    response.status === 401 ||
    response.status === 403 ||
    response.status === 404
  ) {
    throw new AzureDevOpsTicketError("access");
  }
  if (!response.ok) {
    throw new AzureDevOpsTicketError("request");
  }

  try {
    const body = (await response.json()) as {
      fields?: Record<string, unknown>;
      id?: unknown;
    };
    const title = body.fields?.["System.Title"];
    if (typeof title !== "string" || typeof body.id !== "number") {
      throw new AzureDevOpsTicketError("request");
    }
    const ticket = {
      description: descriptionAsHtml(
        body.fields?.["System.Description"],
        reference.url,
      ),
      id: body.id,
      title: title.trim(),
    };
    ticketCache.set(reference.url, ticket);
    return ticket;
  } catch (error) {
    if (error instanceof AzureDevOpsTicketError) {
      throw error;
    }
    throw new AzureDevOpsTicketError("request");
  }
}
