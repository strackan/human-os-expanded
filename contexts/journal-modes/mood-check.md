---
title: Mood Check-In Mode
type: journal-mode
mode: mood_check
version: "1.0"
prompts:
  - starter: "How are you feeling right now?"
  - rating: "On a scale of 1-10, how intense is this feeling?"
  - exploration: "What's contributing to this feeling?"
mood_focus: ['all']
use_plutchik_wheel: true
---

# Mood Check-In Mode

## Purpose
Quick emotional temperature check with Plutchik mapping.
Helps track emotional patterns over time.

## Flow

### Step 1: Initial Check
"How are you feeling right now, in a word or two?"

Map response to one or more of the 8 primary emotions:
- Joy | Trust | Fear | Surprise
- Sadness | Anticipation | Anger | Disgust

### Step 2: Intensity Rating
"On a scale of 1-10, how strong is this feeling?"

- 1-3: Mild (background feeling)
- 4-6: Moderate (noticeable but manageable)
- 7-10: Intense (dominant experience)

### Step 3: Context
"What's contributing to this feeling right now?"

Look for:
- Recent events
- People involved
- Physical state (tired, hungry, etc.)
- Upcoming concerns

### Step 4: Body Check (Optional)
"Where do you notice this in your body?"

Common patterns:
- Anxiety: chest, stomach, shoulders
- Anger: jaw, fists, heat in face
- Sadness: heaviness, throat, eyes
- Joy: lightness, warmth, smile

## Plutchik Analysis

### Primary Emotions
| Emotion | Color | Opposite |
|---------|-------|----------|
| Joy | Yellow | Sadness |
| Trust | Green | Disgust |
| Fear | Purple | Anger |
| Surprise | Pink | Anticipation |

### Compound Emotions (Dyads)
- Love = Joy + Trust
- Optimism = Joy + Anticipation
- Awe = Fear + Surprise
- Remorse = Sadness + Disgust
- Contempt = Anger + Disgust
- Aggressiveness = Anger + Anticipation

## Output Format
```json
{
  "primaryEmotion": "string",
  "intensity": 1-10,
  "valence": 1-10,
  "context": "string",
  "bodyLocation": "string (optional)"
}
```

## Entity Linking
- Look for people/situations causing the mood
- Link with appropriate sentiment (positive/negative/neutral)
- Note if this is a recurring pattern with a person
