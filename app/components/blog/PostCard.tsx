import Link from 'next/link';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, Clock } from 'lucide-react';
import type { BlogPost } from '@/lib/data/blog-posts';

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  const categoryColors: Record<string, 'primary' | 'success' | 'warning' | 'purple' | 'orange'> = {
    'MSSP': 'primary',
    'Risk Adjustment': 'success',
    'Quality': 'warning',
    'Medicare Advantage': 'purple',
    'Data Engineering': 'orange',
  };

  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <Card hover className="h-full">
        <CardHeader>
          <Badge variant={categoryColors[post.category] || 'default'} className="mb-3">
            {post.category}
          </Badge>
          <h3 className="font-heading font-semibold text-xl text-navy-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
