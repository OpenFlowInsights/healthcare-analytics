interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Simple markdown-like rendering
  // In production, you'd use a library like react-markdown
  const renderContent = (text: string) => {
    // Split by double newlines for paragraphs
    const sections = text.split('\n\n');

    return sections.map((section, index) => {
      // Headers
      if (section.startsWith('# ')) {
        return (
          <h1 key={index} className="font-heading font-bold text-3xl text-navy-900 mb-6 mt-8">
            {section.replace('# ', '')}
          </h1>
        );
      }
      if (section.startsWith('## ')) {
        return (
          <h2 key={index} className="font-heading font-bold text-2xl text-navy-900 mb-4 mt-8">
            {section.replace('## ', '')}
          </h2>
        );
      }
      if (section.startsWith('### ')) {
        return (
          <h3 key={index} className="font-heading font-semibold text-xl text-navy-900 mb-3 mt-6">
            {section.replace('### ', '')}
          </h3>
        );
      }

      // Bold text
      const renderWithBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      };

      // Bullet points
      if (section.startsWith('- ')) {
        const items = section.split('\n').filter(line => line.startsWith('- '));
        return (
          <ul key={index} className="list-disc list-inside space-y-2 mb-6 text-gray-700">
            {items.map((item, i) => (
              <li key={i}>{renderWithBold(item.replace('- ', ''))}</li>
            ))}
          </ul>
        );
      }

      // Regular paragraphs
      return (
        <p key={index} className="text-gray-700 leading-relaxed mb-6">
          {renderWithBold(section)}
        </p>
      );
    });
  };

  return (
    <article className="prose prose-lg max-w-none">
      {renderContent(content)}
    </article>
  );
}
