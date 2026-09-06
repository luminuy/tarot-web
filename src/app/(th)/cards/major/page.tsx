import type { Metadata } from "next";

import { buildCardGroupMetadata, CardGroupBody } from "../../../_shared/pages/card-group";

export const metadata: Metadata = buildCardGroupMetadata("major", "th");

export default function Page() {
  return <CardGroupBody groupId="major" locale="th" />;
}
