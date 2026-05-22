"use client";

import posthog from "posthog-js";
import { useEffect, useState } from "react";

import { PostHogEvent } from "@/constants/posthog-events";
import { cn } from "@/lib/utils";

interface GitHubStarBadgeProps {
  className?: string;
  label?: string;
  showCount?: boolean;
  source: string;
}

export function GitHubStarBadge({ className, label, showCount, source }: GitHubStarBadgeProps) {
  const [starCount, setStarCount] = useState<string | null>(null);

  useEffect(() => {
    if (!showCount) return;
    fetch("https://api.github.com/repos/dograh-hq/dograh")
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count != null) {
          const count = data.stargazers_count as number;
          setStarCount(count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count));
        }
      })
      .catch(() => {});
  }, [showCount]);

  const hasCount = showCount && starCount;

  return (
    <a
      href="https://ui.portalos.ru"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center rounded-md border text-sm leading-none hover:opacity-80 transition-opacity",
        className
      )}
    >
    </a>
  );
}
