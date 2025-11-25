import { SLIDE_LIBRARY } from '../src/lib/workflows/slides';
import { composeWorkflow } from '../src/lib/workflows/composer';

const composition = {
  id: 'test',
  name: 'Test',
  moduleId: 'test',
  category: 'renewal' as const,
  description: 'Test',
  slideSequence: ['greeting', 'review-brand-performance'],
  slideContexts: {},
};

const slides = composeWorkflow(composition, SLIDE_LIBRARY, {});

console.log('Composed slides:');
slides.forEach((slide, idx) => {
  console.log(`\nSlide ${idx}: ${slide.id}`);
  console.log('- artifacts:', slide.artifacts);
  console.log('- artifacts.sections:', slide.artifacts?.sections);
  if (slide.artifacts?.sections?.[0]) {
    console.log('- First section visible:', slide.artifacts.sections[0].visible);
  }
});
