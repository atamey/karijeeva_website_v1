import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, Clock, User, ArrowRight, Share2 } from "lucide-react";

import Seo, { breadcrumbLd, articleLd } from "@/components/seo/Seo";
import { fetchBlogPost } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BlogCard from "@/components/marketing/BlogCard";
import ScrollReveal from "@/components/marketing/ScrollReveal";
import NewsletterSection from "@/components/marketing/NewsletterSection";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetchBlogPost(slug).then(setPost).catch(() => setPost(false));
  }, [slug]);

  if (post === false) {
    return (
      <div className="max-w-3xl mx-auto py-32 px-6 text-center">
        <h1 className="text-h2 text-brand-obsidian">Story not found.</h1>
        <Button asChild variant="primary" className="mt-6"><Link to="/blog">Back to journal</Link></Button>
      </div>
    );
  }
  if (!post) return <div className="py-40 text-center font-body text-ink-muted">Loading story…</div>;

  const prettyDate = new Date(post.published_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt}
        image={post.cover_image}
        type="article"
        jsonLd={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${slug}` },
          ]),
          articleLd(post),
        ]}
      />

      {/* Hero */}
      <section className="relative">
        <div className="aspect-[16/9] max-h-[60vh] overflow-hidden bg-brand-parchment-soft">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      </section>

      <article className="bg-brand-parchment">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Badge className="bg-brand-parchment-soft text-brand-obsidian border-0 font-body tracking-widest uppercase text-[10px]">{post.category}</Badge>
            <span className="inline-flex items-center gap-1 font-body text-xs text-ink-muted"><Clock className="w-3 h-3" /> {post.read_time_min} min read</span>
            <span className="inline-flex items-center gap-1 font-body text-xs text-ink-muted"><Calendar className="w-3 h-3" /> {prettyDate}</span>
            <span className="inline-flex items-center gap-1 font-body text-xs text-ink-muted"><User className="w-3 h-3" /> {post.author}</span>
          </div>

          <h1 className="text-h1 text-brand-obsidian leading-[1.05]" data-testid="blog-detail-title">{post.title}</h1>
          <p className="font-accent italic text-brand-husk/80 text-lg mt-5">{post.excerpt}</p>

          {/* TL;DR box */}
          {post.tldr && (
            <aside
              data-testid="blog-tldr"
              className="mt-10 p-6 rounded-lg border-2 border-dashed border-brand-gold/50 bg-white"
            >
              <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">TL;DR</p>
              <p className="font-body text-brand-husk/90 whitespace-pre-line">{post.tldr}</p>
            </aside>
          )}

          {/* Markdown body */}
          <div className="mt-12 blog-prose font-body text-brand-husk/90">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content_md}</ReactMarkdown>
          </div>

          {/* Share */}
          <div className="mt-16 pt-8 border-t border-brand-gold/20 flex items-center justify-between">
            <span className="font-body text-xs text-ink-muted uppercase tracking-[0.25em]">Enjoyed this?</span>
            <Button variant="secondary" size="sm" onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}>
              <Share2 /> Share
            </Button>
          </div>
        </div>
      </article>

      {/* Related */}
      {post.related?.length > 0 && (
        <section className="bg-brand-parchment-soft border-y border-brand-gold/15">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <ScrollReveal>
              <p className="font-accent italic text-brand-gold text-xs tracking-[0.3em] uppercase mb-3">More from the journal</p>
              <h2 className="text-h2 text-brand-obsidian mb-10">Keep reading.</h2>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {post.related.map((p, i) => (
                <ScrollReveal key={p.slug} delay={i * 80}><BlogCard post={p} /></ScrollReveal>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="dark" size="md">
                <Link to="/blog">All stories <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <NewsletterSection />
    </>
  );
}
