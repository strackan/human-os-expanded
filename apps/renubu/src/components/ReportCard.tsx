import React from 'react';

interface ReportCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, children }) => (
  <section className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full min-h-[400px] gap-4 border border-gray-100 min-w-0" aria-label={title}>
    <header>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-gray-500 text-sm mb-2">{description}</p>
    </header>
    <div className="flex-1 flex flex-col">{children}</div>
  </section>
);

export default ReportCard; 