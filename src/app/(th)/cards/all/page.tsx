import type { Metadata } from "next";

import { buildCardsAllMetadata, CardsAllBody } from "../../../_shared/pages/cards-all";

export const metadata: Metadata = buildCardsAllMetadata("th");

export default function Page() {
  return <CardsAllBody locale="th" />;
}
