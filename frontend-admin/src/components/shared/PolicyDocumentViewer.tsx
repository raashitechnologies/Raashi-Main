import React from "react";

interface PolicyDocumentViewerProps {
  content: string;
}

/**
 * Shared policy document renderer — used by both the applicant-facing modal
 * and the admin preview.  Content is treated as plain-text / Markdown-like
 * and rendered WITHOUT dangerouslySetInnerHTML to prevent XSS.
 *
 * Supported lightweight Markdown:
 *   # Heading 1   → <h2> (large)
 *   ## Heading 2  → <h3> (medium)
 *   **bold**       → <strong>
 *   - list item   → <li>
 *   blank line     → paragraph break
 */
function parseLine(line: string, index: number): React.ReactNode {
  // Heading 1
  if (line.startsWith("# ")) {
    return (
      <h2
        key={index}
        className="text-lg font-bold text-brand-navy mt-6 mb-2 first:mt-0"
      >
        {line.slice(2)}
      </h2>
    );
  }

  // Heading 2
  if (line.startsWith("## ")) {
    return (
      <h3
        key={index}
        className="text-base font-semibold text-brand-navy mt-4 mb-1.5"
      >
        {line.slice(3)}
      </h3>
    );
  }

  // Unordered list item
  if (line.startsWith("- ") || line.startsWith("• ")) {
    const text = line.slice(2);
    return (
      <li
        key={index}
        className="ml-4 text-sm text-brand-navy/75 leading-relaxed list-disc"
      >
        {renderInline(text)}
      </li>
    );
  }

  // Numbered list item (e.g. "1. text")
  const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
  if (numberedMatch) {
    return (
      <li
        key={index}
        className="ml-4 text-sm text-brand-navy/75 leading-relaxed list-decimal"
      >
        {renderInline(numberedMatch[2])}
      </li>
    );
  }

  // Empty line → spacer
  if (line.trim() === "") {
    return <div key={index} className="h-2" />;
  }

  // Regular paragraph
  return (
    <p key={index} className="text-sm text-brand-navy/75 leading-relaxed">
      {renderInline(line)}
    </p>
  );
}

/** Renders **bold** inline spans safely */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-brand-navy">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function PolicyDocumentViewer({ content }: PolicyDocumentViewerProps) {
  if (!content) {
    return (
      <p className="text-sm text-brand-navy/40 italic">
        No content available.
      </p>
    );
  }

  const lines = content.split("\n");
  let inList = false;
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const isListItem =
      line.startsWith("- ") ||
      line.startsWith("• ") ||
      /^\d+\.\s+/.test(line);

    if (isListItem && !inList) {
      // open a <ul> or <ol> — we'll use unified <ul> with list-style
      inList = true;
    } else if (!isListItem && inList) {
      inList = false;
    }

    nodes.push(parseLine(line, index));
  });

  return (
    <div className="policy-document-viewer space-y-0.5">
      {nodes}
    </div>
  );
}
