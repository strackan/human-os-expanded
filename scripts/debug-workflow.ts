import { SLIDE_LIBRARY } from '../src/lib/workflows/slides';

// Test building a slide and check its structure
const reviewBrandSlide = SLIDE_LIBRARY['review-brand-performance'];
if (reviewBrandSlide) {
  const result = reviewBrandSlide({ variables: { message: 'Test' } });
  console.log('Slide result structure:');
  console.log('- Has artifacts at top level:', 'artifacts' in result);
  if ('artifacts' in result && result.artifacts) {
    console.log('- artifacts:', result.artifacts);
    console.log('- artifacts.sections:', result.artifacts.sections);
    if (result.artifacts.sections?.[0]) {
      console.log('- First section:', JSON.stringify(result.artifacts.sections[0], null, 2));
    }
  }
}
