# Scoring Algorithm Documentation

## Overview

The CS Skills Assessment uses a hybrid AI + algorithmic scoring system to evaluate candidates across 14 dimensions. This document explains the complete scoring methodology, from raw answers to final results.

---

## Scoring Philosophy: Hard Grading

### The Problem with Score Inflation

Traditional assessments suffer from **grade inflation** where:
- Average candidates score 70-80
- Exceptional candidates score 85-95
- No one scores below 60 (fear of discouragement)

This compresses the entire talent spectrum into a narrow 25-point range (60-85), making it impossible to differentiate truly exceptional candidates.

### Our Solution: Hard Grading Scale

We use a **hard grading scale** where:

| Score Range | Interpretation | Percentile | Hiring Decision |
|-------------|----------------|------------|-----------------|
| 90-100 | Elite | Top 5% | Immediate hire, fight to get them |
| 85-89 | Exceptional | Top 10% | Strong hire, rare combination |
| 75-84 | Strong | Top 25% | Solid hire, would add value |
| 60-74 | Above Average | Top 50% | Worth considering, depends on fit |
| 50-59 | Average/Median | 50th percentile | Meets basic expectations |
| 40-49 | Below Average | Bottom 40% | Lacks key strengths |
| 0-39 | Weak | Bottom 20% | Not a fit |

**Key Principle:** **50 is the average**, not 70. Most candidates should score 40-60 in most dimensions.

### Why This Matters

1. **Differentiation**: We can clearly distinguish between good (70), great (80), and exceptional (90) candidates
2. **Calibration**: Scores map directly to percentiles and hiring decisions
3. **Honesty**: Candidates get realistic feedback on their standing
4. **Benchmark**: We can track improvement over time with meaningful deltas

---

## 14 Dimension Scoring

### Dimension Breakdown

The assessment evaluates candidates across **14 dimensions**, grouped into **3 categories**:

#### Category 1: Technical (4 dimensions)

| Dimension | Description | Example Signals |
|-----------|-------------|-----------------|
| **IQ** | Raw intelligence, problem-solving, clarity of thought | Structured answers, logical reasoning, quick learning |
| **Technical** | Technical skills, coding ability, systems understanding | Technical depth, API knowledge, debugging skills |
| **AI Readiness** | Understanding and practical use of AI tools/agents | Claude usage, prompt engineering, AI orchestration |
| **Organization** | Systems thinking, organizational ability, structured approach | Process design, documentation, project management |

#### Category 2: Emotional (5 dimensions)

| Dimension | Description | Example Signals |
|-----------|-------------|-----------------|
| **EQ** | Emotional intelligence, reading others, social awareness | Empathy in answers, team dynamics understanding |
| **Empathy** | Deep understanding of others' perspectives and needs | Customer-first thinking, active listening |
| **Self-Awareness** | Understanding own strengths, weaknesses, patterns | Honest weakness acknowledgment, growth mindset |
| **Executive Leadership** | Leadership capability, strategic thinking, decision-making | Vision, influence, stakeholder management |
| **GTM** | Understanding of sales, marketing, customer success | Revenue awareness, sales process knowledge |

#### Category 3: Creative (4 dimensions)

| Dimension | Description | Example Signals |
|-----------|-------------|-----------------|
| **Passions** | Authentic interests, energy, curiosity | Side projects, learning for fun, genuine enthusiasm |
| **Culture Fit** | Alignment with company values, team fit, humor | Humor style, self-awareness, cultural alignment |
| **Personality** | Personality traits, work style, communication style | MBTI alignment, communication clarity |
| **Motivation** | Drive, ambition, intrinsic motivation, growth mindset | Long-term goals, hunger for growth, resilience |

---

## Scoring Process

### Step 1: Claude AI Analysis

The assessment uses **Claude Sonnet 4** to analyze all 20 answers and generate dimension scores.

**Input to Claude:**
```
System Prompt: Detailed scoring rubrics (see SCORING_SYSTEM_PROMPT)
User Prompt: All 20 Q&A pairs formatted as text
```

**Claude's Task:**
1. Read all answers holistically
2. Score each of 14 dimensions (0-100)
3. Type personality (MBTI + Enneagram)
4. Score AI orchestration sub-dimensions
5. Identify red/green flags
6. Generate archetype, tier, recommendation

