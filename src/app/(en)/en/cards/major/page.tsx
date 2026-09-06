import type { Metadata } from "next";

import { buildCardGroupMetadata, CardGroupBody } from "../../../../_shared/pages/card-group";

export const metadata: Metadata = buildCardGroupMetadata("major", "en");

export default function Page() {
  return <CardGroupBody groupId="major" locale="en" />;
}
