import { useState, useEffect, useCallback, ReactNode } from 'react';

interface Slide {
  id: string;
  bg: string;
  accent: string;
  content: ReactNode;
  isInteractive?: boolean;
}

const slides: Slide[] = [
  {
    id: 'hook',
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    accent: '#ff3366',
    content: (
      <>
        <div className="slide-label">THE SHIFT</div>
        <h1>People stopped<br/><span className="accent">Googling.</span></h1>
        <p className="subtitle">They started <em>asking.</em></p>
      </>
    )
  },
  {
    id: 'trend',
    bg: 'linear-gradient(135deg, #ff3366 0%, #ff6b35 100%)',
    accent: '#ffffff',
    content: (
      <>
        <div className="slide-label">THE TREND</div>
        <h1>AI is getting<br/><span className="accent">personal.</span></h1>
        <p className="subtitle">Adaptable. Preferred. Trusted.</p>
        <p className="detail">This only accelerates.</p>
      </>
    )
  },
  {
    id: 'question',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    accent: '#00d4ff',
    content: (
      <>
        <div className="slide-label">THE QUESTION</div>
        <h1>How often does AI<br/><span className="accent">recommend your brand?</span></h1>
      </>
    )
  },
  {
    id: 'followup',
    bg: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
    accent: '#ffcc00',
    content: (
      <>
        <div className="slide-label">AND MORE IMPORTANTLY</div>
        <h1>How does it<br/><span className="accent">make that choice?</span></h1>
      </>
    )
  },
  {
    id: 'problem',
    bg: 'linear-gradient(135deg, #2d1f3d 0%, #1a1a2e 100%)',
    accent: '#ff3366',
    content: (
      <>
        <div className="slide-label">RIGHT NOW</div>
        <h1><span className="accent">Nobody</span><br/>knows.</h1>
        <p className="subtitle">It's completely opaque.</p>
      </>
    )
  },
  {
    id: 'opportunity-1',
    bg: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
    accent: '#ffffff',
    content: (
      <>
        <div className="slide-label">THE OPPORTUNITY</div>
        <h1>AI recommendation<br/>is the <span className="accent">new SEO.</span></h1>
      </>
    )
  },
  {
    id: 'opportunity-2',
    bg: 'linear-gradient(135deg, #ff6b35 0%, #ff3366 100%)',
    accent: '#ffffff',
    content: (
      <>
        <div className="slide-label">THE OPPORTUNITY</div>
        <h1>And someone gets to<br/><span className="accent">define the metric.</span></h1>
      </>
    )
  },
  {
    id: 'introduce',
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    accent: '#ff3366',
    content: (
      <>
        <div className="slide-label">INTRODUCING</div>
        <h1 className="hero-text"><span className="accent">ARI</span></h1>
        <p className="subtitle">AI Recommendation Index</p>
      </>
    )
  },
  {
    id: 'what-ari-does',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)',
    accent: '#00d4ff',
    content: (
      <>
        <div className="slide-label">WHAT ARI DOES</div>
        <h1><span className="accent">ARI captures</span><br/>how often AI recommends you.</h1>
        <p className="subtitle" style={{marginTop: '2rem'}}><span className="accent">ARI+ explains</span> why.<br/>And what to do about it.</p>
      </>
    )
  },
  {
    id: 'method-1',
    bg: 'linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)',
    accent: '#ffcc00',
    content: (
      <>
        <div className="slide-label">THE METHOD</div>
        <h1>Not a poll.<br/>A <span className="accent">scientific process.</span></h1>
      </>
    )
  },
  {
    id: 'method-2',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 100%)',
    accent: '#ff3366',
    content: (
      <>
        <div className="slide-label">THE METHOD</div>
        <div className="method-grid">
          <div className="method-item">
            <span className="method-number">→</span>
            <span>Multiple <span className="accent">personas</span></span>
          </div>
          <div className="method-item">
            <span className="method-number">→</span>
            <span>Multiple <span className="accent">scenarios</span></span>
          </div>
          <div className="method-item">
            <span className="method-number">→</span>
            <span>Multiple <span className="accent">AI models</span></span>
          </div>
          <div className="method-item">
            <span className="method-number">→</span>
            <span>Top 1, 3, 5, <span className="accent">10</span></span>
          </div>
        </div>
      </>
    )
  },
  {
    id: 'method-3',
    bg: 'linear-gradient(135deg, #ff3366 0%, #ff6b35 100%)',
    accent: '#ffffff',
    content: (
      <>
        <div className="slide-label">ARI+ GOES DEEPER</div>
        <h2 className="quote">"Why didn't you choose them?"</h2>
        <h2 className="quote">"What would change your mind?"</h2>
        <h2 className="quote">"What's missing?"</h2>
      </>
    )
  },
  {
    id: 'pr-angle-1',
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #16213e 100%)',
    accent: '#00d4ff',
    content: (
      <>
        <div className="slide-label">FOR PR & MEDIA</div>
        <h1>Finally:<br/><span className="accent">Attribution.</span></h1>
      </>
    )
  },
  {
    id: 'pr-angle-2',
    bg: 'linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)',
    accent: '#ffcc00',
    content: (
      <>
        <div className="slide-label">FOR PR & MEDIA</div>
        <h1>"We increased your ARI<br/>by <span className="accent">15 points.</span>"</h1>
        <p className="subtitle">That's proof.</p>
      </>
    )
  },
  {
    id: 'bigger-1',
    bg: 'linear-gradient(135deg, #2d1f3d 0%, #1a1a2e 100%)',
    accent: '#ff3366',
    content: (
      <>
        <div className="slide-label">THE BIGGER PICTURE</div>
        <h1>ARI is the new<br/><span className="accent">Q Rating.</span></h1>
        <p className="subtitle">Settles debates. Defines popularity.</p>
      </>
    )
  },
  {
    id: 'bigger-2',
    bg: 'linear-gradient(135deg, #ff6b35 0%, #ffcc00 100%)',
    accent: '#0a0a0a',
    content: (
      <>
        <div className="slide-label">THE BIGGER PICTURE</div>
        <h1>First mover<br/><span className="accent">defines the category.</span></h1>
      </>
    )
  },
  {
    id: 'time-machine',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    accent: '#00d4ff',
    content: (
      <>
        <div className="slide-label">A QUESTION</div>
        <h1>What if you knew<br/>about SEO in <span className="accent">2003?</span></h1>
      </>
    )
  },
  {
    id: 'the-bet',
    bg: 'linear-gradient(135deg, #16213e 0%, #0f0f23 100%)',
    accent: '#ffcc00',
    content: (
      <>
        <div className="slide-label">THE BET</div>
        <h1><span className="accent">$250K</span> spread across<br/>the ecosystem.</h1>
      </>
    )
  },
  {
    id: 'ecosystem',
    bg: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
    accent: '#ff3366',
    content: (
      <>
        <div className="slide-label">THE ECOSYSTEM</div>
        <div className="method-grid">
          <div className="method-item">
            <span className="method-number">→</span>
            <span><span className="accent">Google</span> IPO</span>
          </div>
          <div className="method-item">
            <span className="method-number">→</span>
            <span>SEO <span className="accent">SaaS</span> tools</span>
          </div>
          <div className="method-item">
            <span className="method-number">→</span>
            <span><span className="accent">Paid search</span> agencies</span>
          </div>
          <div className="method-item">
            <span className="method-number">→</span>
            <span>SEO <span className="accent">consultants</span></span>
          </div>
        </div>
      </>
    )
  },
  {
    id: 'seo-now',
    bg: 'linear-gradient(135deg, #ff3366 0%, #ff6b35 100%)',
    accent: '#ffffff',
    content: (
      <>
        <div className="slide-label">TODAY</div>
        <h1>SEO is a<br/><span className="accent">$75B</span> market.</h1>
        <p className="subtitle">Heading to $266B by 2034.</p>
      </>
    )
  },
  {
    id: 'the-returns',
    bg: 'linear-gradient(135deg, #ff6b35 0%, #ffcc00 100%)',
    accent: '#0a0a0a',
    content: (
      <>
        <div className="slide-label">BLENDED RETURNS</div>
        <h1><span className="accent">$250K</span> in 2003</h1>
        <p className="subtitle" style={{marginTop: '2rem', fontSize: 'clamp(2rem, 5vw, 4rem)'}}>→ <span className="accent">$25-50M+</span> today</p>
      </>
    )
  },
  {
    id: 'didnt-need',
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    accent: '#00d4ff',
    content: (
      <>
        <div className="slide-label">THE POINT</div>
        <h1>You didn't need to<br/><span className="accent">pick the winner.</span></h1>
        <p className="subtitle">You just needed to see the shift.</p>
      </>
    )
  },
  {
    id: 'ai-is-2003',
    bg: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
    accent: '#ffffff',
    content: (
      <>
        <div className="slide-label">RIGHT NOW</div>
        <h1>AI recommendation<br/>is <span className="accent">2003.</span></h1>
      </>
    )
  },
  {
    id: 'the-ask',
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    accent: '#ff3366',
    content: (
      <>
        <div className="slide-label">THE ASK</div>
        <h1>Three ways<br/><span className="accent">in.</span></h1>
      </>
    )
  },
  {
    id: 'tiers',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    accent: '#00d4ff',
    isInteractive: true,
    content: null
  },
  {
    id: 'end',
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    accent: '#ffcc00',
    content: (
      <>
        <div className="slide-label">12% OF WHAT?</div>
        <h1>Glad you<br/><span className="accent">asked.</span></h1>
      </>
    )
  },
  {
    id: 'human-os',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 100%)',
    accent: '#a855f7',
    content: (
      <>
        <div className="slide-label">PORTFOLIO</div>
        <h1 className="portfolio-title"><span className="accent">Human-OS</span></h1>
        <p className="portfolio-tagline">AI-native executive social community.</p>
        <div className="portfolio-points">
          <p>Broad access to leaders' expertise & private communications.</p>
          <p>AI = high exclusivity.</p>
        </div>
        <div className="portfolio-price">$50K/year membership + venture fund access</div>
      </>
    )
  },
  {
    id: 'good-hang',
    bg: 'linear-gradient(135deg, #16213e 0%, #1a4d2e 100%)',
    accent: '#22c55e',
    content: (
      <>
        <div className="slide-label">PORTFOLIO</div>
        <h1 className="portfolio-title"><span className="accent">Good Hang</span></h1>
        <p className="portfolio-tagline">True accreditation for the social era.</p>
        <div className="portfolio-points">
          <p>Solves signal problems in hiring -- who's actually good to work with?</p>
          <p>Gateway to social community: Happy Hour Beacons, Favor Tokens, Side Quests.</p>
        </div>
        <div className="portfolio-stats">
          <span className="stat-big">50</span>
          <span className="stat-unit">users/month</span>
          <span className="stat-math">600 users × $10/mo = $72K ARR Year 1</span>
        </div>
      </>
    )
  },
  {
    id: 'renubu',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #3d1f1f 100%)',
    accent: '#f97316',
    content: (
      <>
        <div className="slide-label">PORTFOLIO</div>
        <h1 className="portfolio-title"><span className="accent">Renubu</span></h1>
        <p className="portfolio-tagline">Expansion Intelligence for Customer Success.</p>
        <div className="portfolio-points">
          <p>3-5 points on NRR = ~28 new logos worth of growth.</p>
          <p>Critical inflection point for CS -- AI changes everything.</p>
        </div>
      </>
    )
  },
  {
    id: 'final',
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    accent: '#00d4ff',
    content: (
      <>
        <div className="slide-label">SO</div>
        <h1>Where do you<br/><span className="accent">want to start?</span></h1>
      </>
    )
  }
];

