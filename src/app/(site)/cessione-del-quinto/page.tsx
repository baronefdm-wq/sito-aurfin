import type { Metadata } from "next";
import { ProductPage } from "@/components/content/product-page";
import { cessioneDelQuinto as content } from "@/content/products";

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  alternates: { canonical: `/${content.slug}` },
};

export default function Page() {
  return <ProductPage content={content} />;
}
