"use client";

export function TaskGithubRepoChip({ repo }: { repo: string }) {
  return (
    <div className="flex shrink-0 px-4 pt-2">
      <a
        href={`https://github.com/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        title={`Linked repository: ${repo}`}
        className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="size-3.5"
        >
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
        {repo}
      </a>
    </div>
  );
}
