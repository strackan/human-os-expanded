#!/bin/bash

# Fix FE_ACT1_TASKS_V2.md
echo "Fixing FE_ACT1_TASKS_V2.md..."

# Replace ARR values
sed -i 's/\$850,000/\$185,000/g' FE_ACT1_TASKS_V2.md
sed -i 's/\$850K/\$185K/g' FE_ACT1_TASKS_V2.md

# Replace health score
sed -i 's/4\.2\/10/6.4\/10/g' FE_ACT1_TASKS_V2.md
sed -i 's/4\.2 \/ 10/6.4 \/ 10/g' FE_ACT1_TASKS_V2.md

# Replace churn probability
sed -i 's/68%/42%/g' FE_ACT1_TASKS_V2.md

# Replace expansion values
sed -i 's/\$1\.7M/\$410K/g' FE_ACT1_TASKS_V2.md
sed -i 's/\$2\.55M/\$595K/g' FE_ACT1_TASKS_V2.md

# Replace Operation Blackout cost in description
sed -i 's/Cost impact: \$185K/Cost impact: \$85K/g' FE_ACT1_TASKS_V2.md

# Replace health score status indicators
sed -i 's/(RED indicator)/(YELLOW indicator)/g' FE_ACT1_TASKS_V2.md
sed-i 's/red indicator/yellow indicator/g' FE_ACT1_TASKS_V2.md
sed -i 's/shows red/shows yellow/g' FE_ACT1_TASKS_V2.md
sed -i 's/, status: error, sublabel: "Critical risk"/, status: warning, sublabel: "Moderate risk"/g' FE_ACT1_TASKS_V2.md
sed -i 's/with red\/error styling/with yellow\/warning styling/g' FE_ACT1_TASKS_V2.md

# Fix BE_ACT1_TASKS_V2.md
echo "Fixing BE_ACT1_TASKS_V2.md..."

# Replace ARR values
sed -i 's/850000/185000/g' BE_ACT1_TASKS_V2.md

# Replace health score
sed -i 's/4\.2/6.4/g' BE_ACT1_TASKS_V2.md

# Replace expansion values
sed -i 's/1700000/410000/g' BE_ACT1_TASKS_V2.md

echo "Done!"
