import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Renubu Workflows</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Architects Card */}
          <Link 
            href="/revenue-architects" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-4">
              <h2 className="font-bold">Revenue Architects</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Identify renewal opportunities and surface upsell recommendations using real-time data.
              </p>
            </div>
          </Link>
          
          {/* AI-Powered Card */}
          <Link 
            href="/ai-powered" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4">
              <h2 className="font-bold">AI-Powered</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Automate routine tasks for CSMs, freeing up time for strategic work.
              </p>
            </div>
          </Link>
          
          {/* Impact Engineers Card */}
          <Link 
            href="/impact-engineers" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-4">
              <h2 className="font-bold">Impact Engineers</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Measure and communicate value delivered to customers based on signals.
              </p>
            </div>
          </Link>
          
          {/* Original Workflow */}
          <Link 
            href="/renewals-hq" 
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 px-4">
              <h2 className="font-bold">Original Workflow</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                The standard renewals workflow example.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
