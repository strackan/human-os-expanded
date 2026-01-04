/**
 * LoadingAnimation Component
 *
 * Simple twirling asterisk loading animation displayed while processing.
 */
export const LoadingAnimation = () => (
  <div className="flex items-center space-x-2">
    <span>Working On It</span>
    <span className="animate-spin text-lg">*</span>
  </div>
);
