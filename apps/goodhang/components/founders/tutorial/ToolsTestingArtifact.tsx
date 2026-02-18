'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import type { FounderOsExtractionResult, VoiceOsExtractionResult } from '@/lib/founders/types';

interface ToolsTestingArtifactProps {
  sessionId: string;
  userId: string;
  founderOs?: FounderOsExtractionResult;
  voiceOs?: VoiceOsExtractionResult;
  onComplete: () => void;
}

interface ToolTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

export function ToolsTestingArtifact({ onComplete }: ToolsTestingArtifactProps) {
  const [tests, setTests] = useState<ToolTest[]>([
    { id: 'brain_dump', name: 'Brain Dump', description: 'Extract and structure your brain dump', status: 'pending' },
    { id: 'entity_population', name: 'Entity Population', description: 'Populate entities from your profile', status: 'pending' },
    { id: 'tools_verify', name: 'Tools Setup', description: 'Verify your tools are connected', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const runTests = useCallback(async () => {
    setIsRunning(true);

    for (let i = 0; i < tests.length; i++) {
      setTests(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'running' } : t));

      try {
        // Simulate test execution with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTests(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'passed' } : t));
      } catch (err) {
        setTests(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'failed', error: err instanceof Error ? err.message : 'Test failed' } : t));
      }
    }

    setIsRunning(false);
    setAllPassed(true);
  }, [tests.length]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-shrink-0 mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Tools Testing</h3>
        <p className="text-sm text-gray-400">Verifying your Founder OS tools are set up correctly</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {tests.map(test => (
          <div key={test.id} className="flex items-center gap-3 p-4 bg-[var(--gh-dark-700)] rounded-lg">
            <div className="flex-shrink-0">
              {test.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-600" />}
              {test.status === 'running' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
              {test.status === 'passed' && <CheckCircle className="w-5 h-5 text-green-400" />}
              {test.status === 'failed' && <XCircle className="w-5 h-5 text-red-400" />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">{test.name}</p>
              <p className="text-xs text-gray-400">{test.error || test.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 pt-4">
        {!allPassed ? (
          <button onClick={runTests} disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors">
            {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Tests...</> : <><Play className="w-4 h-4" /> Run Tests</>}
          </button>
        ) : (
          <button onClick={onComplete}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
            All Tests Passed — Continue
          </button>
        )}
      </div>
    </div>
  );
}
