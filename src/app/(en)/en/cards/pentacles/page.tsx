import type { Metadata } from "next";

import { buildCardGroupMetadata, CardGroupBody } from "../../../../_shared/pages/card-group";

export const metadata: Metadata = buildCardGroupMetadata("pentacles", "en");

export default function Page() {
  return <CardGroupBody groupId="pentacles" locale="en" />;
}
