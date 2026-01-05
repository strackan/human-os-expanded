'use client';

import type { PersonalityProfile } from '@/lib/assessment/types';

interface PersonalityProfileCardProps {
  profile: PersonalityProfile;
}

export function PersonalityProfileCard({ profile }: PersonalityProfileCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Your Personality Profile
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* MBTI */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-purple-400 mb-2">Myers-Briggs Type</h3>
          <p className="text-4xl font-bold text-white mb-3">{profile.mbti}</p>
          <p className="text-gray-300 text-sm">
            {getMBTIDescription(profile.mbti)}
          </p>
        </div>

        {/* Enneagram */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-400 mb-2">Enneagram Type</h3>
          <p className="text-4xl font-bold text-white mb-3">{profile.enneagram}</p>
          <p className="text-gray-300 text-sm">
            {getEnneagramDescription(profile.enneagram)}
          </p>
        </div>
      </div>

      {/* Key Traits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Key Traits</h3>
        <div className="flex flex-wrap gap-2">
          {profile.traits.map(trait => (
            <span
              key={trait}
              className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function getMBTIDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'ENFP': 'Enthusiastic, creative, and spontaneous. Excellent at connecting ideas and people.',
    'INTJ': 'Strategic, analytical, and independent. Natural problem-solvers with long-term vision.',
    'ENTP': 'Innovative, clever, and curious. Love intellectual challenges and debate.',
    'INFJ': 'Insightful, principled, and creative. Seek meaning and authentic connections.',
    'ENTJ': 'Bold, decisive, and strategic. Natural leaders who organize for results.',
    'INFP': 'Idealistic, empathetic, and creative. Guided by deep values and principles.',
    'ENFJ': 'Charismatic, inspiring, and empathetic. Natural mentors and motivators.',
    'INTP': 'Analytical, logical, and innovative. Love solving complex theoretical problems.',
    'ESTJ': 'Organized, practical, and decisive. Excellent at managing and executing.',
    'ISTJ': 'Responsible, detail-oriented, and systematic. Value tradition and reliability.',
    'ESFJ': 'Warm, cooperative, and conscientious. Natural caregivers and team players.',
    'ISFJ': 'Devoted, practical, and caring. Create stability and support others.',
    'ESTP': 'Energetic, pragmatic, and bold. Thrive on action and solving immediate problems.',
    'ISTP': 'Practical, analytical, and adaptable. Master troubleshooters and craftspeople.',
    'ESFP': 'Spontaneous, enthusiastic, and fun-loving. Bring energy and joy to situations.',
    'ISFP': 'Gentle, artistic, and flexible. Value harmony and authentic self-expression.',
  };
  return descriptions[type] || 'Unique personality with distinct strengths.';
}

function getEnneagramDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'Type 1': 'The Perfectionist - Principled, purposeful, and self-controlled.',
    'Type 2': 'The Helper - Generous, demonstrative, and people-pleasing.',
    'Type 3': 'The Achiever - Success-oriented, adaptable, and driven.',
    'Type 4': 'The Individualist - Expressive, dramatic, and self-absorbed.',
    'Type 5': 'The Investigator - Perceptive, innovative, and isolated.',
    'Type 6': 'The Loyalist - Engaging, responsible, and anxious.',
    'Type 7': 'The Enthusiast - Spontaneous, versatile, and optimistic.',
    'Type 8': 'The Challenger - Self-confident, decisive, and confrontational.',
    'Type 9': 'The Peacemaker - Receptive, reassuring, and complacent.',
  };
  return descriptions[type] || 'Distinct motivational pattern.';
}
