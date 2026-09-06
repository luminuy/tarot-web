import type { Metadata } from "next";

import {
  buildSpreadDetailMetadata,
  SpreadDetailBody,
  spreadStaticParams,
  type SpreadDetailPageProps,
} from "../../../../_shared/pages/spread-detail";

export function generateStaticParams() {
  return spreadStaticParams();
}

export function generateMetadata(props: SpreadDetailPageProps): Promise<Metadata> {
  return buildSpreadDetailMetadata(props, "en");
}

export default function Page(props: SpreadDetailPageProps) {
  return <SpreadDetailBody {...props} locale="en" />;
}
