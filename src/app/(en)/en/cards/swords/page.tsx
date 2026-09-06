import type { Metadata } from "next";

import { buildCardGroupMetadata, CardGroupBody } from "../../../../_shared/pages/card-group";

export const metadata: Metadata = buildCardGroupMetadata("swords", "en");

export default function Page() {
  return <CardGroupBody groupId="swords" locale="en" />;
}
