'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { FeaturedPost } from '@/components/blog/FeaturedPost';
import { PostCard } from '@/components/blog/PostCard';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { getAllPosts, getFeaturedPost, getPostsByCategory, categories } from '@/lib/data/blog-posts';

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const featuredPost = getFeaturedPost();
  const allPosts = getAllPosts();
  const filteredPosts = getPostsByCategory(activeCategory);

  // Exclude featured post from the grid
  const gridPosts = filteredPosts.filter(post => !post.featured);

  return (
    <>
      <Navigation variant="light" />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-white py-16 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="font-heading font-bold text-4xl sm:text-5xl text-navy-900 mb-4">
                Healthcare Analytics Insights
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Expert perspectives on MSSP, risk adjustment, quality measures, and healthcare data analytics
              </p>
            </div>
          </div>
        </section>

        {/* Blog Content */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Featured Post */}
            {featuredPost && activeCategory === 'All' && (
              <FeaturedPost post={featuredPost} />
            )}

            {/* Category Filter */}
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {/* Posts Grid */}
            {gridPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {gridPosts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  No posts found in this category.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="bg-white py-16 border-t">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-bold text-3xl text-navy-900 mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Get the latest healthcare analytics insights delivered to your inbox monthly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
