import { useState } from 'react'
import { MainLayout } from './components/layout'

function App() {
  const [count, setCount] = useState(0)

  return (
    <MainLayout appName="OrderDemo">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {/* Welcome section */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Demo Ordering Interface
                </h1>
                <p className="text-gray-600 mt-2">
                  Customer-Facing Restaurant UI with Role-Based Authentication
                </p>
              </div>

              {/* Getting started section */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h2 className="font-semibold text-blue-900 mb-2">
                  Getting Started
                </h2>
                <p className="text-gray-700 mb-3">
                  Welcome to the demo ordering interface. This application demonstrates
                  role-based authentication and authorization using Keycloak.
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Frontend development server is running</li>
                  <li>• Backend API: http://localhost:8000</li>
                  <li>• Keycloak: http://localhost:8080</li>
                </ul>
              </div>

              {/* Interactive demo section */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-700 mb-4">
                  The main layout is now active with Header, Navigation, and Footer components.
                  Try logging in to see role-based navigation links!
                </p>
                <button
                  onClick={() => setCount((count) => count + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Count is {count}
                </button>
              </div>

              {/* Layout features showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="font-semibold text-green-900 mb-1">Header</h3>
                  <p className="text-sm text-green-800">
                    Sticky header with cart indicator and user menu
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                  <h3 className="font-semibold text-purple-900 mb-1">Navigation</h3>
                  <p className="text-sm text-purple-800">
                    Role-based navigation with mobile responsive menu
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <h3 className="font-semibold text-orange-900 mb-1">Footer</h3>
                  <p className="text-sm text-orange-800">
                    Professional footer with links and branding
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h3 className="font-semibold text-amber-900 mb-1">Responsive</h3>
                  <p className="text-sm text-amber-800">
                    Mobile-friendly design that works on all devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default App
