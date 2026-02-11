import { Badge } from '../ui/Badge';
import { Calendar, Clock } from 'lucide-react';
import type { BlogPost } from '@/lib/data/blog-posts';

interface PostHeaderProps {
  post: BlogPost;
}

export function PostHeader({ post }: PostHeaderProps) {
  const categoryColors: Record<string, 'primary' | 'success' | 'warning' | 'purple' | 'orange'> = {
    'MSSP': 'primary',
    'Risk Adjustment': 'success',
    'Quality': 'warning',
    'Medicare Advantage': 'purple',
    'Data Engineering': 'orange',
  };

  return (
    <header className="mb-8">
      <Badge variant={categoryColors[post.category] || 'default'} className="mb-4">
        {post.category}
      </Badge>
      <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-navy-900 mb-4">
        {post.title}
      </h1>
      <div className="flex items-center gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span>{post.readingTime}</span>
        </div>
      </div>
    </header>
  );
}
