import { Link } from "@tanstack/react-router";
import { Spade } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          className="flex items-center gap-2 font-semibold tracking-tight"
          to="/"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Spade className="size-4" />
          </span>
          Storytime Poker
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
