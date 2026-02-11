import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readingTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  featured?: boolean;
}

// Default author for posts (can be overridden in frontmatter)
const defaultAuthor = {
  name: 'Open Flow Insights',
  role: 'Healthcare Analytics Team',
  avatar: '/assets/icons/logo-mark.svg',
};

// Read markdown files from content/blog directory
function getMarkdownPosts(): BlogPost[] {
  const blogDir = path.join(process.cwd(), 'content', 'blog');

  // Check if directory exists
  if (!fs.existsSync(blogDir)) {
    console.warn('Blog content directory not found:', blogDir);
    return [];
  }

  const files = fs.readdirSync(blogDir);

  const posts = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(blogDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      // Convert markdown to HTML (synchronously for now)
      const processedContent = remark()
        .use(html, { sanitize: false })
        .processSync(content);
      const contentHtml = processedContent.toString();

      return {
        slug: data.slug || file.replace('.md', ''),
        title: data.title || 'Untitled',
        excerpt: data.excerpt || '',
        content: contentHtml,
        category: data.category || 'Uncategorized',
        date: data.date || new Date().toISOString().split('T')[0],
        readingTime: data.readTime || '5 min read',
        author: data.author || defaultAuthor,
        featured: data.featured || false,
      };
    });

  return posts;
}

// Cache posts to avoid re-reading files on every request
let cachedPosts: BlogPost[] | null = null;

function getBlogPosts(): BlogPost[] {
  if (!cachedPosts) {
    cachedPosts = getMarkdownPosts();
  }
  return cachedPosts;
}

export function getAllPosts(): BlogPost[] {
  const posts = getBlogPosts();
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getBlogPosts();
  return posts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  if (category === 'All') {
    return getAllPosts();
  }
  const posts = getBlogPosts();
  return posts.filter((post) => post.category === category);
}

export function getFeaturedPost(): BlogPost | undefined {
  const posts = getBlogPosts();
  // Return the most recent post as featured if none explicitly marked
  const featured = posts.find((post) => post.featured);
  if (featured) return featured;

  // Otherwise return the most recent post
  const sorted = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sorted[0];
}

// Extract categories dynamically from posts
export function getCategories(): string[] {
  const posts = getBlogPosts();
  const categorySet = new Set<string>(['All']);
  posts.forEach((post) => categorySet.add(post.category));
  return Array.from(categorySet);
}

// Export as constant for backwards compatibility
export const categories = [
  'All',
  'MSSP',
  'Risk Adjustment',
  'Quality',
  'Medicare Advantage',
  'Data Engineering',
] as const;
