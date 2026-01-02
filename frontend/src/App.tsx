import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Demo Ordering Interface
          </h1>
          <p className="text-gray-600 mt-2">
            Customer-Facing Restaurant UI with Authz/Authn
          </p>
        </header>

        <main className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              Welcome to the demo ordering interface. This application demonstrates
              role-based authentication and authorization using Keycloak.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h2 className="font-semibold text-blue-900 mb-2">
                Getting Started
              </h2>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Frontend development server is running</li>
                <li>• Backend API: http://localhost:8000</li>
                <li>• Keycloak: http://localhost:8080</li>
              </ul>
            </div>
            <button
              onClick={() => setCount((count) => count + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Count is {count}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
