import type { Metadata } from "next";

import { buildCardGroupMetadata, CardGroupBody } from "../../../../_shared/pages/card-group";

export const metadata: Metadata = buildCardGroupMetadata("cups", "en");

export default function Page() {
  return <CardGroupBody groupId="cups" locale="en" />;
}
