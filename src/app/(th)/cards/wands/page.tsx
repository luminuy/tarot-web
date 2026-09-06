import type { Metadata } from "next";

import { buildCardGroupMetadata, CardGroupBody } from "../../../_shared/pages/card-group";

export const metadata: Metadata = buildCardGroupMetadata("wands", "th");

export default function Page() {
  return <CardGroupBody groupId="wands" locale="th" />;
}
