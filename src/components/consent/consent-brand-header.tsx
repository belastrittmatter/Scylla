"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

export function ConsentBrandHeader({ badgeLabel }: { badgeLabel: string }) {
  return (
    <Link href="/" className="group mb-6 flex items-center gap-3">
      <div className="shadow-2xs flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1 transition-transform duration-200 group-hover:scale-105 dark:border-neutral-800 dark:bg-neutral-900">
        <Image
          src="/logo.svg"
          alt="Scylla"
          width={32}
          height={32}
          className="size-7 object-contain dark:invert"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-foreground text-lg font-bold tracking-tight">
          Scylla
        </span>
        <Badge
          variant="outline"
          className="gap-1 border-orange-500/20 bg-orange-500/10 text-[10px] font-medium text-orange-600 dark:text-orange-400"
        >
          <Bot className="size-2.5" />
          {badgeLabel}
        </Badge>
      </div>
    </Link>
  );
}
