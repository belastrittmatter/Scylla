import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { ConsentBrandHeader } from "@/components/consent/consent-brand-header";
import { ConsentSignInRequired } from "@/components/consent/consent-sign-in-required";
import { ConsentScopeItem } from "@/components/consent/consent-scope-item";
import { ConsentScopeList } from "@/components/consent/consent-scope-list";
import { ConsentClientInfo } from "@/components/consent/consent-client-info";
import { ConsentDecisionBar } from "@/components/consent/consent-decision-bar";
import {
  countDestructiveScopes,
  initialConsentScopes,
} from "@/components/consent/consent-scopes";
import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";

describe("Consent UI Sub-components (#36 / #43)", () => {
  it("renders ConsentBrandHeader as the Scylla wordmark linking home", () => {
    const html = renderToString(<ConsentBrandHeader />);
    expect(html).toContain("Scylla");
    expect(html).toContain('href="/"');
  });

  it("renders ConsentSignInRequired with link to /auth/sign-in", () => {
    const html = renderToString(<ConsentSignInRequired />);
    expect(html).toContain("Sign In Required");
    expect(html).toMatch(/<h1[^>]*>Sign In Required<\/h1>/);
    expect(html).toContain('href="/auth/sign-in"');
    expect(html).toContain("Sign In to Continue");
  });

  it("sends sign-in back to the consent request it came from", () => {
    const returnTo = "/consent?client_id=https%3A%2F%2Fa.test&scope=openid";
    const html = renderToString(<ConsentSignInRequired returnTo={returnTo} />);
    expect(html).toContain(
      `href="/auth/sign-in?redirectTo=${encodeURIComponent(returnTo)}"`,
    );

    const offsite = renderToString(
      <ConsentSignInRequired returnTo="//evil.test/x" />,
    );
    expect(offsite).toContain('href="/auth/sign-in"');
  });

  it("renders ConsentScopeItem with title, description, and destructive badge for destructive scopes", () => {
    const readScope = ALL_MCP_CAPABILITIES.find(
      (c) => c.id === "calendar.readonly",
    )!;
    const deleteScope = ALL_MCP_CAPABILITIES.find(
      (c) => c.id === "tasks.delete",
    )!;

    const readHtml = renderToString(
      <ConsentScopeItem
        capability={readScope}
        isChecked={true}
        onToggle={() => {}}
      />,
    );
    expect(readHtml).toContain(readScope.label);
    expect(readHtml).toContain(readScope.description);
    expect(readHtml).toContain(readScope.id);
    expect(readHtml).toContain('role="switch"');
    expect(readHtml).not.toContain('role="checkbox"');
    expect(readHtml).not.toContain("Destructive");

    const deleteHtml = renderToString(
      <ConsentScopeItem
        capability={deleteScope}
        isChecked={false}
        onToggle={() => {}}
      />,
    );
    expect(deleteHtml).toContain(deleteScope.label);
    expect(deleteHtml).toContain(deleteScope.description);
    expect(deleteHtml).toContain("Destructive");
    // The destructive tag is part of the switch's accessible description.
    const tagId = deleteHtml.match(/id="([^"]+-destructive)"/)?.[1];
    expect(tagId).toBeDefined();
    expect(deleteHtml).toMatch(
      new RegExp(`aria-describedby="${tagId} [^"]+-description"`),
    );
  });

  it("renders ConsentScopeList with preset buttons, categories, and a spoken granted count", () => {
    const allScopes = ALL_MCP_CAPABILITIES.map((c) => c.id);
    const standardOnly = ALL_MCP_CAPABILITIES.filter(
      (c) => !c.isDestructive,
    ).map((c) => c.id);

    // Standard only: no destructive warning
    const standardHtml = renderToString(
      <ConsentScopeList
        selectedScopes={standardOnly}
        onToggleScope={() => {}}
        onSelectAll={() => {}}
        onSelectStandard={() => {}}
        onClearAll={() => {}}
      />,
    );
    expect(standardHtml).toContain("Grant All");
    expect(standardHtml).toContain("Standard Only");
    expect(standardHtml).toContain("Clear");
    // Least privilege leads the presets.
    expect(standardHtml.indexOf("Standard Only")).toBeLessThan(
      standardHtml.indexOf("Grant All"),
    );
    expect(standardHtml).toContain("Calendar");
    expect(standardHtml).toContain("Tasks &amp; Work");
    // Screen readers hear "n of total", not "n slash total".
    const total = ALL_MCP_CAPABILITIES.length;
    expect(standardHtml).toContain(
      `${standardOnly.length} of ${total} granted`,
    );
    // The destructive warning lives in the decision bar, not after the list.
    expect(standardHtml).not.toContain("destructive scope");

    const allHtml = renderToString(
      <ConsentScopeList
        selectedScopes={allScopes}
        onToggleScope={() => {}}
        onSelectAll={() => {}}
        onSelectStandard={() => {}}
        onClearAll={() => {}}
      />,
    );
    expect(allHtml).toContain("Grant All");
  });

  it("warns in the decision bar when the grant includes destructive scopes", () => {
    const allScopes = ALL_MCP_CAPABILITIES.map((c) => c.id);
    const standardOnly = ALL_MCP_CAPABILITIES.filter(
      (c) => !c.isDestructive,
    ).map((c) => c.id);
    const destructiveTotal = ALL_MCP_CAPABILITIES.filter(
      (c) => c.isDestructive,
    ).length;

    expect(countDestructiveScopes(standardOnly)).toBe(0);
    expect(countDestructiveScopes(allScopes)).toBe(destructiveTotal);
    expect(countDestructiveScopes(["tasks.delete"])).toBe(1);

    const bar = (destructiveCount: number) =>
      renderToString(
        <ConsentDecisionBar
          email="alex@example.com"
          grantedCount={allScopes.length}
          destructiveCount={destructiveCount}
          isLoading={false}
          error={null}
          onDeny={() => {}}
          onAllow={() => {}}
        />,
      );

    const safe = bar(0);
    expect(safe).toContain("alex@example.com");
    expect(safe).toContain("Deny Access");
    expect(safe).toContain("Allow Access");
    // The live region is mounted even when empty, so the warning is announced when it appears.
    expect(safe).toContain('role="status"');
    expect(safe).not.toContain("destructive scope");

    const risky = bar(destructiveTotal);
    expect(risky).toContain('role="status"');
    expect(risky).toMatch(/destructive scopes/);
    expect(risky).toContain("permanently delete");
    expect(bar(1)).toMatch(/destructive scope that/);
  });

  it("pre-selects nothing unless the client requested known scopes (#99)", () => {
    expect(initialConsentScopes("")).toEqual([]);
    expect(initialConsentScopes("openid profile")).toEqual([]);
    expect(
      initialConsentScopes("openid calendar.readonly bogus.scope"),
    ).toEqual(["calendar.readonly"]);
  });

  it("shows the client's self-registered name flagged as unverified (#99)", () => {
    const html = renderToString(
      <ConsentClientInfo
        client={{ name: "Acme Agent", uri: "https://acme.example/about" }}
      />,
    );
    expect(html).toContain("Acme Agent");
    expect(html).toContain("acme.example");
    expect(html).toContain("Unverified");

    const unknown = renderToString(<ConsentClientInfo client={null} />);
    expect(unknown).toContain("Unknown client");
    expect(unknown).toContain("Unverified");

    // While the lookup runs the client is not called unknown yet.
    const pending = renderToString(<ConsentClientInfo client={undefined} />);
    expect(pending).toContain("Identifying client");
    expect(pending).not.toContain("Unknown client");
    expect(pending).toContain("Unverified");
  });
});
