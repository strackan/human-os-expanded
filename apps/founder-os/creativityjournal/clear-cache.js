// Clear localStorage cache with old mood ID formats
console.log('Clearing localStorage cache...');

// List of localStorage keys that might contain old mood data
const keysToCheck = [
  'entry_draft',
  'entry_metadata'
];

keysToCheck.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`Found ${key}:`, parsed);
      
      // Check for old string format in mood IDs
      if (parsed.selectedMoods) {
        const hasOldFormat = parsed.selectedMoods.some(mood => 
          typeof mood.value === 'string' && mood.value.startsWith('user_')
        );
        if (hasOldFormat) {
          console.log(`Removing ${key} with old mood format`);
          localStorage.removeItem(key);
        }
      }
      
      if (parsed.moodIds) {
        const hasOldFormat = parsed.moodIds.some(id => 
          typeof id === 'string' && id.startsWith('user_')
        );
        if (hasOldFormat) {
          console.log(`Removing ${key} with old mood format`);
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.log(`Removing invalid JSON in ${key}`);
      localStorage.removeItem(key);
    }
  }
});

console.log('Cache cleanup complete. Please refresh the page.'); 