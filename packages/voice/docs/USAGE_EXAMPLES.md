# Justin's Voice MCP Server - Usage Examples

This guide shows real-world examples of using the Justin Voice MCP server with Claude Desktop.

## Setup

1. Build the server:
   ```bash
   cd packages/justin-voice-server
   npm install
   npm run build
   npm run extract-templates
   ```

2. Add to Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):
   ```json
   {
     "mcpServers": {
       "justin-voice": {
         "command": "node",
         "args": [
           "C:\\Users\\strac\\dev\\MCP-World\\packages\\justin-voice-server\\dist\\index.js"
         ]
       }
     }
   }
   ```

3. Restart Claude Desktop

## Example Conversations

### Example 1: Writing a Product Launch Post

**You:**
```
I need to write a LinkedIn post announcing our new AI-powered customer success platform.
Use justin-voice to help me write something authentic and engaging.
```

**Claude (using justin-voice):**
```
Let me check the justin-voice server for the right template blend...

[Uses get_blend_recommendation with context: "product launch"]

I recommend using "THE AUTHENTIC FOUNDER" blend (O1 + M1 + E2).
This combines vulnerability opening, story arc middle, and invitation ending.

Let me generate a draft:

[Uses generate_content with blendName: "THE AUTHENTIC FOUNDER"]

Here's a draft in Justin's voice:

---

I was sitting in a Zoom call at 11pm (again -- my therapist has thoughts on this),
watching a customer struggle with their renewal process. The third one that week.

And that's when it hit me.

We've been building customer success software for three years. Dashboards. Analytics.
Reports that no one reads. All the shit that's supposed to help -- but here we are,
watching smart people drowning in data while their customers slip away.

So we started over.

Not with features. Not with a roadmap. With Sarah, the CS manager who told me
(and I quote): "I don't need more dashboards. I need to know WHEN to call and WHAT to say."

Six months of late nights later (some of those Zoom calls were necessary, most weren't),
we built something different. An AI that actually understands your customer conversations.
That tells you the renewal is at risk before the metrics catch up. That suggests what to
say because it learned from your best CS reps.

We're calling it [Platform Name].

If you're tired of guessing which customers need help, let's talk.

Does this land right?
```

---

### Example 2: Analyzing Your Own Writing

**You:**
```
Can you analyze this draft I wrote and tell me how to make it more Justin-like?

"We are excited to announce our new platform features. These enhancements will
improve your customer success operations and provide actionable insights that
drive value. Our team has worked hard to deliver these capabilities."
```

**Claude (using justin-voice):**
```
[Uses analyze_voice tool]

Voice Score: 15/100

Strengths: None identified

Issues found:
- Corporate jargon detected (3 instances: "actionable insights", "drive value", "capabilities")
- No parenthetical asides
- No short punchy sentences
- Missing self-deprecation
- Too formal - needs casual language
- No questions for engagement
- Sounds like a press release, not Justin

Here's how to fix it:

1. Kill the corporate speak ("actionable insights" → what you actually learn)
2. Add parenthetical asides (your signature move)
3. Lead with vulnerability or a specific story
4. Break up long sentences
5. Ask a real question at the end

Want me to rewrite this in Justin's voice?
```

**You:**
```
Yes please!
```

**Claude:**
```
[Uses generate_content]

Here's the Justin version:

---

Remember that feature we promised you six months ago? (the one I kept saying was
"almost done" -- it wasn't)

It's actually done now.

I'm not going to tell you it's going to "transform your workflow" or "unlock synergies"
or whatever the fuck the marketing team wanted me to say. What I will tell you is this:

Three customers asked for it. We built it. It does what they needed.

If you're dealing with [specific problem], this might help. If not, ignore this email
and we'll see you next month.

Sound interesting?

---

Much more Justin. The vulnerability (admitting the delay), the parenthetical aside,
the profanity for rhythm, the anti-corporate voice, and the genuine question at the end.
```

---

### Example 3: Getting Template Recommendations

**You:**
```
I want to write a controversial take about how customer success metrics are broken.
What template blend should I use from justin-voice?
```

**Claude:**
```
[Uses get_blend_recommendation with context: "hot take", mood: "punchy"]

Perfect! For a controversial take, I recommend:

**THE PROVOCATEUR**

Components:
- O5: Provocative Question (opening)
- M2: Philosophical Escalation (middle)
- E5: Practical Application (ending)

Why this works:
"Provocation stops scroll, philosophy backs it up, redirect offers alternative"

Typical performance: High shares (30-50), very high comments (100+, often contentious)

This blend is perfect for challenging assumptions and stirring debate.

Example structure:
1. Open with a provocative question that challenges the orthodoxy
2. Build philosophical argument (specific → pattern → universal truth)
3. End with practical alternative approach

Want me to draft something using this blend?
```

---

### Example 4: Browsing Available Templates

**You:**
```
Show me all the beginning templates available in justin-voice
```

