import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-indigo-600 mb-4">404</h1>
          <div className="h-1 w-24 bg-indigo-600 mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like this renewal didn&apos;t go through. The page you&apos;re looking for has been archived, deleted, or never existed.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Return to Dashboard
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Need help? Contact support or check your URL for typos.
        </p>
      </div>
    </div>
  )
}
