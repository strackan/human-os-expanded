// src/app/login-success/page.tsx
export default function LoginSuccessPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Authentication Working!
          </h2>
          <p className="text-gray-600">
            You've successfully accessed the protected dashboard.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This page is protected by the layout-based auth guard.
          </p>
        </div>
      </div>
    </div>
  )
} 