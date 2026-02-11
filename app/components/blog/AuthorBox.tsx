import { Card } from '../ui/Card';
import type { BlogPost } from '@/lib/data/blog-posts';

interface AuthorBoxProps {
  author: BlogPost['author'];
}

export function AuthorBox({ author }: AuthorBoxProps) {
  return (
    <Card className="mt-12 p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-heading font-bold text-xl">
          {author.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h3 className="font-heading font-semibold text-lg text-navy-900">
            {author.name}
          </h3>
          <p className="text-gray-600">{author.role}</p>
        </div>
      </div>
    </Card>
  );
}
