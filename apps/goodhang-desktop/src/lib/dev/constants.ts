/**
 * Dev Mode Constants
 *
 * Test data and configuration for development/testing.
 * These values are only used when dev mode is enabled.
 */

// Scott's test user ID
export const DEV_USER_ID = '083591d4-7008-4538-a929-c1e7d0c9bfb0';

/**
 * Mock assessment answers that generate a realistic D&D character profile.
 * These answers are designed to produce interesting attribute distributions.
 */
export const MOCK_ASSESSMENT_ANSWERS: Record<string, string> = {
  // Section: Your Story
  'a1-turning-point': `The moment that fundamentally changed me was when I quit my corporate job to start my own company. I had spent years climbing the ladder, doing what was expected, but I felt hollow inside. One day, I realized I was building someone else's dream. The fear of failure was real, but the fear of regret was stronger. Taking that leap taught me that security is an illusion - the only real security comes from betting on yourself.`,

  'a2-happiest-memory': `My happiest memory is the day my daughter was born. Time stopped. All the noise of ambition, deadlines, and achievements just melted away. I held this tiny human who looked at me with complete trust, and I understood what actually matters. It wasn't about success or money - it was about connection, presence, being there for the people who need you.`,

  'a3-difficult-time': `I went through a devastating business failure in my early 30s. Lost everything - savings, reputation, confidence. For months, I couldn't get out of bed. What got me through was one friend who showed up every day, not to fix things, but just to sit with me. I learned that asking for help isn't weakness - it's the bravest thing you can do. I also learned that failure isn't the end; it's data.`,

  'a4-redemption': `Getting fired from my dream job felt like the worst thing that could happen. I was humiliated and lost. But it forced me to examine what I really wanted versus what I thought I should want. That painful ejection led me to discover my actual passion - building tools that help other people succeed. The job I lost was prestigious but meaningless to me. What I do now matters.`,

  // Section: Who You Are
  'b1-failed-someone': `I failed my younger brother when he needed guidance. He was struggling with addiction, and instead of being patient and present, I lectured him. I thought I was helping by being tough, but I was just making myself feel better. It took years to repair that relationship. I learned that being right is worthless if it costs you the people you love.`,

  'b2-core-identity': `At my core, I'm a builder and a connector. Strip away everything external, and what remains is an insatiable curiosity about how things work and a deep need to bring people together around ideas. I can't not create. I can't not try to understand. And I can't watch people struggle alone when I might be able to help.`,

  'b3-simple-thing': `Coffee in the morning, alone, before anyone else is awake. Those 30 minutes of silence where my thoughts are my own. No inputs, no demands, just me and my mind wandering. It's where my best ideas come from and where I find the peace that carries me through chaotic days.`,

  // Section: How You Connect
  'c1-relationship-need': `I need people to be patient with my intensity. I get deeply invested in ideas and can come across as overwhelming. What I rarely ask for is space to be imperfect - to share half-formed thoughts without being judged. I hide behind competence because vulnerability feels dangerous.`,

  'c2-intellectual-gap': `I believe deeply in work-life balance and being present with family. But in practice, I'm constantly pulled toward work. My mind never stops. I know intellectually that my kids need me present, not productive. But breaking the addiction to achievement is harder than any business problem I've solved.`,

  'c3-happiness-barrier': `Honestly? My own expectations. I've achieved most of the goals I set out to achieve, and each one felt empty shortly after. The barrier isn't external - it's this internal voice that says "not enough, keep going." Learning to be satisfied, to rest, to enjoy what I have without immediately reaching for the next thing - that's my real challenge.`,
};
