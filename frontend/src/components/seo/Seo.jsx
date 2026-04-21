import { Helmet } from "react-helmet-async";

const SITE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const DEFAULT_OG =
  "https://static.prod-images.emergentagent.com/jobs/fd05c149-4e93-4435-972e-7efd90591424/images/7f8868067560a2333d0283c82b4ade885325035e1c89441e6cde6988ea0ebdd0.jpeg";

/**
 * Seo — unified head manager.
 *
 * Props:
 *  title, description, image, url
 *  type ('website' | 'article' | 'product')
 *  jsonLd — object OR array of objects. Rendered as multiple <script type="application/ld+json">.
 */
export default function Seo({
  title,
  description,
  image = DEFAULT_OG,
  url,
  type = "website",
  jsonLd,
}) {
  const fullTitle = title ? `${title} · Karijeeva` : "Karijeeva · Cold-Pressed Coconut Oil";
  const canonical = url || (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Karijeeva" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
}

// ---------- JSON-LD factories ----------
export const orgLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Karijeeva",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    "https://instagram.com/karijeeva",
    "https://facebook.com/karijeeva",
  ],
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Karijeeva",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/products?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: `${SITE_URL}${it.path || ""}`,
  })),
});

export const productLd = (product, minPrice, maxPrice) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.short_desc,
  image: product.gallery || [],
  brand: { "@type": "Brand", name: "Karijeeva" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "INR",
    lowPrice: minPrice,
    highPrice: maxPrice,
    offerCount: (product.variants || []).length,
    availability: "https://schema.org/InStock",
  },
  aggregateRating: product.avg_rating
    ? {
        "@type": "AggregateRating",
        ratingValue: product.avg_rating,
        reviewCount: product.review_count || 0,
      }
    : undefined,
});

export const articleLd = (post) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  description: post.excerpt,
  image: post.cover_image,
  author: { "@type": "Person", name: post.author },
  datePublished: post.published_at,
  dateModified: post.published_at,
  publisher: {
    "@type": "Organization",
    name: "Karijeeva",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
  },
});

export const faqLd = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});
