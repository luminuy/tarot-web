import type { Metadata } from "next";

import "./globals.css";
import { RootHtml } from "./_shared/RootHtml";
import { NotFoundBody, notFoundMetadata } from "./_shared/pages/not-found";

export const metadata: Metadata = notFoundMetadata;

export default function GlobalNotFound() {
  return (
    <RootHtml locale="th">
      <NotFoundBody />
    </RootHtml>
  );
}
