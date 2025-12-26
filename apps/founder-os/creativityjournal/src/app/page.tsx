import { redirect } from 'next/navigation';
import GoogleLogin from '@/components/GoogleLogin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export default async function Home() {
  // Use NextAuth's getServerSession for database sessions
  const session = await getServerSession(authOptions);

  // If user is authenticated, redirect to entry page
  if (session && session.user) {
    redirect('/entry');
  }

  // Render login page if not authenticated
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-start"
      style={{ backgroundImage: "url('/blank-book-pages-desk-green-531844.jpg')" }}
    >
      <div className="max-w-sm w-full text-center mb-12 mx-auto" style={{ marginTop: '100px' }}>
        <h1 className="display-2 offset-right" id="page_title" style={{ marginBottom: '-25px' }}>
          Creativity Journal
        </h1>
        <h3 className="mb-8" style={{ marginRight: '70px' }}>A private space for your thoughts</h3>
        <GoogleLogin />
      </div>
    </div>
  );
}
