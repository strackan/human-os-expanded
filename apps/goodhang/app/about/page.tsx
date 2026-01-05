import { VHSEffects } from '@/components/VHSEffects';
import { NeonButton } from '@/components/NeonButton';
import Link from 'next/link';
import { MobileNav, DesktopNav } from '@/components/MobileNav';

export default function About() {
  return (
    <>
      <VHSEffects />

      <div className="min-h-screen relative">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="font-mono text-2xl font-bold chromatic-aberration">
              <span className="neon-purple">GOOD_HANG</span>
            </Link>
            <div className="flex gap-4 items-center">
              <DesktopNav
                links={[
                  { href: '/about', label: 'About' },
                  { href: '/events', label: 'Events' },
                  { href: '/login', label: 'Member Login' },
                ]}
              />
              <MobileNav
                links={[
                  { href: '/about', label: 'About' },
                  { href: '/events', label: 'Events' },
                  { href: '/login', label: 'Member Login' },
                ]}
              />
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold font-mono neon-magenta mb-12">
              THE ORIGIN STORY
            </h1>

            <div className="space-y-8 text-foreground font-mono leading-relaxed">
              <p className="text-lg">
                <span className="neon-cyan">Year: 2025.</span> Location: Raleigh, NC.
              </p>

              <p>
                A tech professional sits alone in yet another sterile networking event,
                drinking overpriced wine from a plastic cup, listening to someone explain
                their &quot;disruptive AI-powered blockchain solution&quot; for the third time that week.
              </p>

              <p>
                They think to themselves: <span className="neon-purple italic">&quot;When did networking become so...boring?&quot;</span>
              </p>

              <p>
                And more importantly: <span className="neon-magenta italic">&quot;Where are all the good hangs?&quot;</span>
              </p>

              <div className="border-l-4 border-neon-cyan pl-6 my-12 bg-background-lighter p-6">
                <p className="text-neon-cyan font-bold mb-2">THE REVELATION</p>
                <p>
                  The best professional relationships don&apos;t happen in conference rooms or at
                  forced happy hours. They happen when you&apos;re actually having fun. When you&apos;re
                  present. When you&apos;re <span className="neon-purple">fully alive</span>.
                </p>
              </div>

              <p>
                So we created Good Hang: A social experiment disguised as a club. Or maybe
                it&apos;s a club disguised as a social experiment. We&apos;re still figuring that out.
              </p>

              <h2 className="text-3xl font-bold neon-purple mt-16 mb-6">
                WHAT WE&apos;RE ABOUT
              </h2>

              <ul className="space-y-4 list-none">
                <li className="flex gap-3">
                  <span className="neon-cyan">→</span>
                  <span><strong className="text-neon-cyan">Real Events:</strong> Memorable experiences, not forgettable mixers</span>
                </li>
                <li className="flex gap-3">
                  <span className="neon-magenta">→</span>
                  <span><strong className="text-neon-magenta">Spontaneous Connections:</strong> Drop a beacon, see who shows up</span>
                </li>
                <li className="flex gap-3">
                  <span className="neon-purple">→</span>
                  <span><strong className="text-neon-purple">Mutual Growth:</strong> AI upskilling, mentorship, accountability</span>
                </li>
                <li className="flex gap-3">
                  <span className="neon-cyan">→</span>
                  <span><strong className="text-neon-cyan">The Token System:</strong> Ask for favors without the awkwardness</span>
                </li>
              </ul>

              <div className="border-2 border-neon-purple/30 bg-background-lighter p-8 my-12">
                <h3 className="text-2xl font-bold neon-magenta mb-4">
                  THE MOTTO
                </h3>
                <p className="text-xl leading-relaxed">
                  <span className="neon-cyan">Fully Alive</span>,{' '}
                  <span className="neon-magenta">Well Connected</span>,{' '}
                  <span className="neon-purple">and Supported</span> human beings are{' '}
                  <span className="text-2xl font-bold">unstoppable</span>.
                </p>
              </div>

              <h2 className="text-3xl font-bold neon-cyan mt-16 mb-6">
                WHO WE ARE
              </h2>

              <p>
                We&apos;re tech professionals—mainly go-to-market and customer success folks,
                because let&apos;s be honest, we&apos;re slightly more social than the average dev
                (no offense, we love you too).
              </p>

              <p>
                We&apos;re in Raleigh now, but we&apos;re expanding. Atlanta. DC. Austin. NYC. Boston.
                Denver. SLC. Phoenix. LA. SF. Toronto. Wherever good people want to have
                good hangs.
              </p>

              <p>
                This isn&apos;t Pavilion. It&apos;s not another corporate membership club. It&apos;s something
                different. Something a little darker, a little more fun, and a lot more real.
              </p>

              <div className="pt-12 text-center">
                <p className="text-foreground-dim mb-6">
                  Sound like your kind of people?
                </p>
                <NeonButton variant="purple" href="/#join">
                  Apply for Membership
                </NeonButton>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neon-purple/20 py-8 mt-20">
          <div className="container mx-auto px-6 text-center text-foreground-dim font-mono text-sm">
            <p>© 2025 Good Hang. A <a href="https://renubu.com" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:text-neon-magenta transition-colors">Renubu</a> initiative.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
