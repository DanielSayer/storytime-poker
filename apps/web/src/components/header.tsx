import { Link } from "@tanstack/react-router";
import { Spade } from "lucide-react";

export default function Header() {
  return (
    <header className="px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto flex w-full max-w-5xl items-center">
        <Link
          aria-label="Storytime Poker home"
          className="group inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          to="/"
        >
          <span aria-hidden="true" className="relative block size-11 shrink-0">
            <span className="absolute inset-[3px] translate-x-1 rotate-6 rounded-[8px_10px_7px_9px] border-2 border-foreground bg-primary transition-transform group-hover:rotate-9" />
            <span className="absolute inset-[3px] grid -rotate-3 place-items-center rounded-[8px_10px_7px_9px] border-2 border-foreground bg-card shadow-[2px_3px_0_rgb(74_53_32_/_30%)] transition-transform group-hover:-rotate-6">
              <Spade className="size-5 fill-primary text-primary" />
            </span>
          </span>
          <span className="flex flex-col">
            <span className="font-extrabold text-lg leading-none tracking-tight">
              Storytime Poker
            </span>
            <span className="mt-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
              Estimate together
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