**Output Format:**
```json
{
  "dimensions": {
    "iq": 75,
    "eq": 82,
    "empathy": 78,
    // ... all 14 dimensions
  },
  "personality_profile": {
    "mbti": "INTJ",
    "enneagram": "Type 5",
    "traits": ["Analytical", "Strategic"]
  },
  "ai_orchestration_scores": {
    "technical_foundation": 85,
    "practical_use": 90,
    // ... 5 sub-scores
  },
  "archetype": "Technical Strategist",
  "tier": "top_1",
  // ... other fields
}
```

### Step 2: Calculate Category Scores

Category scores are **simple averages** of their constituent dimensions.

**Formula:**
```typescript
Technical = avg(Technical, AI Readiness, Organization, IQ)
Emotional = avg(EQ, Empathy, Self-Awareness, Executive Leadership, GTM)
Creative = avg(Passions, Culture Fit, Personality, Motivation)
```

**Example:**
```typescript
// Given dimensions:
dimensions = {
  technical: 70,
  ai_readiness: 85,
  organization: 65,
  iq: 80,
  // ...
}

// Calculate Technical category:
technical_category = (70 + 85 + 65 + 80) / 4 = 75
```

**Note:** We use **Math.round()** to ensure integer scores.

### Step 3: Calculate Overall Score

Overall score is the **simple average** of the three category scores.

**Formula:**
```typescript
Overall = avg(Technical, Emotional, Creative)
```

**Example:**
```typescript
category_scores = {
  technical: 75,
  emotional: 68,
  creative: 72
}

overall_score = (75 + 68 + 72) / 3 = 71.67 → 72 (rounded)
```

---

## Personality Typing

### MBTI Detection

The assessment infers **MBTI type** from 4 specific questions in the Personality section:

| Question | Dimension | Mapping |
|----------|-----------|---------|
| pers-1 | Recharging preference | **E/I** (Extroversion vs Introversion) |
| pers-2 | Learning style | **S/N** (Sensing vs Intuition) |
| pers-3 | Decision-making | **T/F** (Thinking vs Feeling) |
| pers-4 | Structure preference | **J/P** (Judging vs Perceiving) |

**Example Answer Analysis:**

**Question:** "How do you recharge after a stressful day?"
- **Answer:** "I need alone time to decompress - usually reading or going for a solo walk."
- **Claude Analysis:** Strong I (Introversion) signal - prefers solitude to recharge
- **MBTI Letter:** I

Repeat for all 4 dimensions → Final type: **"INTJ"**

### Enneagram Detection

Enneagram is inferred from questions about **stress response** (pers-5) and **core motivation** (pers-6).

| Type | Core Motivation | Stress Response |
|------|-----------------|-----------------|
| Type 1 (Perfectionist) | Being right, doing good | Becomes critical, rigid |
| Type 2 (Helper) | Being loved, needed | Becomes needy, possessive |
| Type 3 (Achiever) | Success, achievement | Works harder, burns out |
| Type 4 (Individualist) | Being unique, authentic | Becomes withdrawn, moody |
| Type 5 (Investigator) | Understanding, knowledge | Withdraws, isolates |
| Type 6 (Loyalist) | Security, support | Becomes anxious, paranoid |
| Type 7 (Enthusiast) | Fun, stimulation | Becomes scattered, impulsive |
| Type 8 (Challenger) | Control, strength | Becomes confrontational |
| Type 9 (Peacemaker) | Peace, harmony | Becomes passive, avoidant |

**Example:**
- **Core Motivation:** "I'm driven by the need to understand how things work"
- **Stress Response:** "I tend to withdraw and dive deep into research when stressed"
- **Claude Analysis:** Type 5 (Investigator) - knowledge-seeking + withdrawal pattern

### Personality Traits

Claude generates **3-5 adjectives** describing the candidate's personality based on all answers.

**Examples:**
- INTJ: ["Analytical", "Independent", "Strategic", "Curious"]
- ENFP: ["Enthusiastic", "Creative", "People-Oriented", "Adaptable"]
- ISTJ: ["Organized", "Reliable", "Detail-Oriented", "Practical"]

