// Analysis of outstanding questions against Scott's corpus

const outstandingQuestions = [
  // COMMUNICATION (3)
  { slug: "E11", text: "When you're working with someone, do you prefer: [Direct recommendations / Facilitated thinking / Just execution]", category: "communication" },
  { slug: "E12", text: "What kind of input feels helpful vs. annoying?", category: "communication" },
  { slug: "E13", text: "How should someone push back on you if they think you're wrong?", category: "communication" },

  // CONDITIONS (4)
  { slug: "fos-cond-1", text: "Do you have any neurodivergent patterns (ADHD, autism, etc.) that affect how you work?", category: "conditions" },
  { slug: "fos-cond-3", text: "What time of day are you at your best? When are you worst?", category: "conditions" },
  { slug: "fos-cond-4", text: "What does context-switching cost you? How long to get back into flow?", category: "conditions" },
  { slug: "fos-cond-5", text: "What environmental factors help or hurt your focus? (noise, people, etc.)", category: "conditions" },

  // CONNECT (2)
  { slug: "core-connect-1", text: "What kind of people do you work best with?", category: "connect" },
  { slug: "core-connect-3", text: "How do you prefer to receive feedback? What works, what doesn't?", category: "connect" },

  // CRISIS (5) - FOS set
  { slug: "fos-crisis-1", text: "When you're facing a big decision and feeling overwhelmed, what does that look like? What are the signs?", category: "crisis" },
  { slug: "fos-crisis-2", text: "What does 'stuck' look like for you? How do you know when you're there?", category: "crisis" },
  { slug: "fos-crisis-3", text: "When you're stuck, what actually helps you get unstuck?", category: "crisis" },
  { slug: "fos-crisis-4", text: "What makes overwhelm worse? What should people avoid doing when you're in that state?", category: "crisis" },
  { slug: "fos-crisis-5", text: "Who do you reach out to when things get hard? What kind of support do you actually want?", category: "crisis" },

  // CRISIS-RECOVERY (4) - E set
  { slug: "E15", text: "What does 'stuck' look like for you? How do you know when you're there?", category: "crisis-recovery" },
  { slug: "E16", text: "What helps you get unstuck? What's worked in the past?", category: "crisis-recovery" },
  { slug: "E17", text: "What makes things worse when you're struggling? What should people NOT do?", category: "crisis-recovery" },
  { slug: "E19", text: "When you're in crisis mode, do you want: [Space / Help carrying load / Distraction]", category: "crisis-recovery" },

  // CURRENT (4)
  { slug: "fos-current-1", text: "What's currently on fire? What's taking most of your energy right now?", category: "current" },
  { slug: "fos-current-2", text: "Where's your energy level right now - high, medium, low?", category: "current" },
  { slug: "fos-current-3", text: "What's working well right now? What are you proud of?", category: "current" },
  { slug: "fos-current-4", text: "What bandwidth do you have for new things? Be honest.", category: "current" },

  // D-SERIES (8)
  { slug: "d01-energy-source", text: "When you need to recharge after a hard day, do you seek out people or seek solitude?", category: "d-series" },
  { slug: "d02-time-orientation", text: "Do you prefer to plan your week in advance or let things flow based on energy and opportunity?", category: "d-series" },
  { slug: "d04-response-pattern", text: "When a friend comes to you with a problem, is your first instinct to help fix it or to help them feel heard?", category: "d-series" },
  { slug: "d05-collaboration", text: "In a group project, do you naturally take the lead or prefer to support someone else's vision?", category: "d-series" },
  { slug: "d07-leadership-filter", text: "As a leader, do you share everything with your team or filter information to protect focus?", category: "d-series" },
  { slug: "d08-pushback-style", text: "When you disagree with someone's approach, do you say it directly or guide them to see it themselves?", category: "d-series" },
  { slug: "d09-feedback-timing", text: "When you have feedback for someone, do you batch it for the right moment or share it immediately?", category: "d-series" },
  { slug: "d10-completion", text: "When shipping work, do you polish until it's perfect or ship at 80% and iterate?", category: "d-series" },

  // DECISION-MAKING (4)
  { slug: "E01", text: "When you're facing a big decision and feeling overwhelmed, what does that look like for you? What are the signs?", category: "decision-making" },
  { slug: "E02", text: "When you have too many options, what's your default response?", category: "decision-making" },
  { slug: "E03", text: "Do you prefer someone to: [Present options / Make recommendation / Just make the call]", category: "decision-making" },
  { slug: "E04", text: "What kinds of decisions drain you the most? What kinds energize you?", category: "decision-making" },

  // ENERGY-COGNITIVE (6)
  { slug: "E05", text: "When are you at your best? Time of day, conditions, context?", category: "energy-cognitive" },
  { slug: "E06", text: "What drains you faster than people might expect?", category: "energy-cognitive" },
  { slug: "E07", text: "How do you know when you're avoiding something? What does that look like?", category: "energy-cognitive" },
  { slug: "E08", text: "What does your 'overwhelm spiral' look like? How does it start, and how does it usually resolve?", category: "energy-cognitive" },
  { slug: "E09", text: "Do you have any neurodivergent patterns (ADHD, etc.) that affect how you work?", category: "energy-cognitive" },
  { slug: "E10", text: "What kind of structure helps you? What kind of structure feels constraining?", category: "energy-cognitive" },

  // SELF (2)
  { slug: "core-self-1", text: "What are you really good at that most people don't know about?", category: "self" },
  { slug: "core-self-3", text: "When are you at your best? Describe the conditions.", category: "self" },

  // WORK-STYLE (4)
  { slug: "E20", text: "How do you like to be helped? What does good support look like?", category: "work-style" },
  { slug: "E21", text: "How should priorities be presented to you? (List, single focus, deadlines, etc.)", category: "work-style" },
  { slug: "E23", text: "What does 'done enough' look like for you? Or do you struggle with that?", category: "work-style" },
  { slug: "E24", text: "Is there anything else about how you work that would be helpful to know?", category: "work-style" },
];

console.log(`\n${'='.repeat(80)}`);
console.log('ANALYSIS: Outstanding Questions vs Scott\'s Corpus');
console.log(`${'='.repeat(80)}\n`);

// Now let me analyze each one based on what I read in the DIGEST and TRANSCRIPT
