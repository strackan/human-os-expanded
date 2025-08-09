// src/app/error/page.tsx
export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Configuration Error
          </h1>
          <p className="text-gray-600 mb-6">
            There was an issue with the application configuration. Please check your environment variables and try again.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">
              Missing or invalid Supabase configuration. Please ensure your environment variables are properly set.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