These traits appear in the public summary and help with role matching.

---

## AI Orchestration Sub-Scores

The AI & Systems Thinking section (5 questions) produces **5 sub-scores** that measure AI orchestration capability:

### 1. Technical Foundation (ai-orch-1)

**Question:** "Explain how the Internet works, from typing a URL to seeing a webpage"

**Measures:**
- Understanding of networking (DNS, HTTP, TCP/IP)
- Systems thinking (client-server model)
- Ability to explain complex concepts simply

**Scoring Guide:**
- 90+: Detailed, accurate explanation with multiple layers (DNS → TCP → HTTP → rendering)
- 70-89: Solid understanding with some technical depth
- 50-69: Basic understanding, missing key concepts
- <50: Vague or incorrect

### 2. Practical Use (ai-orch-2)

**Question:** "Describe a time you used AI tools to solve a problem. What did you build?"

**Measures:**
- Actual AI usage (not just theory)
- Specific tools mentioned (Claude, ChatGPT, Cursor, etc.)
- Vibe coding examples
- Problem-solving application

**Scoring Guide:**
- 90+: Multiple detailed examples, sophisticated use cases, shows mastery
- 70-89: Clear examples with specifics, regular AI usage
- 50-69: Generic examples, limited usage
- <50: No real examples or "I tried ChatGPT once"

### 3. Conceptual Understanding (ai-orch-3)

**Question:** "What's the difference between a prompt and an agent?"

**Measures:**
- Understanding of AI concepts
- Prompt engineering knowledge
- Agent architecture awareness

**Scoring Guide:**
- 90+: Nuanced explanation with examples, understands tool-use, MCP, orchestration
- 70-89: Clear distinction, understands both concepts
- 50-69: Basic understanding but fuzzy
- <50: Confuses the two or doesn't know

### 4. Systems Thinking (ai-orch-4)

**Question:** "Design a multi-agent system for [use case]. How would agents communicate? What could go wrong?"

**Measures:**
- Multi-agent design skills
- Failure mode awareness
- Handoff understanding
- Systems-level thinking

**Scoring Guide:**
- 90+: Sophisticated design with error handling, fallbacks, monitoring
- 70-89: Solid design with some failure mode awareness
- 50-69: Basic design, no failure consideration
- <50: Single-agent thinking or no design

### 5. Judgment (ai-orch-5)

**Question:** "When should you NOT use AI or agents?"

**Measures:**
- Maturity in AI usage
- Understanding of limitations
- Cost/benefit analysis
- Human-in-the-loop awareness

**Scoring Guide:**
- 90+: Nuanced analysis of trade-offs, multiple scenarios, shows wisdom
- 70-89: Clear understanding of limitations
- 50-69: Generic answers like "when it's important"
- <50: "Always use AI" or no real limitations

---

## Experience-Adjusted Scoring

We adjust expectations based on **years of experience** extracted from the Professional Background section (prof-1).

### Experience Brackets

| Years | Bracket | Adjusted Expectations |
|-------|---------|----------------------|
| 0-2 | Junior | Lower bar for work_history, gtm, executive_leadership (expect 40-60) |
| 3-5 | Mid-level | Normal expectations (expect 50-70) |
| 6-10 | Senior | Higher expectations (expect 60-80) |
| 10+ | Executive | Highest expectations (expect 70-85+) |

### Dimension Adjustments

**Work History:**
- Junior (0-2 years): 40-60 range acceptable
- Senior (10+ years): Expect 70+ with clear trajectory

**Executive Leadership:**
- Junior: 30-50 acceptable (no leadership expected)
- Mid-level: 50-70 (some team lead experience)
- Senior: 70+ (clear leadership track record)

**GTM:**
- Junior: 40-60 (basic understanding)
- Senior: 70+ (deep sales/revenue understanding)

**All Other Dimensions:**
- Experience doesn't excuse poor performance in IQ, EQ, self-awareness, etc.
- Technical ability expected to grow with experience

---

## Archetype & Tier Classification

### Archetype

A **2-3 word descriptor** that captures the candidate's unique profile.

