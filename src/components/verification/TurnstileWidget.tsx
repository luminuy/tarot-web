"use client";

import React, { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  siteKey?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "compact" | "invisible";
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  siteKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectiveSiteKey = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!effectiveSiteKey || !containerRef.current) return;

    // Load Turnstile script dynamically if not present
    if (!window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoaded";
      script.async = true;
      script.defer = true;

      window.onTurnstileLoaded = () => {
        if (containerRef.current && window.turnstile) {
          window.turnstile.render(containerRef.current, {
            sitekey: effectiveSiteKey,
            callback: onVerify,
            "error-callback": onError,
            theme: "dark",
            size: "invisible",
          });
        }
      };

      document.head.appendChild(script);
    } else {
      window.turnstile.render(containerRef.current, {
        sitekey: effectiveSiteKey,
        callback: onVerify,
        "error-callback": onError,
        theme: "dark",
        size: "invisible",
      });
    }
  }, [effectiveSiteKey, onVerify, onError]);

  if (!effectiveSiteKey) return null;

  return <div ref={containerRef} className="hidden" />;
};
