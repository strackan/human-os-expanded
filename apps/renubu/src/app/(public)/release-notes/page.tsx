import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export const metadata: Metadata = {
  title: 'Release Notes | Renubu',
  description: 'Renubu release history and changelog from initial development through production launch',
};

export default async function ReleaseNotesPage() {
  // Read RELEASE_NOTES.md from project root
  const releaseNotesPath = path.join(process.cwd(), 'RELEASE_NOTES.md');
  const markdownContent = fs.readFileSync(releaseNotesPath, 'utf-8');

  // Convert markdown to HTML
  const htmlContent = await marked(markdownContent);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Renubu Release Notes</h1>
          <p className="mt-2 text-gray-600">
            Track our product evolution from initial development through production launch
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div
          className="prose prose-gray max-w-none
            prose-headings:font-semibold
            prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
            prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
            prose-h4:text-lg prose-h4:mt-3 prose-h4:mb-2
            prose-p:text-gray-700 prose-p:leading-7
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-gray-700 prose-li:my-1
            prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-800
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
            prose-table:w-full prose-table:border-collapse
            prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left
            prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
          "
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>For bug reports or feature requests, visit our GitHub repository</p>
        </div>
      </div>
    </div>
  );
}
