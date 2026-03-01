import React, { useState, useEffect } from 'react';

const slides = [
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

export default function ARIDemo() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tierStep, setTierStep] = useState(0);

  const goTo = (index) => {
    if (isAnimating) return;
    if (index < 0 || index >= slides.length) return;
    
    // Handle interactive tiers slide
    const currentSlide = slides[current];
    const targetSlide = slides[index];
    
    // If we're on tiers slide and clicking forward
    if (currentSlide?.id === 'tiers' && index > current) {
      if (tierStep < 3) {
        setTierStep(tierStep + 1);
        return;
      }
    }
    
    // If navigating to tiers slide, reset step
    if (targetSlide?.id === 'tiers' && current !== index) {
      setTierStep(0);
    }
    
    if (index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // If on tiers and stepping back within tiers
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
  }, [current, isAnimating, tierStep]);

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
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .presentation {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: 'Instrument Serif', Georgia, serif;
          cursor: pointer;
          position: relative;
        }
        
        .slide {
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
        
        .slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.03) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .slide-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          opacity: 0.6;
          margin-bottom: 2rem;
          font-weight: 400;
        }
        
        h1 {
          font-size: clamp(3rem, 8vw, 7rem);
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        
        h1.hero-text {
          font-size: clamp(6rem, 20vw, 16rem);
          font-weight: 400;
        }
        
        .accent {
          color: var(--accent);
          font-style: italic;
        }
        
        .subtitle {
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          margin-top: 1.5rem;
          opacity: 0.9;
          font-style: italic;
        }
        
        .detail {
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          margin-top: 2rem;
          opacity: 0.5;
          letter-spacing: 0.05em;
        }
        
        .method-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: flex-start;
          text-align: left;
        }
        
        .method-item {
          font-size: clamp(1.8rem, 4vw, 3rem);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .method-number {
          font-family: 'Space Mono', monospace;
          opacity: 0.4;
        }
        
        .quote {
          font-size: clamp(1.5rem, 3.5vw, 2.5rem);
          font-style: italic;
          margin: 0.8rem 0;
          opacity: 0.95;
        }
        
        .nav {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 100;
        }
        
        .nav-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }
        
        .nav-dot.active {
          background: var(--accent);
          transform: scale(1.3);
        }
        
        .nav-dot:hover {
          background: rgba(255,255,255,0.6);
        }
        
        .slide-counter {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          opacity: 0.4;
          letter-spacing: 0.1em;
        }
        
        .hint {
          position: fixed;
          bottom: 2rem;
          left: 2rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          opacity: 0.3;
          letter-spacing: 0.05em;
        }
        
        em {
          font-style: italic;
        }
        
        .tiers-container {
          display: flex;
          gap: 1.5rem;
          align-items: stretch;
          justify-content: center;
          width: 100%;
          max-width: 1000px;
          padding: 0 1rem;
        }
        
        .tier {
          flex: 1;
          max-width: 280px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          transition: all 0.5s ease;
          opacity: 0;
          transform: translateY(20px);
        }
        
        .tier.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .tier.featured {
          background: rgba(255,255,255,0.08);
          border-color: #00d4ff;
          transform: translateY(0) scale(1.02);
        }
        
        .tier-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          opacity: 0.5;
          letter-spacing: 0.2em;
        }
        
        .tier-name {
          font-size: 1.1rem;
          font-style: italic;
          color: #fff;
        }
        
        .tier-desc {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          opacity: 0.6;
          line-height: 1.4;
          margin-bottom: 0.25rem;
        }
        
        .tier-amount {
          font-size: clamp(1.5rem, 3vw, 2.25rem);
          font-weight: 400;
          color: #00d4ff;
          margin: 0.25rem 0;
        }
        
        .tier-bars {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-top: 0.5rem;
        }
        
        .bar-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .bar-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          width: 50px;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .bar-track {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.8s ease;
        }
        
        .bar-fill.ari {
          background: #00d4ff;
        }
        
        .bar-fill.portfolio {
          background: #ff9500;
        }
        
        .bar-fill.empty {
          background: transparent;
        }
        
        .bar-value {
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          width: 35px;
          text-align: right;
        }
        
        .bar-value.dim {
          opacity: 0.3;
        }
        
        .bar-value.highlight {
          color: #ff9500;
          font-weight: 700;
        }
        
        @media (max-width: 768px) {
          .tiers-container {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .tier {
            max-width: 100%;
            width: 100%;
          }
          .tier.featured {
            transform: translateY(0) scale(1);
          }
        }
        
        .portfolio-title {
          font-size: clamp(3rem, 8vw, 6rem);
          margin-bottom: 0.5rem;
        }
        
        .portfolio-tagline {
          font-size: clamp(1.3rem, 2.5vw, 1.8rem);
          font-style: italic;
          opacity: 0.9;
          margin-bottom: 2rem;
        }
        
        .portfolio-points {
          max-width: 600px;
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .portfolio-points p {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.8rem, 1.5vw, 1rem);
          opacity: 0.7;
          margin: 0.75rem 0;
          line-height: 1.5;
        }
        
        .portfolio-price {
          font-size: clamp(1.2rem, 2.5vw, 1.6rem);
          color: var(--accent);
          font-style: italic;
          margin-top: 1rem;
        }
        
        .portfolio-stats {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 1rem;
        }
        
        .stat-big {
          font-size: clamp(2.5rem, 5vw, 4rem);
          color: var(--accent);
          font-weight: 400;
        }
        
        .stat-unit {
          font-size: clamp(1rem, 2vw, 1.4rem);
          opacity: 0.8;
          font-style: italic;
        }
        
        .stat-math {
          font-family: 'Space Mono', monospace;
          font-size: clamp(0.8rem, 1.5vw, 1rem);
          opacity: 0.6;
          width: 100%;
          text-align: center;
          margin-top: 0.5rem;
        }
      `}</style>
      
      <div 
        className="presentation"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x > rect.width / 2) {
            goTo(current + 1);
          } else {
            // Handle back navigation on tiers
            const currentSlide = slides[current];
            if (currentSlide?.id === 'tiers' && tierStep > 0) {
              setTierStep(tierStep - 1);
              return;
            }
            goTo(current - 1);
          }
        }}
        style={{ '--accent': slide.accent }}
      >
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
          ← → or click to navigate
        </div>
      </div>
    </>
  );
}
