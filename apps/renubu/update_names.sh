#!/bin/bash

echo "=== Updating Company Names and Operation Blackout Cost ==="

# Find all markdown files (excluding node_modules, .git, archive)
FILES=$(find . -name "*.md" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/docs/archive/*")

echo "Files to update: $(echo "$FILES" | wc -l)"

for file in $FILES; do
  # Backup not needed since we're in git
  
  # 1. Bluesoft -> Squelch
  sed -i 's/Bluesoft/Squelch/g' "$file"
  
  # 2. ACO -> Obsidian Black (careful with variations)
  sed -i 's/ACO/Obsidian Black/g' "$file"
  sed -i 's/Apex Consolidated Operations/Obsidian Black/g' "$file"
  
  # 3. Update Operation Blackout cost: $85K -> $150K
  sed -i 's/\$85K/\$150K/g' "$file"
  sed -i 's/85000/150000/g' "$file"
  sed -i 's/\$85,000/\$150,000/g' "$file"
  
  # Fix specific contexts where ACO should stay (like URLs, IDs, code)
  sed -i 's/Obsidian Black-/ACO-/g' "$file"  # Ticket IDs like ACO-4728
  sed -i 's/aco-global\.net/obsidian-ops.net/g' "$file"  # Email domains
  sed -i 's/marcus@obsidian-ops\.net/marcus@obsidian-ops.net/g' "$file"
done

echo "=== Update Complete ==="
echo ""
echo "Summary of changes:"
echo "- Bluesoft → Squelch"
echo "- ACO/Apex Consolidated Operations → Obsidian Black"
echo "- Operation Blackout cost: \$85K → \$150K"
echo ""
echo "Files modified: $(echo "$FILES" | wc -l)"

