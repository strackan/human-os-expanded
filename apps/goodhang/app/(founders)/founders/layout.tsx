import { FoundersAuthProvider } from '@/lib/founders/auth-context';
import './founders.css';

export const metadata = {
  title: 'Founder OS | Good Hang',
  description: 'AI-powered executive support for founders',
};

export default function FoundersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen founders-dark-bg text-white">
      <FoundersAuthProvider>
        {children}
      </FoundersAuthProvider>
    </div>
  );
}
