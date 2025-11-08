"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight, Video } from "lucide-react";
import { HeaderBase } from "./header-base";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const leftContent = (
    <Link href="/" className="flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2">
        <Video className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xl font-medium hidden md:block">SpryVibe</span>
    </Link>
  );

  const rightContent = (
    <nav className="flex items-center gap-2">
      <div className="flex items-center gap-4">
        <Link href="/blog">
          <Button variant="text" className="text-sm p-0">
            Blog
          </Button>
        </Link>
        <Link href="/contributors">
          <Button variant="text" className="text-sm p-0">
            Contributors
          </Button>
        </Link>
      </div>
      <Link href="/projects">
        <Button size="sm" className="text-sm ml-2">
          Projects
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <ThemeToggle className="mr-2" />
    </nav>
  );

  return (
    <div className="sticky top-4 z-50 mx-4 md:mx-0">
      <HeaderBase
        className="bg-background border rounded-2xl max-w-3xl mx-auto mt-4 pl-4 pr-[11px]"
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
}
