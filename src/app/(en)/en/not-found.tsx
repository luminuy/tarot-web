import type { Metadata } from "next";

import { NotFoundBody, notFoundMetadataEn } from "@/app/_shared/pages/not-found";

export const metadata: Metadata = notFoundMetadataEn;

export default function NotFound() {
  return <NotFoundBody forcedLocale="en" />;
}