**Examples:**
- "Technical Empath" (high technical + high EQ)
- "Strategic Builder" (high organization + high motivation)
- "Creative Problem-Solver" (high passions + high IQ)
- "Analytical Leader" (high IQ + high executive_leadership)
- "People-First Operator" (high empathy + high GTM)

**Archetype Confidence:**
- **High**: Clear, consistent signals across all answers
- **Medium**: Some signals, but some ambiguity or contradictions
- **Low**: Conflicting signals or insufficient detail

### Tier Classification

Based on **overall score**:

| Tier | Score Range | Meaning | Action |
|------|-------------|---------|--------|
| **top_1** | 85-100 | Exceptional across the board | Immediate hire, fight to get them |
| **benched** | 70-84 | Strong candidate, worth keeping warm | Add to talent bench, nurture relationship |
| **passed** | 0-69 | Not a fit at this time | Polite rejection, keep door open |

**Note:** Tier names reflect our "Talent Bench" concept where strong candidates are kept warm even if no immediate role.

---

## Badge Evaluation

After scoring, the system evaluates **badge criteria** to award achievements.

### Badge Categories

1. **Dimension Badges**: Exceptional score in single dimension (e.g., "AI Wizard" for ai_readiness ≥ 90)
2. **Category Badges**: Strong category score (e.g., "Tech Titan" for technical ≥ 85)
3. **Combo Badges**: Multiple dimensions above threshold (e.g., "Empathy Engine" for eq ≥ 80 AND empathy ≥ 85)
4. **Achievement Badges**: Overall score milestones (e.g., "Top 1%" for overall ≥ 90)

### Badge Evaluation Logic

```typescript
// Evaluate each badge definition
for (const badge of BADGE_DEFINITIONS) {
  if (evaluateBadge(badge, context)) {
    awardBadge(badge.id);
  }
}

// Badge criteria examples:
{
  id: 'ai-wizard',
  criteria: {
    type: 'single_dimension',
    conditions: [
      { dimension: 'ai_readiness', min_score: 90 }
    ]
  }
}

{
  id: 'technical-empath',
  criteria: {
    type: 'combo',
    conditions: [
      { category: 'technical', min_score: 80 },
      { dimension: 'empathy', min_score: 85 }
    ],
    requires_all: true // AND logic
  }
}
```

See `lib/assessment/badge-definitions.ts` for full badge catalog.

---

## Red Flags & Green Flags

### Red Flags (Concerns)

Claude automatically detects **red flags** that indicate serious concerns:

| Flag | Example | Impact |
|------|---------|--------|
| **Lack of Self-Awareness** | "I have no weaknesses" | Indicates low self_awareness, may not take feedback well |
| **Arrogant Tone** | Dismissive of others, "I'm the best" | Cultural fit concern, teamwork issues |
| **No Concrete Examples** | Generic, vague answers | Unable to demonstrate actual skills |
| **Copy-Pasted Answers** | Identical phrasing, obviously templated | Lack of authenticity |
| **Contradictory Statements** | Says collaborative but all examples solo | Inconsistent self-perception |
| **Unprofessional Language** | Profanity, inappropriate humor | Professionalism concern |

### Green Flags (Positive Signals)

| Flag | Example | Impact |
|------|---------|--------|
| **Specific Examples** | Detailed stories with outcomes | Demonstrates real experience |
| **High Self-Awareness** | Honest weakness + mitigation strategy | Growth mindset, coachable |
| **Growth Mindset** | Talks about learning from failures | Resilience, adaptability |
| **Structured Thinking** | Well-organized, logical answers | Strong communication, clarity |
| **Honest About Limitations** | "I don't know X but I'd learn it this way" | Intellectual honesty |
| **Learning from Failures** | Specific failure → lesson → improvement | Reflection, resilience |

---

## Recommendations & Role Matching

### Recommendation

A **1-2 sentence summary** of the hiring decision.

**Examples:**
- "Strong hire for technical CS roles. Exceptional AI orchestration skills combined with strategic thinking."
- "Worth keeping on talent bench. Strong technical foundation but needs more customer-facing experience."
- "Not a fit at this time. Lacks self-awareness and shows limited growth mindset."

### Best Fit Roles

Claude suggests **3-5 roles** based on dimension profile:

**Role Matching Logic:**

