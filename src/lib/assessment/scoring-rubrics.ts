// Scoring Rubrics for CS Assessment
// Defines how to score each dimension from 0-100

export interface DimensionRubric {
  dimension: string;
  description: string;
  scoreRanges: {
    range: string;
    score: number;
    indicators: string[];
  }[];
}

export const SCORING_RUBRICS: DimensionRubric[] = [
  {
    dimension: 'iq',
    description: 'Problem-solving, critical thinking, analytical ability',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Systematic, structured thinking',
          'Breaks down complex problems effectively',
          'Considers multiple angles and edge cases',
          'Shows metacognitive awareness (thinks about thinking)',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: [
          'Good problem-solving approach',
          'Logical and coherent reasoning',
          'Can identify root causes',
        ],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Basic problem-solving', 'Follows logical steps', 'May miss nuances'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Struggles with complex problems', 'Limited analytical depth'],
      },
    ],
  },
  {
    dimension: 'eq',
    description: 'Emotional intelligence, awareness of own and others emotions',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Deep emotional awareness (self and others)',
          'Skillfully manages difficult conversations',
          'Shows empathy AND maintains boundaries',
          'Recognizes emotional dynamics in situations',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Good emotional awareness', 'Handles most situations well', 'Shows genuine empathy'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Basic EQ', 'May struggle with complex emotional situations'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Limited emotional awareness', 'May come across as tone-deaf'],
      },
    ],
  },
  {
    dimension: 'empathy',
    description: 'Customer focus, understanding user pain, addressing root causes',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Truly understands customer perspective',
          'Anticipates needs before stated',
          'Addresses root causes, not just symptoms',
          'Customer stories show deep understanding',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Good customer focus', 'Understands explicit needs', 'Asks clarifying questions'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Adequate empathy', 'May miss subtle emotional cues'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Transactional approach', 'Misses customer emotional needs'],
      },
    ],
  },
  {
    dimension: 'self_awareness',
    description: 'Understanding own strengths/weaknesses, growth mindset, receptiveness to feedback',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Strong understanding of own patterns',
          'Actively seeks feedback and grows from it',
          'Articulates strengths AND weaknesses clearly',
          'Shows evidence of self-reflection',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Aware of some patterns', 'Receptive to feedback', 'Shows growth mindset'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Limited self-reflection', 'May be somewhat defensive'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Defensive about weaknesses', 'Unaware of blind spots'],
      },
    ],
  },
  {
    dimension: 'technical',
    description: 'Technical knowledge, tool proficiency, troubleshooting ability',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Strong technical foundation',
          'Uses advanced tools effectively',
          'Stays current with tech trends',
          'Can explain technical concepts clearly',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Competent with standard tools', 'Good technical knowledge', 'Can troubleshoot effectively'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Basic technical capability', 'Relies on others for complex issues'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Limited technical capability', 'Avoids technical tasks'],
      },
    ],
  },
  {
    dimension: 'ai_readiness',
    description: 'AI tool competency, prompt engineering, practical application',
    scoreRanges: [
      {
        range: '90-100 (AI Power User)',
        score: 95,
        indicators: [
          'Deep understanding of LLM concepts',
          'Writes structured, context-rich prompts',
          'Specifies output formats, constraints, verification steps',
          'Uses AI as strategic tool, not just search',
          'Prompts show multi-step thinking',
        ],
      },
      {
        range: '75-89 (AI Competent)',
        score: 82,
        indicators: [
          'Good conceptual understanding',
          'Writes decent prompts with context',
          'Uses AI regularly and effectively',
          'Missing some advanced techniques',
        ],
      },
      {
        range: '60-74 (AI Beginner)',
        score: 67,
        indicators: [
          'Basic understanding of AI tools',
          'Prompts lack specificity',
          'Doesn\'t provide much context',
          'Uses AI occasionally',
        ],
      },
      {
        range: '<60 (AI Novice)',
        score: 50,
        indicators: [
          'Limited AI understanding',
          'Vague prompts ("write an email", "help me")',
          'No structure or context',
          'Rarely uses AI tools',
        ],
      },
    ],
  },
  {
    dimension: 'gtm',
    description: 'Go-to-market understanding, business acumen, revenue focus',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Strategic thinker about business outcomes',
          'Understands revenue metrics deeply',
          'Identifies expansion opportunities naturally',
          'Connects CS actions to business impact',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Good business sense', 'Understands basic metrics', 'Revenue-minded'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Tactical focus', 'Less strategic thinking', 'Basic business understanding'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ["Doesn't connect CS to business outcomes", 'Limited revenue focus'],
      },
    ],
  },
  {
    dimension: 'personality',
    description: 'Communication style, adaptability, rapport building',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Clear communicator',
          'Adapts style to audience',
          'Builds rapport easily',
          'Strong executive presence',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Good communicator', 'Effective with most audiences', 'Professional demeanor'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Adequate communication', 'May struggle with executive presence'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Communication issues', 'Struggles to adapt style'],
      },
    ],
  },
  {
    dimension: 'motivation',
    description: 'Drive, purpose, intrinsic motivation',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: ['Deeply driven', 'Clear sense of purpose', 'Intrinsically motivated', 'Passionate about CS'],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Motivated', 'Knows what they want', 'Shows drive'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Somewhat motivated', 'Unclear about long-term purpose'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Disengaged', 'Unclear motivation', 'May be burnt out'],
      },
    ],
  },
  {
    dimension: 'work_history',
    description: 'Experience quality, career trajectory, relevant background',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Strong relevant experience',
          'Upward career trajectory',
          'Evidence of impact at previous roles',
          'Diverse, valuable experiences',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Good relevant experience', 'Solid track record', 'Clear career progression'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Some relevant experience', 'May have gaps or lateral moves'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Limited relevant experience', 'Unclear career direction'],
      },
    ],
  },
  {
    dimension: 'passions',
    description: 'What energizes them, interests, what they care about',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Clear about what energizes them',
          'Passions align with CS work',
          'Shows enthusiasm and energy',
          'Brings unique perspective',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Has clear interests', 'Shows energy about work', 'Authentic passions'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Some interests', 'Not deeply passionate'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Unclear about passions', 'Low energy', 'Going through motions'],
      },
    ],
  },
  {
    dimension: 'culture_fit',
    description: 'Values alignment, work style fit, team compatibility',
    scoreRanges: [
      {
        range: '90-100 (Exceptional)',
        score: 95,
        indicators: [
          'Values clearly align',
          'Thrives in autonomy',
          'Embraces authenticity and vulnerability',
          'Team-first mindset',
        ],
      },
      {
        range: '75-89 (Strong)',
        score: 82,
        indicators: ['Good values alignment', 'Decent fit', 'Works well with others'],
      },
      {
        range: '60-74 (Competent)',
        score: 67,
        indicators: ['Mixed fit', 'Some values alignment'],
      },
      {
        range: '<60 (Developing)',
        score: 50,
        indicators: ['Culture mismatch', 'Values conflict'],
      },
    ],
  },
];

// Tier routing based on overall score
export function determineTier(overallScore: number): 'top_1' | 'benched' | 'passed' {
  if (overallScore >= 85) return 'top_1';
  if (overallScore >= 60) return 'benched';
  return 'passed';
}
