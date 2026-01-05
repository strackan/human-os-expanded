'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function GenerateInviteButton({ userId }: { userId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const generateCode = async () => {
    setIsGenerating(true);
    setNewCode(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('generate_invite_code', {
        generated_by_user: userId,
      });

      if (error) throw error;

      setNewCode(data);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error generating invite code:', error);
      alert('Failed to generate invite code');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={generateCode}
        disabled={isGenerating}
        className="px-6 py-3 bg-neon-cyan text-background font-mono font-bold hover:bg-neon-magenta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Generating...' : 'Generate Code'}
      </button>
      {newCode && (
        <div className="bg-background-lighter border-2 border-neon-cyan p-4">
          <p className="text-foreground-dim font-mono text-sm mb-2">New Code:</p>
          <p className="text-neon-cyan font-mono text-2xl font-bold">{newCode}</p>
        </div>
      )}
    </div>
  );
}