| Profile | Suggested Roles |
|---------|----------------|
| High technical + high AI | Solutions Engineer, Technical Account Manager |
| High EQ + high GTM | Senior Customer Success Manager, Account Executive |
| High organization + high leadership | CS Operations Lead, Team Lead |
| High empathy + high culture fit | Implementation Specialist, Onboarding Manager |
| High passions + high creativity | Product Evangelist, Developer Advocate |

**Examples:**
```json
{
  "best_fit_roles": [
    "Senior Technical Customer Success Manager",
    "Solutions Engineer",
    "Technical Account Manager",
    "CS Operations Lead",
    "Implementation Specialist"
  ]
}
```

---

## Summaries

### Public Summary

**Purpose:** Shareable, positive summary for the candidate

**Format:** 3-5 sentences

**Content:**
- Highlight top 2-3 strengths
- Mention personality type and archetype
- Focus on what they'd bring to a team
- Keep encouraging and professional

**Example:**
> "Highly analytical and technically proficient professional with exceptional AI readiness. Their strategic approach to problem-solving, combined with strong self-awareness, makes them well-suited for technical customer success roles. As an INTJ, they bring independent thinking and systems-level perspective to complex challenges."

### Detailed Summary

**Purpose:** Internal analysis for hiring managers

**Format:** Section-by-section breakdown (200-500 words)

**Content:**
- **Personality & Work Style**: MBTI/Enneagram analysis with supporting evidence
- **AI & Systems Thinking**: Performance on all 5 AI questions with specific examples
- **Professional Context**: Experience level, goals, self-assessment accuracy
- **Culture & Self-Awareness**: Fit signals, humor alignment, weakness acknowledgment

**Example:**
> **Personality & Work Style**: Clear INTJ profile - prefers solitude for recharging (pers-1), focuses on patterns and concepts (pers-2), uses logical analysis in decisions (pers-3), and values structured planning (pers-4). Type 5 Enneagram (Investigator) evident from curiosity-driven motivation and analytical stress response. Strong self-awareness throughout answers.
>
> **AI & Systems Thinking**: Exceptional performance in this section. Demonstrated deep technical understanding of networking (ai-orch-1), active use of AI tools with specific examples like building a Cursor workflow (ai-orch-2), clear grasp of prompt vs agent concepts (ai-orch-3), thoughtful multi-agent system design with failure mode awareness (ai-orch-4), and mature judgment on AI limitations (ai-orch-5).
>
> **Professional Context**: Mid-level experience (5 years) with clear upward trajectory. Self-assessed as 7/10 technical with strong supporting evidence. Clear 3-year vision showing ambition and realistic goal-setting.
>
> **Culture & Self-Awareness**: Strong cultural fit - specific humor preferences with reasoning, honest weakness acknowledgment with compensation system. No red flags detected.

---

## Validation & Quality Assurance

### Score Validation

All scores undergo **multi-layer validation**:

1. **Schema Validation** (Zod): Ensures all fields present and correct types
2. **Range Validation**: All dimension scores 0-100
3. **Consistency Validation**: Category scores align with dimension scores
4. **Flag Validation**: Red flags must have supporting evidence in detailed summary

### Error Handling

If Claude returns invalid scores:
1. **Response Parsing Error**: Claude didn't wrap JSON in `<scoring>` tags
2. **Validation Error**: Scores out of range or missing fields
3. **Consistency Error**: Contradictory tier/score (e.g., tier "top_1" but overall score 65)

All errors logged with context for debugging.

---

## Performance & Scalability

### Claude API Performance

- **Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Max Tokens**: 8192 (allows for detailed summaries)
- **Temperature**: 0.3 (balanced between consistency and nuance)
- **Latency**: 5-15 seconds per assessment (varies by API load)
- **Cost**: ~$0.15 per assessment (input + output tokens)

### Future Optimizations

1. **Caching**: Cache identical answer sets (unlikely but possible)
2. **Batch Scoring**: Score multiple assessments in parallel
3. **Model Tuning**: Fine-tune on historical assessments for better calibration
4. **Prompt Optimization**: A/B test prompt variations for consistency

---

## Appendix: Scoring Rubrics

See `lib/assessment/scoring-rubrics.ts` for detailed dimension-specific rubrics used by Claude.
