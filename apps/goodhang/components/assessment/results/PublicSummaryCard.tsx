'use client';

interface PublicSummaryCardProps {
  summary: string;
}

export function PublicSummaryCard({ summary }: PublicSummaryCardProps) {
  if (!summary) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-4 text-white">Professional Summary</h2>
      <p className="text-gray-300 mb-4 text-sm italic">
        This is the summary that will appear on your public profile when you publish it.
      </p>
      <div className="bg-gray-900/50 rounded-lg p-6">
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{summary}</p>
      </div>
    </div>
  );
}
