import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PostHeader } from '@/components/blog/PostHeader';
import { MarkdownContent } from '@/components/blog/MarkdownContent';
import { AuthorBox } from '@/components/blog/AuthorBox';
import { CTASection } from '@/components/marketing/CTASection';
import { getPostBySlug, getAllPosts } from '@/lib/data/blog-posts';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: PageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Navigation variant="light" />
      <main className="min-h-screen bg-white">
        {/* Article Content */}
        <article className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <PostHeader post={post} />
            <MarkdownContent content={post.content} />
            <AuthorBox author={post.author} />
          </div>
        </article>

        {/* CTA Section */}
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
