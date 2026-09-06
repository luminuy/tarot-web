import type { Metadata } from "next";

import {
  buildBlogIndexMetadata,
  BlogIndexBody,
} from "../../../_shared/pages/blog-index";

export const metadata: Metadata = buildBlogIndexMetadata("en");

export default function Page() {
  return <BlogIndexBody locale="en" />;
}
