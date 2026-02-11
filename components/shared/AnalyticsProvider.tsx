"use client";

import { Analytics } from "@vercel/analytics/react";

/** Wraps Vercel Analytics with URL sanitization to never capture query params (salary, etc.) */
export function AnalyticsProvider() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        url.search = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
