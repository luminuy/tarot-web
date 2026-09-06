import type { Metadata } from "next";

import { buildCardsIndexMetadata, CardsIndexBody } from "../../../_shared/pages/cards-index";

export const metadata: Metadata = buildCardsIndexMetadata("en");

export default function Page() {
  return <CardsIndexBody locale="en" />;
}
