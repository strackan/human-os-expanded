/**
 * Dev Mode Constants
 *
 * Test data and configuration for development/testing.
 * These values are only used when dev mode is enabled.
 */

// Scott's test user ID
export const DEV_USER_ID = '083591d4-7008-4538-a929-c1e7d0c9bfb0';

/**
 * Mock assessment answers for the FOS Consolidated Interview.
 * 12 questions across 3 sections: Your Story, Who You Are, Work & AI.
 * These answers are designed to produce interesting profile attributes.
 */
export const MOCK_ASSESSMENT_ANSWERS: Record<string, string> = {
  // ==========================================================================
  // Section 1: Your Story (4 questions)
  // ==========================================================================

  'fos-interview-a1-turning-point': `The moment that fundamentally changed me was when I quit my corporate job to start my own company. I had spent years climbing the ladder, doing what was expected, but I felt hollow inside. One day, I realized I was building someone else's dream. The fear of failure was real, but the fear of regret was stronger. Taking that leap taught me that security is an illusion - the only real security comes from betting on yourself.`,

  'fos-interview-a2-happiest-memory': `My happiest memory is the day my daughter was born. Time stopped. All the noise of ambition, deadlines, and achievements just melted away. I held this tiny human who looked at me with complete trust, and I understood what actually matters. It wasn't about success or money - it was about connection, presence, being there for the people who need you.`,

  'fos-interview-a3-difficult-time': `I went through a devastating business failure in my early 30s. Lost everything - savings, reputation, confidence. For months, I couldn't get out of bed. What got me through was one friend who showed up every day, not to fix things, but just to sit with me. I learned that asking for help isn't weakness - it's the bravest thing you can do. I also learned that failure isn't the end; it's data.`,

  'fos-interview-a4-redemption': `Getting fired from my dream job felt like the worst thing that could happen. I was humiliated and lost. But it forced me to examine what I really wanted versus what I thought I should want. That painful ejection led me to discover my actual passion - building tools that help other people succeed. The job I lost was prestigious but meaningless to me. What I do now matters.`,

  // ==========================================================================
  // Section 2: Who You Are (3 questions)
  // ==========================================================================

  'fos-interview-b1-core-identity': `At my core, I'm a builder and a connector. Strip away everything external, and what remains is an insatiable curiosity about how things work and a deep need to bring people together around ideas. I can't not create. I can't not try to understand. And I can't watch people struggle alone when I might be able to help.`,

  'fos-interview-b2-simple-thing': `Coffee in the morning, alone, before anyone else is awake. Those 30 minutes of silence where my thoughts are my own. No inputs, no demands, just me and my mind wandering. It's where my best ideas come from and where I find the peace that carries me through chaotic days.`,

  'fos-interview-b3-relationship-need': `I need people to be patient with my intensity. I get deeply invested in ideas and can come across as overwhelming. What I rarely ask for is space to be imperfect - to share half-formed thoughts without being judged. I hide behind competence because vulnerability feels dangerous. I want people to see me struggle sometimes without losing confidence in me.`,

  // ==========================================================================
  // Section 3: Work & AI (5 questions)
  // ==========================================================================

  'fos-interview-c1-peak-performance': `I'm at my absolute best between 6-10am, before anyone else is awake. Quiet house, coffee, no Slack notifications - that's when I can do deep thinking. My worst times are right after lunch when my energy crashes, and late afternoon when context-switching kills me. I need large blocks of uninterrupted time for creative work. Open offices destroy me. Background music helps, but no lyrics. When I'm stressed, I retreat and go quiet, which people misread as disengagement.`,

  'fos-interview-c2-struggle-recovery': `When things get hard, I need space first - time to process alone before talking it through. Jumping straight to problem-solving mode makes it worse. What actually helps is someone acknowledging that the situation is hard, not immediately pivoting to solutions. Physical activity - running, lifting - helps me metabolize stress. What makes it worse is people trying to cheer me up or minimize the problem. I want practical support, not pep talks.`,

  'fos-interview-c3-feedback-challenge': `I prefer direct, specific feedback - tell me exactly what's not working and why. Vague "concerns" drive me crazy. Pushback lands well when it comes with curiosity - "Have you considered X?" rather than "You're wrong about Y." I need time to process criticism; immediate responses from me are usually defensive. Written feedback first, then discussion, works best. Don't sandwich criticism between compliments - I'll miss the real message.`,

  'fos-interview-c4-social-rapport': `I want to hang out with people who are genuinely curious and not performative. Dry humor, self-deprecation, intellectual banter - that's my jam. I can't stand people who take themselves too seriously or need to be the smartest person in the room. I gravitate toward builders who are actually making things, not just talking about making things. Authenticity over polish. I'd rather have a weird interesting conversation than small talk about the weather.`,

  'fos-interview-c5-ideal-ai': `The most important considerations: (1) Remember context across conversations - I hate re-explaining my situation every time. (2) Push back when I'm wrong or missing something obvious - I want a thought partner, not a yes-machine. (3) Match my energy and communication style - be direct, skip the preamble, get to the point. (4) Know when to be concise vs when I need deep exploration. One more thing: I want an AI that can call out my patterns - when I'm procrastinating, avoiding hard conversations, or falling into old traps. That self-awareness support would be invaluable.`,
};