interface RickDemoProps {
  onExit?: () => void;
}

export default function RickDemo({ onExit }: RickDemoProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tierStep, setTierStep] = useState(0);

  const goTo = useCallback((index: number) => {
    if (isAnimating) return;
    if (index < 0 || index >= slides.length) return;

    const currentSlide = slides[current];
    const targetSlide = slides[index];

    if (currentSlide?.id === 'tiers' && index > current) {
      if (tierStep < 3) {
        setTierStep(tierStep + 1);
        return;
      }
    }

    if (targetSlide?.id === 'tiers' && current !== index) {
      setTierStep(0);
    }

    if (index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [current, isAnimating, tierStep]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onExit) {
        onExit();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentSlide = slides[current];
        if (currentSlide?.id === 'tiers' && tierStep > 0) {
          setTierStep(tierStep - 1);
          return;
        }
        goTo(current - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, goTo, tierStep, onExit]);

  const slide = slides[current];

  const TiersContent = () => {
    const tiers = [
      {
        label: 'A',
        name: 'Angel Investor',
        desc: 'Validate over 90 days. Expand or pivot.',
        amount: '$50K',
        ari: 5,
        portfolio: 0
      },
      {
        label: 'B',
        name: 'Lead Investor',
        desc: 'Full-time on ARI & taste of everything.',
        amount: '$250K',
        ari: 25,
        portfolio: 5
      },
      {
        label: 'C',
        name: 'Partners',
        desc: '50/50 on ARI and consulted on everything.',
        amount: '$500K',
        ari: 50,
        portfolio: 12
      }
    ];

    return (
      <div className="tiers-container">
        {tiers.map((tier, i) => (
          <div
            key={tier.label}
            className={`tier ${tierStep >= i + 1 ? 'visible' : ''} ${i === 1 && tierStep >= 2 ? 'featured' : ''}`}
          >
            <div className="tier-label">{tier.label}</div>
            <div className="tier-name">{tier.name}</div>
            <div className="tier-desc">{tier.desc}</div>
            <div className="tier-amount">{tier.amount}</div>
            <div className="tier-bars">
              <div className="bar-group">
                <div className="bar-label">ARI</div>
                <div className="bar-track">
                  <div
                    className="bar-fill ari"
                    style={{width: tierStep >= i + 1 ? `${tier.ari * 2}%` : '0%'}}
                  ></div>
                </div>
                <div className="bar-value">{tier.ari}%</div>
              </div>
              <div className="bar-group">
                <div className="bar-label">Portfolio</div>
                <div className="bar-track">
                  <div
                    className={`bar-fill portfolio ${tier.portfolio === 0 ? 'empty' : ''}`}
                    style={{width: tierStep >= i + 1 ? `${tier.portfolio * 4}%` : '0%'}}
                  ></div>
                </div>
                <div className={`bar-value ${tier.portfolio === 0 ? 'dim' : ''} ${tier.portfolio === 12 ? 'highlight' : ''}`}>
                  {tier.portfolio}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Mono:wght@400;700&display=swap');

        .rick-demo * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .rick-demo {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: 'Instrument Serif', Georgia, serif;
          cursor: pointer;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }

        .rick-demo .slide {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem;
          text-align: center;
          color: #ffffff;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .rick-demo .slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .rick-demo .slide-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          opacity: 0.6;
          margin-bottom: 2rem;
          font-weight: 400;
        }

        .rick-demo h1 {
          font-size: clamp(3rem, 8vw, 7rem);
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .rick-demo h1.hero-text {
          font-size: clamp(6rem, 20vw, 16rem);
          font-weight: 400;
        }

        .rick-demo .accent {
          color: var(--accent);
          font-style: italic;
        }

        .rick-demo .subtitle {
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          margin-top: 1.5rem;
          opacity: 0.9;
          font-style: italic;
        }

        .rick-demo .detail {
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          margin-top: 2rem;
          opacity: 0.5;
          letter-spacing: 0.05em;
        }

        .rick-demo .method-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: flex-start;
          text-align: left;
        }

        .rick-demo .method-item {
          font-size: clamp(1.8rem, 4vw, 3rem);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rick-demo .method-number {
          font-family: 'Space Mono', monospace;
          opacity: 0.4;
        }

        .rick-demo .quote {
          font-size: clamp(1.5rem, 3.5vw, 2.5rem);
          font-style: italic;
          margin: 0.8rem 0;
          opacity: 0.95;
        }

        .rick-demo .nav {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 100;
        }

        .rick-demo .nav-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .rick-demo .nav-dot.active {
          background: var(--accent);
          transform: scale(1.3);
        }

        .rick-demo .nav-dot:hover {
          background: rgba(255,255,255,0.6);
        }

        .rick-demo .slide-counter {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          opacity: 0.4;
          letter-spacing: 0.1em;
        }

        .rick-demo .hint {
          position: fixed;
          bottom: 2rem;
          left: 2rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          opacity: 0.3;
          letter-spacing: 0.05em;
        }

        .rick-demo .exit-btn {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.3s ease;
          z-index: 101;
        }

        .rick-demo .exit-btn:hover {
          opacity: 1;
          background: rgba(255,255,255,0.2);
        }

        .rick-demo em {
          font-style: italic;
        }

        .rick-demo .tiers-container {
          display: flex;
          gap: 3vw;
          align-items: stretch;
          justify-content: center;
          width: 90vw;
          max-width: 90vw;
          padding: 0 2vw;
        }

        .rick-demo .tier {
          flex: 1;
          width: 28vw;
          max-width: 28vw;
          min-height: 45vh;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1.5vw;
          padding: 3vh 2vw;
          display: flex;
          flex-direction: column;
          gap: 1.5vh;
          transition: all 0.5s ease;
          opacity: 0;
          transform: translateY(20px);
        }

        .rick-demo .tier.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .rick-demo .tier.featured {
          background: rgba(255,255,255,0.08);
          border-color: #00d4ff;
          transform: translateY(0) scale(1.03);
        }

        .rick-demo .tier-label {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.7rem, 1.2vw, 1rem);
          opacity: 0.5;
          letter-spacing: 0.2em;
        }

        .rick-demo .tier-name {
          font-size: clamp(1.2rem, 2.5vw, 2rem);
          font-style: italic;
          color: #fff;
        }

        .rick-demo .tier-desc {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.7rem, 1.1vw, 1rem);
          opacity: 0.6;
          line-height: 1.5;
          margin-bottom: 1vh;
        }

        .rick-demo .tier-amount {
          font-size: clamp(2rem, 4vw, 4rem);
          font-weight: 400;
          color: #00d4ff;
          margin: 1vh 0;
        }

        .rick-demo .tier-bars {
          display: flex;
          flex-direction: column;
          gap: 1.5vh;
          margin-top: 2vh;
        }

        .rick-demo .bar-group {
          display: flex;
          align-items: center;
          gap: 1vw;
        }

        .rick-demo .bar-label {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.6rem, 1vw, 0.9rem);
          width: 5vw;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rick-demo .bar-track {
          flex: 1;
          height: 1vh;
          background: rgba(255,255,255,0.1);
          border-radius: 0.5vh;
          overflow: hidden;
        }

        .rick-demo .bar-fill {
          height: 100%;
          border-radius: 0.5vh;
          transition: width 0.8s ease;
        }

        .rick-demo .bar-fill.ari {
          background: #00d4ff;
        }

        .rick-demo .bar-fill.portfolio {
          background: #ff9500;
        }

        .rick-demo .bar-fill.empty {
          background: transparent;
        }

        .rick-demo .bar-value {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.8rem, 1.2vw, 1.2rem);
          width: 4vw;
          text-align: right;
        }

        .rick-demo .bar-value.dim {
          opacity: 0.3;
        }

        .rick-demo .bar-value.highlight {
          color: #ff9500;
          font-weight: 700;
        }

        /* Portfolio slide styles */
        .rick-demo .portfolio-title {
          font-size: clamp(3rem, 8vw, 6rem);
          margin-bottom: 0.5rem;
        }

        .rick-demo .portfolio-tagline {
          font-size: clamp(1.3rem, 2.5vw, 1.8rem);
          font-style: italic;
          opacity: 0.9;
          margin-bottom: 2rem;
        }

        .rick-demo .portfolio-points {
          max-width: 600px;
          text-align: center;
          margin-bottom: 2rem;
        }

        .rick-demo .portfolio-points p {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.8rem, 1.5vw, 1rem);
          opacity: 0.7;
          margin: 0.75rem 0;
          line-height: 1.5;
        }

        .rick-demo .portfolio-price {
          font-size: clamp(1.2rem, 2.5vw, 1.6rem);
          color: var(--accent);
          font-style: italic;
          margin-top: 1rem;
        }

        .rick-demo .portfolio-stats {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 1rem;
        }

        .rick-demo .stat-big {
          font-size: clamp(2.5rem, 5vw, 4rem);
          color: var(--accent);
          font-weight: 400;
        }

        .rick-demo .stat-unit {
          font-size: clamp(1rem, 2vw, 1.4rem);
          opacity: 0.8;
          font-style: italic;
        }

        .rick-demo .stat-math {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.8rem, 1.5vw, 1rem);
          opacity: 0.6;
          width: 100%;
          text-align: center;
          margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
          .rick-demo .tiers-container {
            flex-direction: column;
            align-items: center;
            gap: 3vh;
            width: 95vw;
          }
          .rick-demo .tier {
            max-width: 90vw;
            width: 90vw;
            min-height: 30vh;
            padding: 3vh 4vw;
          }
          .rick-demo .tier.featured {
            transform: translateY(0) scale(1);
          }
          .rick-demo .bar-label {
            width: 15vw;
          }
          .rick-demo .bar-value {
            width: 10vw;
          }
        }
      `}</style>

      <div
        className="rick-demo"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('exit-btn') || target.classList.contains('nav-dot')) return;

          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x > rect.width / 2) {
            goTo(current + 1);
          } else {
            const currentSlide = slides[current];
            if (currentSlide?.id === 'tiers' && tierStep > 0) {
              setTierStep(tierStep - 1);
              return;
            }
            goTo(current - 1);
          }
        }}
        style={{ '--accent': slide.accent } as React.CSSProperties}
      >
        {onExit && (
          <button className="exit-btn" onClick={onExit}>
            ESC to exit
          </button>
        )}

        <div
          className="slide"
          style={{ background: slide.bg }}
        >
          {slide.isInteractive ? <TiersContent /> : slide.content}
        </div>

        <div className="nav">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`nav-dot ${i === current ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
            />
          ))}
        </div>

        <div className="slide-counter">
          {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>

        <div className="hint">
          ← → or click to navigate • ESC to exit
        </div>
      </div>
    </>
  );
}
