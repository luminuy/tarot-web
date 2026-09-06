import type { Metadata } from "next";

import { buildSpreadsIndexMetadata, SpreadsIndexBody } from "../../_shared/pages/spreads-index";

export const metadata: Metadata = buildSpreadsIndexMetadata("th");

export default function Page() {
  return <SpreadsIndexBody locale="th" />;
}
