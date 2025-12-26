'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Search, Filter, Calendar } from 'lucide-react';
import { isColorDark } from '@/lib/colorUtils';

interface Snippet {
  id: number;
  snippet: string;
  description: string;
  startIndex: number;
  endIndex: number;
  highlightColor: string;
  createdDate: string;
  entry: {
    id: number;
    entryProps?: {
      title: string;
    };
  };
  label?: {
    id: number;
    name: string;
    color: string;
  };
}

export default function SnippetsPage() {
  const router = useRouter();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState<string>('');
  const [labels, setLabels] = useState<{ id: number; name: string; color: string }[]>([]);

  useEffect(() => {
    fetchSnippets();
    fetchLabels();
  }, []);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/snippets');
      if (response.ok) {
        const data = await response.json();
        setSnippets(data);
      }
    } catch (error) {
      console.error('Error fetching snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/labels');
      if (response.ok) {
        const data = await response.json();
        setLabels(data);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.entry.entryProps?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLabel = !filterLabel || snippet.label?.name === filterLabel;
    
    return matchesSearch && matchesLabel;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSnippetClick = (snippet: Snippet) => {
    router.push(`/entry/${snippet.entry.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-main-bg p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading snippets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main-bg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Snippets</h1>
          <p className="text-gray-600">Your highlighted journal excerpts</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search snippets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Filter by label"
                aria-label="Filter by label"
              >
                <option value="">All Labels</option>
                {labels.map((label) => (
                  <option key={label.id} value={label.name}>
                    {label.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Snippets Grid */}
        {filteredSnippets.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || filterLabel ? 'No snippets found' : 'No snippets yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterLabel 
                ? 'Try adjusting your search or filter criteria'
                : 'Highlight text in your journal entries and use Ctrl+Shift+S to create snippets'
              }
            </p>
            {!searchTerm && !filterLabel && (
              <button
                onClick={() => router.push('/entry/new')}
                className="px-6 py-3 bg-core-green text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Writing
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                onClick={() => handleSnippetClick(snippet)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: snippet.highlightColor }}
                    />
                    {snippet.label && (
                      <span
                        className="px-2 py-1 text-xs rounded-full font-medium"
                        style={{
                          backgroundColor: `#${snippet.label.color}`,
                          color: isColorDark(`#${snippet.label.color}`) ? '#ffffff' : '#000000',
                        }}
                      >
                        {snippet.label.name}
                      </span>
                    )}
                  </div>
                  <Calendar size={16} className="text-gray-400" />
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">
                    "{snippet.snippet}"
                  </p>
                  {snippet.description && (
                    <p className="text-gray-800 text-sm">{snippet.description}</p>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {formatDate(snippet.createdDate)}
                </div>
                
                {snippet.entry.entryProps?.title && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    From: {snippet.entry.entryProps.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 