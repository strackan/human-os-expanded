// Question Loader - Reads markdown files and parses frontmatter
import fs from 'fs';
import path from 'path';
import { AssessmentQuestion, AssessmentSection, AssessmentConfig } from '@/types/assessment';
import { ASSESSMENT_SECTIONS, ASSESSMENT_CONFIG } from './questions/_config';

interface QuestionFrontmatter {
  id: string;
  section: string;
  order: number;
  dimensions: string[];
  required: boolean;
  type: 'open_ended' | 'scale' | 'multiple_choice';
  followUp?: string;
}

function parseFrontmatter(content: string): { frontmatter: QuestionFrontmatter; text: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid question file format - no frontmatter found');
  }

  const [, frontmatterStr, text] = match;
  const frontmatter: any = {};

  // Parse YAML-like frontmatter
  frontmatterStr.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();

      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim());
      }
      // Handle booleans
      else if (value === 'true' || value === 'false') {
        frontmatter[key.trim()] = value === 'true';
      }
      // Handle numbers
      else if (!isNaN(Number(value))) {
        frontmatter[key.trim()] = Number(value);
      }
      // Handle strings
      else {
        frontmatter[key.trim()] = value;
      }
    }
  });

  return {
    frontmatter: frontmatter as QuestionFrontmatter,
    text: text.trim(),
  };
}

function loadQuestionsFromDirectory(directory: string): AssessmentQuestion[] {
  const questionsDir = path.join(process.cwd(), 'src/lib/assessment/questions', directory);
  const files = fs.readdirSync(questionsDir).filter((file) => file.endsWith('.md'));

  const questions = files.map((file) => {
    const filePath = path.join(questionsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, text } = parseFrontmatter(content);

    return {
      id: frontmatter.id,
      section: frontmatter.section,
      order: frontmatter.order,
      text,
      type: frontmatter.type,
      dimensions: frontmatter.dimensions as any,
      required: frontmatter.required,
      followUp: frontmatter.followUp,
    } as AssessmentQuestion;
  });

  // Sort by order
  return questions.sort((a, b) => a.order - b.order);
}

export function loadAssessmentConfig(): AssessmentConfig {
  const sections: AssessmentSection[] = ASSESSMENT_SECTIONS.map((sectionConfig) => {
    const questions = loadQuestionsFromDirectory(sectionConfig.directory);

    return {
      id: sectionConfig.id,
      title: sectionConfig.title,
      description: sectionConfig.description,
      order: sectionConfig.order,
      transitionMessage: sectionConfig.transitionMessage,
      questions,
    };
  });

  return {
    id: ASSESSMENT_CONFIG.id,
    title: ASSESSMENT_CONFIG.title,
    version: ASSESSMENT_CONFIG.version,
    estimatedMinutes: ASSESSMENT_CONFIG.estimatedMinutes,
    sections,
    completionMessage: ASSESSMENT_CONFIG.completionMessage,
  };
}

// Helper to get all questions as flat array
export function getAllQuestions(): AssessmentQuestion[] {
  const config = loadAssessmentConfig();
  return config.sections.flatMap((section) => section.questions);
}

// Helper to get question by ID
export function getQuestionById(questionId: string): AssessmentQuestion | null {
  const questions = getAllQuestions();
  return questions.find((q) => q.id === questionId) || null;
}

// Helper to get questions by section
export function getQuestionsBySection(sectionId: string): AssessmentQuestion[] {
  const config = loadAssessmentConfig();
  const section = config.sections.find((s) => s.id === sectionId);
  return section?.questions || [];
}
