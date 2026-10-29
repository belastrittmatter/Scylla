"use client";

import * as React from "react";
import {
  extractData,
  type McpViewType,
} from "@/components/mcp-ui/mcp-ui-types";

export * from "@/components/mcp-ui/mcp-ui-types";

declare global {
  interface Window {
    __MCP_VIEW__?: McpViewType;
    __MCP_DATA__?: unknown;
    callTool?: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
    askAi?: (text: string) => void;
  }
}

interface PendingRpc {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export function useMcpBridge<T>(initialData?: unknown): {
  data: T | null;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  callTool: <R = unknown>(
    name: string,
    args: Record<string, unknown>,
  ) => Promise<R>;
  askAi: (text: string) => void;
} {
  const [data, setData] = React.useState<T | null>(() => {
    const raw =
      initialData ??
      (typeof window !== "undefined" ? window.__MCP_DATA__ : null);
    return extractData<T>(raw);
  });
  const rpcIdRef = React.useRef(10);
  const pendingRef = React.useRef<Map<number, PendingRpc>>(new Map());

  const callTool = React.useCallback(
    <R = unknown>(name: string, args: Record<string, unknown>) => {
      return new Promise<R>((resolve, reject) => {
        const id = ++rpcIdRef.current;
        const timer = setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            reject(new Error(`Host timeout (15s) calling ${name}`));
          }
        }, 15000);
        pendingRef.current.set(id, {
          resolve: resolve as (v: unknown) => void,
          reject,
          timer,
        });
        try {
          window.parent.postMessage(
            {
              jsonrpc: "2.0",
              id,
              method: "tools/call",
              params: { name, arguments: args },
            },
            "*",
          );
        } catch (err) {
          clearTimeout(timer);
          pendingRef.current.delete(id);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    },
    [],
  );

  const askAi = React.useCallback((text: string) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {
      // clipboard fallback ignored in strict sandbox
    }
    try {
      window.parent.postMessage(
        {
          jsonrpc: "2.0",
          id: ++rpcIdRef.current,
          method: "ui/message",
          params: { role: "user", content: [{ type: "text", text }] },
        },
        "*",
      );
    } catch {
      // ignore if outside iframe
    }
  }, []);

  React.useEffect(() => {
    window.callTool = callTool;
    window.askAi = askAi;

    const onMessage = (e: MessageEvent) => {
      const msg = e.data as Record<string, unknown> | undefined;
      if (!msg || typeof msg !== "object") return;
      const msgId = typeof msg.id === "number" ? msg.id : undefined;

      if (msgId && pendingRef.current.has(msgId)) {
        const pending = pendingRef.current.get(msgId)!;
        clearTimeout(pending.timer);
        pendingRef.current.delete(msgId);
        const errObj = msg.error as { message?: string } | undefined;
        const resObj = msg.result as
          { isError?: boolean; content?: { text?: string }[] } | undefined;
        if (errObj || resObj?.isError) {
          pending.reject(
            new Error(
              errObj?.message ||
                resObj?.content?.[0]?.text ||
                "Tool call failed",
            ),
          );
        } else {
          pending.resolve(msg.result);
        }
        return;
      }

      if (msgId === 1 && msg.result !== undefined) {
        try {
          window.parent.postMessage(
            {
              jsonrpc: "2.0",
              method: "ui/notifications/initialized",
              params: {},
            },
            "*",
          );
        } catch {
          // ignore
        }
      }

      const incoming = extractData<T>(msg);
      if (incoming) setData(incoming);
    };

    window.addEventListener("message", onMessage);
    try {
      window.parent.postMessage(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "ui/initialize",
          params: {
            protocolVersion: "2026-01-26",
            appInfo: {
              name: "scylla-calendar-tasks-mcp-app",
              version: "1.0.0",
            },
            appCapabilities: {},
          },
        },
        "*",
      );
    } catch {
      // ignore
    }
    const pendingMap = pendingRef.current;
    return () => {
      window.removeEventListener("message", onMessage);
      for (const pending of pendingMap.values()) {
        clearTimeout(pending.timer);
      }
      pendingMap.clear();
    };
  }, [callTool, askAi]);

  return { data, setData, callTool, askAi };
}
