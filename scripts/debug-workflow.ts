import { SLIDE_LIBRARY } from '../src/lib/workflows/slides';

// Test building a slide and check its structure
const reviewBrandSlide = SLIDE_LIBRARY['review-brand-performance'];
if (reviewBrandSlide) {
  const result = reviewBrandSlide({ variables: { message: 'Test' } });
  console.log('Slide result structure:');
  console.log('- Has structure:', 'structure' in result);
  console.log('- Has artifacts at top level:', 'artifacts' in result);
  console.log('- structure.artifacts:', result.structure?.artifacts);
  console.log('- structure.artifacts.sections:', result.structure?.artifacts?.sections);
  if (result.structure?.artifacts?.sections?.[0]) {
    console.log('- First section:', JSON.stringify(result.structure.artifacts.sections[0], null, 2));
  }
}
