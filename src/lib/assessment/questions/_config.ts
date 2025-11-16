// CS Assessment Configuration
// Defines sections, transitions, and metadata

export interface SectionConfig {
  id: string;
  title: string;
  description: string;
  order: number;
  transitionMessage?: string;
  directory: string;
}

export const ASSESSMENT_SECTIONS: SectionConfig[] = [
  {
    id: 'background',
    title: 'Getting to Know You',
    description: 'Tell us about your background and what drives you',
    order: 1,
    directory: '01-background',
  },
  {
    id: 'emotional_intelligence',
    title: 'Emotional Intelligence',
    description: 'Understanding how you navigate relationships and challenging situations',
    order: 2,
    transitionMessage:
      "Now we're going to explore how you navigate relationships and challenging situations. There are no right or wrong answers - we're interested in understanding your approach.",
    directory: '02-emotional-intelligence',
  },
  {
    id: 'technical',
    title: 'Technical Aptitude',
    description: 'Assessing your technical knowledge and problem-solving',
    order: 3,
    transitionMessage:
      "Great! Now let's dive into your technical capabilities and how you approach problem-solving. This section helps us understand your technical foundation.",
    directory: '03-technical',
  },
  {
    id: 'ai_readiness',
    title: 'AI Readiness & Competency',
    description: 'Exploring your AI capabilities and prompt engineering skills',
    order: 4,
    transitionMessage:
      "Excellent! Now let's explore your AI capabilities. This section assesses your understanding of AI tools and your ability to use them effectively. We'll ask you to write some actual prompts - this is where we see your practical AI skills in action.",
    directory: '04-ai-readiness',
  },
  {
    id: 'strategic',
    title: 'Strategic Thinking',
    description: 'Exploring how you approach strategy and business outcomes',
    order: 5,
    transitionMessage:
      "Excellent technical thinking! Now let's explore how you approach strategy and business outcomes. This section looks at the 'why' behind your work.",
    directory: '05-strategic',
  },
  {
    id: 'communication',
    title: 'Communication & Culture',
    description: 'Understanding your communication style and culture fit',
    order: 6,
    transitionMessage:
      "Almost done! This final section explores your communication style and what makes you tick. Just a few more questions.",
    directory: '06-communication',
  },
];

export const ASSESSMENT_CONFIG = {
  id: 'cs-skills-v1',
  title: 'CS Skills Assessment',
  version: '1.0',
  estimatedMinutes: 25,
  completionMessage:
    "That's it! You've completed the assessment. We're analyzing your responses now - this will just take a moment...",
};
