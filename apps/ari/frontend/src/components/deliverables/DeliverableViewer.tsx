import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface DeliverableViewerProps {
  content: string
  title: string
  customerName: string
}

export default function DeliverableViewer({ content, title, customerName }: DeliverableViewerProps) {
  // Custom components for branded markdown rendering
  const components: Components = {
    // Headers
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-deliverable-text-primary mb-4 pb-3 border-b-2 border-deliverable-accent">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold text-deliverable-text-primary mt-8 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-deliverable-accent mt-6 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-deliverable-text-primary mt-4 mb-2">
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children }) => (
      <p className="text-deliverable-text-primary leading-relaxed mb-4">
        {children}
      </p>
    ),

    // Strong/Bold
    strong: ({ children }) => (
      <strong className="font-semibold text-deliverable-text-primary">
        {children}
      </strong>
    ),

    // Emphasis/Italic
    em: ({ children }) => (
      <em className="italic text-deliverable-text-secondary">
        {children}
      </em>
    ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-deliverable-accent hover:text-deliverable-accent-warm underline decoration-deliverable-accent/30 hover:decoration-deliverable-accent transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-deliverable-text-primary marker:text-deliverable-accent">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-deliverable-text-primary marker:text-deliverable-accent">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-deliverable-text-primary pl-1">
        {children}
      </li>
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-deliverable-highlight">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-deliverable-border">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-deliverable-highlight/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-deliverable-text-primary border-b-2 border-deliverable-accent">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-deliverable-text-primary border-b border-deliverable-border">
        {children}
      </td>
    ),

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-deliverable-accent bg-deliverable-highlight pl-4 py-3 my-4 italic text-deliverable-text-secondary">
        {children}
      </blockquote>
    ),

    // Code
    code: ({ className, children }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code className="px-1.5 py-0.5 bg-deliverable-highlight text-deliverable-text-primary rounded text-sm font-mono">
            {children}
          </code>
        )
      }
      return (
        <code className={`${className} block`}>
          {children}
        </code>
      )
    },
    pre: ({ children }) => (
      <pre className="bg-deliverable-text-primary text-deliverable-background p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono">
        {children}
      </pre>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="my-8 border-t border-deliverable-border" />
    ),
  }

  return (
    <div className="min-h-screen bg-deliverable-background">
      {/* Document header */}
      <header className="bg-deliverable-surface border-b border-deliverable-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-deliverable-accent to-deliverable-accent-warm flex items-center justify-center font-bold text-white text-sm">
              ARI
            </div>
            <div>
              <h1 className="text-lg font-semibold text-deliverable-text-primary">{title}</h1>
              <p className="text-sm text-deliverable-text-secondary">{customerName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Document content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <article className="bg-deliverable-surface rounded-xl shadow-sm border border-deliverable-border p-8 md:p-12">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-deliverable-text-secondary">
          <p>Prepared by NewsUSA AI Intelligence Division</p>
        </footer>
      </main>
    </div>
  )
}