**Claude:**
```
[Reads justin://templates/beginnings]

Here are all the beginning templates Justin uses:

**O1: VULNERABILITY**
- "Start with personal moment of uncertainty/failure/fear"
- Example: "I was sitting in my car in the Whole Foods parking lot, having just been laid off..."
- Use for: Product launches, founder updates, authentic connection
- Energy: Melancholy, reflective, honest

**O2: ABSURDIST OBSERVATION**
- "Mundane situation → cosmic/existential observation"
- Example: "You know that feeling at the DMV when time moves differently?"
- Use for: Event invites, playful content, breaking expectations
- Energy: Playful, experimental, contrarian

**O4: PATTERN RECOGNITION**
- "Three things happened this week that seem unrelated..."
- Use for: Thought leadership, industry commentary, insights
- Energy: Philosophical, analytical, connecting-dots

**O5: PROVOCATIVE QUESTION**
- "Challenge assumption immediately"
- Example: "What if everything you know about customer success is wrong?"
- Use for: Hot takes, contrarian views, engagement-bait
- Energy: Punchy, aggressive, challenging

**O6: SPECIFIC DETAIL**
- "Lead with the weird/interesting/surprising fact"
- Example: "Chris increased his renewal rate by 47% in 90 days..."
- Use for: Customer stories, case studies, proof points
- Energy: Energized, tactical, evidence-driven

Which one feels right for what you're writing?
```

---

### Example 5: Improving a Specific Sentence

**You:**
```
This sentence doesn't feel right: "I think the industry needs to reconsider its approach."

How would Justin say this?
```

**Claude:**
```
[Uses suggest_improvements tool]

Issues with current version:
- Too hedged ("I think" - own it!)
- Corporate language ("reconsider its approach")
- No personality or punch
- Missing Justin's voice markers

Justin versions (pick your energy):

**Vulnerable/reflective:**
"We've been doing this wrong -- and I'm as guilty as anyone."

**Punchy/provocative:**
"The industry is fucked. (and we all know it, we just won't say it)"

**Absurdist/playful:**
"You know that moment when you realize everyone's been reading the map upside down?
(that's where we are with this)"

**Philosophical:**
"Here's the thing nobody wants to admit: we optimized for the wrong metrics."

All of these:
- Remove hedging language
- Add parenthetical asides or dashes
- Use concrete, conversational words
- Take a stance (don't "think" -- assert)
```

---

### Example 6: Checking Writing Rules

**You:**
```
What are Justin's core writing rules from justin-voice?
```

**Claude:**
```
[Reads justin://rules]

Justin's Core Writing Rules:

**Always:**
- Parenthetical asides (like this)
- Self-deprecating humor with specific details
- Mix high/low vocabulary in same sentence
- Strategic profanity for rhythm (not shock)
- Double hyphen (--) NEVER em dash (—)
- Spacing = pacing (visual rhythm matters)
- Short sentences. Punchy paragraphs.
- Visual rhythm (reader sees shape before reading)

**Never:**
- Corporate jargon
- Thought leader voice
- Apologizing unnecessarily
- Hiding problems
- Just bullet points
- Em dash (—) - this is an AI tell

**The Vulnerability Boundary:**
- YES: Refer to past struggles ("my daily panic attacks")
- NO: Present weakness ("I'm terrified right now")
- The line: Refer to the mess, don't be IN the mess

**Formatting as Rhythm:**
- Double space = pause in conversation
- Single line = rapid fire energy
- Long paragraph = "settle in, story time" (but break every ~100 words)

These rules create Justin's distinctive voice.
```

---

## Advanced Usage

### Custom Template Combination

```
I want to write something with:
- Vulnerability opening (O1)
- Story arc middle (M1)
- Philosophical ending (E6)

Can you generate that using justin-voice?
```

### Voice Score Improvement Workflow

```
1. Write your draft
2. Ask Claude to analyze it with justin-voice
3. Review the voice score and suggestions
4. Implement improvements
5. Re-analyze until score is 70+
6. Ship it!
```

### Blend Recipe Testing

```
Browse all blend recipes from justin-voice and help me pick the right one
for announcing our team expansion.
```

## Tips for Best Results

1. **Be specific about context**: "product launch" vs "personal story" vs "hot take"
2. **Include topic/subject**: More context = better output
3. **Iterate**: First draft → analyze → improve → re-analyze
4. **Mix templates**: Don't be afraid to combine different elements
5. **Check the score**: Aim for 70+ for good Justin voice

## Troubleshooting

**Server not showing up in Claude Desktop:**
- Check the config file path is correct
- Restart Claude Desktop completely
- Verify the server builds without errors: `npm run build`

**Low voice scores:**
- Add parenthetical asides
- Replace em dashes with double hyphens
- Include self-deprecating humor
- Remove corporate jargon
- Add short punchy sentences

**Templates feel generic:**
- Provide more context in your request
- Specify the mood/energy you want
- Use real examples from your situation
- Iterate on the output

## Getting Help

- Check `README.md` for full documentation
- Review template extraction: `npm run extract-templates`
- Test server directly: `node test-server.js`
- Read Justin OS docs in `justin_os/` for deep context
