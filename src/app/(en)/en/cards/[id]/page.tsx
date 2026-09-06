import type { Metadata } from "next";

import {
  buildCardDetailMetadata,
  CardDetailBody,
  cardStaticParams,
  type CardDetailPageProps,
} from "../../../../_shared/pages/card-detail";

export function generateStaticParams() {
  return cardStaticParams();
}

export function generateMetadata(props: CardDetailPageProps): Promise<Metadata> {
  return buildCardDetailMetadata(props, "en");
}

export default function Page(props: CardDetailPageProps) {
  return <CardDetailBody {...props} locale="en" />;
}
