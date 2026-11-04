import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { ConsentBrandHeader } from "@/components/consent/consent-brand-header";
import { ConsentSignInRequired } from "@/components/consent/consent-sign-in-required";
import { ConsentScopeItem } from "@/components/consent/consent-scope-item";
import { ConsentScopeList } from "@/components/consent/consent-scope-list";
import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";

describe("Consent UI Sub-components (#36 / #43)", () => {
  it("renders ConsentBrandHeader with title and badge", () => {
    const html = renderToString(<ConsentBrandHeader badgeLabel="MCP Native" />);
    expect(html).toContain("Scylla");
    expect(html).toContain("MCP Native");
  });

  it("renders ConsentSignInRequired with link to /sign-in", () => {
    const html = renderToString(<ConsentSignInRequired />);
    expect(html).toContain("Sign In Required");
    expect(html).toContain('href="/sign-in"');
    expect(html).toContain("Sign In to Continue");
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
  });

  it("renders ConsentScopeList with preset buttons, categories, and destructive warning banner", () => {
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
    expect(standardHtml).toContain("Calendar");
    expect(standardHtml).toContain("Tasks &amp; Work");
    expect(standardHtml).not.toContain("Destructive Scopes Granted:");

    // All scopes (including destructive): shows warning banner
    const allHtml = renderToString(
      <ConsentScopeList
        selectedScopes={allScopes}
        onToggleScope={() => {}}
        onSelectAll={() => {}}
        onSelectStandard={() => {}}
        onClearAll={() => {}}
      />,
    );
    expect(allHtml).toContain("Destructive Scopes Granted:");
  });
});
