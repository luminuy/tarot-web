import type { Metadata } from "next";

import {
  blogDetailStaticParams,
  buildBlogDetailMetadata,
  BlogDetailBody,
  type BlogDetailPageProps,
} from "../../../../_shared/pages/blog-detail";

export function generateStaticParams() {
  return blogDetailStaticParams("en");
}

export function generateMetadata(props: BlogDetailPageProps): Promise<Metadata> {
  return buildBlogDetailMetadata(props, "en");
}

export default function Page(props: BlogDetailPageProps) {
  return <BlogDetailBody {...props} locale="en" />;
}
