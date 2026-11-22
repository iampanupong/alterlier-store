import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductAccordion } from "@/components/product/product-accordion";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { StockStatus } from "@/components/product/stock-status";
import { SectionHeading } from "@/components/section-heading";
import {
  formatPrice,
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/catalog";
import imageLoader from "@/lib/image-loader";
import { services } from "@/lib/sample-data";

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    // Resized through the image loader so crawlers don't fetch the full-resolution original.
    openGraph: {
      images: [
        { url: imageLoader({ src: product.image.src, width: 1200 }), alt: product.image.alt },
      ],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category.id);
  const images = [product.image, ...product.gallery];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: product.category.name,
    image: images.map((image) => image.src),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability:
        product.stock.status === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : product.stock.status === "low_stock"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
    },
  };

  return (
    <main id="main" className="pt-header">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="lg:grid lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery images={images} />
        </div>

        <div className="lg:col-span-5">
          <div className="px-gutter pt-6 pb-12 lg:sticky lg:top-header lg:px-12 lg:pt-10 xl:px-16">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap gap-1.5 text-caption text-muted">
                <li>
                  <Link href="/" className="link-quiet">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={product.category.href} className="link-quiet">
                    {product.category.name}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-ink">
                  {product.name}
                </li>
              </ol>
            </nav>

            <div className="mt-8 flex items-center gap-3">
              <Link href={product.category.href} className="link-quiet eyebrow">
                {product.category.name}
              </Link>
              {product.badge && (
                <span className="border border-ink px-2 py-0.5 text-caption">
                  {product.badge}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-heading lg:text-display">{product.name}</h1>
            <p className="mt-3 text-title">{formatPrice(product.price)}</p>
            <p className="mt-1 text-caption text-muted">Style {product.sku}</p>

            <div className="mt-6">
              <StockStatus stock={product.stock} />
            </div>

            <div className="mt-8">
              <PurchasePanel
                productId={product.id}
                productName={product.name}
                stock={product.stock}
              />
            </div>

            <ul className="mt-4 space-y-2 text-caption text-muted">
              {services.map((service) => (
                <li key={service.id}>
                  <Link href={service.href} className="link-quiet">
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <ProductAccordion
                sections={[
                  {
                    title: "Description",
                    defaultOpen: true,
                    content: <p className="text-pretty">{product.description}</p>,
                  },
                  {
                    title: "Details & materials",
                    content: (
                      <ul className="list-disc space-y-1 pl-4">
                        {product.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ),
                  },
                  {
                    title: "Shipping & returns",
                    content: (
                      <p className="text-pretty">
                        Complimentary express shipping on every order, delivered in our
                        signature packaging. Returns are free within 30 days of delivery.{" "}
                        <Link href="/services/returns" className="link text-ink">
                          Read the returns policy
                        </Link>
                      </p>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="related-title" className="section border-t border-line">
        <SectionHeading id="related-title" eyebrow="Discover more" title="You May Also Like" />
        <div className="grid-products border-y border-line">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
