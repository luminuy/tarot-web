import type { Metadata } from "next";

import {
  spreadTopicStaticParams,
  buildSpreadTopicMetadata,
  SpreadTopicBody,
  type SpreadTopicPageProps,
} from "../../../../../_shared/pages/spread-topic";

export function generateStaticParams() {
  return spreadTopicStaticParams();
}

export function generateMetadata(props: SpreadTopicPageProps): Promise<Metadata> {
  return buildSpreadTopicMetadata(props, "en");
}

export default function Page(props: SpreadTopicPageProps) {
  return <SpreadTopicBody {...props} locale="en" />;
}
