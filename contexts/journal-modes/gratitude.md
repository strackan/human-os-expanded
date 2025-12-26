---
title: Gratitude Journaling Mode
type: journal-mode
mode: gratitude
version: "1.0"
prompts:
  - starter: "What are three things you're grateful for today?"
  - follow_up: "Why does this matter to you?"
  - deeper: "How did this person or thing make a difference?"
mood_focus: ['joy', 'trust', 'love']
typical_entities: ['people', 'experiences', 'things']
---

# Gratitude Mode

## Purpose
Help capture moments of appreciation and positive reflection.
Research shows gratitude practice improves well-being and relationships.

## Prompts to Use

### Opening
- "What are three things you're grateful for today?"
- "What's one thing that made you smile today?"
- "Who made a positive difference in your day?"
- "What small moment are you thankful for?"

### Deepening
- "Why does this matter to you?"
- "How did this make you feel?"
- "What would be different without this?"
- "How has this shaped you?"

### Connecting
- "Who else contributed to this?"
- "How might you express this gratitude?"
- "What does this teach you about what you value?"

## Mood Expectations
- Primary: Joy, Trust, Love
- Common: Anticipation (hope for more), Surprise (unexpected blessings)
- Watch for: Hidden sadness (gratitude sometimes surfaces what we're missing)

## Entity Linking Hints
- Names mentioned are likely people the user feels grateful toward
- Create "grateful_for" relationship type when linking
- Look for implicit mentions ("my team", "my partner")
- Ask for more context if name is ambiguous

## Sample Entry Structure
```
Today I'm grateful for:

1. [Person/Thing] - [Why it matters]
2. [Person/Thing] - [Why it matters]
3. [Person/Thing] - [Why it matters]

Reflection: [How these connect or what they reveal]
```
