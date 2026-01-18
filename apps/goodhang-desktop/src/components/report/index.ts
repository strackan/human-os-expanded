/**
 * Report Components Barrel Export
 */

// Main components
export { ReportView, type ReportViewProps, type ReportTab } from './ReportView';
export { ReportEditor, type ReportEditorProps } from './ReportEditor';

// Tab content components (for custom layouts)
export {
  StatusTab,
  PersonalityTab,
  VoiceTab,
  CharacterTab,
} from './ReportTabContent';
