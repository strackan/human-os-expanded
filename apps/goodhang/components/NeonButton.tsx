import Link from 'next/link';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'magenta' | 'purple';
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function NeonButton({
  children,
  variant = 'purple',
  href,
  className = '',
  type = 'button'
}: NeonButtonProps) {
  const colorClasses = {
    cyan: 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background',
    magenta: 'border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-background',
    purple: 'border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-background'
  };

  const glowClasses = {
    cyan: 'hover:shadow-[0_0_15px_rgba(0,204,221,0.3)]',
    magenta: 'hover:shadow-[0_0_15px_rgba(187,0,170,0.3)]',
    purple: 'hover:shadow-[0_0_15px_rgba(119,0,204,0.3)]'
  };

  const baseClasses = `
    inline-block
    px-8 py-3
    border-2
    font-mono
    uppercase
    tracking-wider
    transition-all
    duration-300
    text-center
    ${colorClasses[variant]}
    ${glowClasses[variant]}
    ${className}
  `;

  if (href) {
    // Check if it's an external link or anchor
    if (href.startsWith('http') || href.startsWith('#')) {
      return (
        <a href={href} className={baseClasses}>
          {children}
        </a>
      );
    }
    // Use Next.js Link for internal routes
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={baseClasses}>
      {children}
    </button>
  );
}
