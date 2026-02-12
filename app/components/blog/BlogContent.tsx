'use client';

import { useState } from 'react';
import { FeaturedPost } from './FeaturedPost';
import { PostCard } from './PostCard';
import { CategoryFilter } from './CategoryFilter';
import type { BlogPost } from '@/lib/data/blog-posts';

interface BlogContentProps {
  featuredPost: BlogPost | undefined;
  allPosts: BlogPost[];
  categories: readonly string[];
}

export function BlogContent({ featuredPost, allPosts, categories }: BlogContentProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter posts by category
  const filteredPosts = activeCategory === 'All'
    ? allPosts
    : allPosts.filter(post => post.category === activeCategory);

  // Exclude featured post from the grid
  const gridPosts = filteredPosts.filter(post => !post.featured);

  return (
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
  );
}
