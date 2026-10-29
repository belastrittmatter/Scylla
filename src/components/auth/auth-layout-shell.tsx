"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Bot, ShieldCheck } from "lucide-react";

interface AuthLayoutShellProps {
  children: React.ReactNode;
  subtitle?: string;
}

export function AuthLayoutShell({
  children,
  subtitle = "AI Agent & Workspace Meeting Orchestration",
}: AuthLayoutShellProps) {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-4 selection:bg-orange-500/20 selection:text-orange-600 sm:p-6">
      {/* Ambient background accent glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-72 w-full max-w-3xl -translate-x-1/2 bg-gradient-to-b from-orange-500/10 via-orange-500/5 to-transparent blur-3xl" />

      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Link href="/" className="group flex items-center gap-3">
          <div className="shadow-2xs flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1 transition-transform duration-200 group-hover:scale-105 dark:border-neutral-800 dark:bg-neutral-900">
            <Image
              src="/logo.svg"
              alt="Scylla Logo"
              width={32}
              height={32}
              priority
              className="size-7 object-contain dark:invert"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-xl font-bold tracking-tight">
              Scylla
            </span>
            <Badge
              variant="outline"
              className="gap-1 border-orange-500/20 bg-orange-500/10 text-[10px] font-medium text-orange-600 dark:text-orange-400"
            >
              <Bot className="size-2.5" />
              MCP Native
            </Badge>
          </div>
        </Link>
        <p className="text-muted-foreground mt-2 text-xs font-medium">
          {subtitle}
        </p>
      </div>

      {/* Main Auth Form Container */}
      <div className="w-full max-w-sm">{children}</div>

      {/* Footer Security Note */}
      <div className="text-muted-foreground mt-8 flex items-center justify-center gap-1.5 text-center text-[11px]">
        <ShieldCheck className="size-3.5 text-orange-600 dark:text-orange-400" />
        <span>Enterprise OAuth 2.1 & Google Calendar Synced</span>
      </div>
    </div>
  );
}
