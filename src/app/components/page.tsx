import Link from 'next/link';

interface ComponentInfo {
  name: string;
  description: string;
  testUrl: string;
  parentPages: string[];
  status: 'independent' | 'shared' | 'experimental';
}

const components: ComponentInfo[] = [
  {
    name: 'CustomerHeaderCard',
    description: 'Upper card component containing customer name, risk level, and stage timeline',
    testUrl: '/renewals-hq',
    parentPages: ['/renewals-hq', '/'],
    status: 'independent'
  },
  {
    name: 'CustomerMetricsCard',
    description: 'Lower left card component containing key metrics, sparklines, and AI insights',
    testUrl: '/renewals-hq',
    parentPages: ['/renewals-hq', '/'],
    status: 'independent'
  },
  {
    name: 'CustomerChatDialog',
    description: 'Chat dialog component for customer interactions in renewals-hq page',
    testUrl: '/components/customer-chat-dialog',
    parentPages: ['/renewals-hq'],
    status: 'independent'
  },
  {
    name: 'IndexPageChatDialog',
    description: 'Chat dialog component for customer interactions in index page',
    testUrl: '/components/index-page-chat-dialog',
    parentPages: ['/'],
    status: 'independent'
  },
  {
    name: 'ConversationalChat',
    description: 'Multi-step conversational workflow component',
    testUrl: '/components/conversational-chat',
    parentPages: ['/renewals-hq', '/'],
    status: 'shared'
  },
  {
    name: 'CustomerRenewalLayout',
    description: 'Main layout component for renewals-hq page',
    testUrl: '/renewals-hq',
    parentPages: ['/renewals-hq'],
    status: 'independent'
  },
  {
    name: 'IndexPageLayout',
    description: 'Main layout component for index page',
    testUrl: '/',
    parentPages: ['/'],
    status: 'independent'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'independent':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'shared':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'experimental':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'independent':
      return '🔒';
    case 'shared':
      return '🔗';
    case 'experimental':
      return '🧪';
    default:
      return '❓';
  }
};

export default function ComponentsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Component Testing & Experimentation Hub</h1>
          <p className="text-lg text-gray-600 mb-6">
            Navigate to individual components for isolated testing and experimentation
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {components.filter(c => c.status === 'independent').length}
              </div>
              <div className="text-sm text-gray-600">Independent Components</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">
                {components.filter(c => c.status === 'shared').length}
              </div>
              <div className="text-sm text-gray-600">Shared Components</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {components.filter(c => c.status === 'experimental').length}
              </div>
              <div className="text-sm text-gray-600">Experimental</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-600">
                {components.length}
              </div>
              <div className="text-sm text-gray-600">Total Components</div>
            </div>
          </div>
        </div>

        {/* Main Pages Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Main Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link 
              href="/"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Index Page (/)</h3>
              <p className="text-gray-600 mb-4">Main landing page with IndexPageLayout</p>
              <div className="flex items-center text-sm text-blue-600">
                <span>View Page →</span>
              </div>
            </Link>
            
            <Link 
              href="/renewals-hq"
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-500"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Renewals HQ (/renewals-hq)</h3>
              <p className="text-gray-600 mb-4">Renewals workflow with CustomerRenewalLayout</p>
              <div className="flex items-center text-sm text-green-600">
                <span>View Page →</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Components Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Individual Components</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {components.map((component) => (
              <div 
                key={component.name}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{component.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(component.status)}`}>
                    {getStatusIcon(component.status)} {component.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{component.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Parent Pages:</h4>
                  <div className="flex flex-wrap gap-2">
                    {component.parentPages.map((page) => (
                      <Link
                        key={page}
                        href={page}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                      >
                        {page}
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Link
                    href={component.testUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Test Component
                  </Link>
                  
                  {component.parentPages.length > 0 && (
                    <Link
                      href={component.parentPages[0]}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      View in Context
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Development Guidelines */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Development Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔒 Independent Components</h3>
              <p className="text-sm text-gray-600">
                These components are completely decoupled. Changes won't affect other pages.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔗 Shared Components</h3>
              <p className="text-sm text-gray-600">
                These components are used across multiple pages. Changes will affect all instances.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🧪 Experimental</h3>
              <p className="text-sm text-gray-600">
                These components are for testing new features and may be unstable.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🏠 Go to Index Page
            </Link>
            <Link
              href="/renewals-hq"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📊 Go to Renewals HQ
            </Link>
            <Link
              href="/demo"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🎮 Go to Demo Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 