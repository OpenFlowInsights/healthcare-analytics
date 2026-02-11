import Link from 'next/link';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/lib/data/blog-posts';

interface FeaturedPostProps {
  post: BlogPost;
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block mb-12">
      <Card hover className="overflow-hidden">
        <div className="md:flex">
          <div className="md:w-2/5 bg-gradient-navy-blue p-12 flex items-center justify-center">
            <div className="text-center">
              <Badge variant="warning" className="mb-4">Featured Post</Badge>
              <h2 className="font-heading font-bold text-2xl text-white">
                Latest Insights
              </h2>
            </div>
          </div>
          <div className="md:w-3/5 p-8">
            <Badge variant="primary" className="mb-3">
              {post.category}
            </Badge>
            <h3 className="font-heading font-bold text-2xl sm:text-3xl text-navy-900 mb-4">
              {post.title}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">{post.excerpt}</p>
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime}</span>
              </div>
            </div>
            <div className="flex items-center text-blue-600 font-semibold">
              Read Full Article
              <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
