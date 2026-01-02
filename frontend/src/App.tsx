import { useState } from 'react'
import { MainLayout } from './components/layout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ToastProvider, useToast } from './components/ui/Toast'
import {
  LoadingSpinner,
  LoadingSpinnerPage,
  LoadingSpinnerInline,
  LoadingCard,
} from './components/ui/LoadingSpinner'

/**
 * Demo content component that demonstrates the UI components.
 */
function DemoContent() {
  const [showLoading, setShowLoading] = useState(false)
  const [showPageLoading, setShowPageLoading] = useState(false)
  const toast = useToast()
  const [count, setCount] = useState(0)

  const handleShowToast = () => {
    toast.success('Success!', { description: 'This is a success toast notification' })
  }

  const handleShowError = () => {
    toast.error('Error occurred', { description: 'This is an error toast' })
  }

  const handleShowWarning = () => {
    toast.warning('Warning', { description: 'This is a warning toast' })
  }

  const handleShowInfo = () => {
    toast.info('Info', { description: 'This is an info toast' })
  }

  const handleShowLoading = () => {
    setShowLoading(true)
    setTimeout(() => setShowLoading(false), 2000)
  }

  const handleShowPageLoading = () => {
    setShowPageLoading(true)
    setTimeout(() => setShowPageLoading(false), 2000)
  }

  const handleTriggerError = () => {
    throw new Error('This is a test error to demonstrate the ErrorBoundary')
  }

  if (showPageLoading) {
    return <LoadingSpinnerPage message="Loading page content..." />
  }

  return (
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

            {/* UI Components Demo */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                UI Components Demo
              </h2>

              {/* Toast Notifications */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Toast Notifications</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleShowToast}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Success Toast
                  </button>
                  <button
                    onClick={handleShowError}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Error Toast
                  </button>
                  <button
                    onClick={handleShowWarning}
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                  >
                    Warning Toast
                  </button>
                  <button
                    onClick={handleShowInfo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Info Toast
                  </button>
                </div>
              </div>

              {/* Loading States */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Loading States</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                  <button
                    onClick={handleShowLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    {showLoading ? (
                      <LoadingSpinnerInline text="Loading..." />
                    ) : (
                      'Show Inline Loading'
                    )}
                  </button>
                  <button
                    onClick={handleShowPageLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Show Page Loading
                  </button>
                </div>
              </div>

              {/* Loading Variants */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Loading Variants</h3>
                <div className="flex flex-wrap gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner variant="default" size="md" />
                    <span className="text-xs text-gray-600">Default</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner variant="pulse" size="md" />
                    <span className="text-xs text-gray-600">Pulse</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner variant="dots" size="md" />
                    <span className="text-xs text-gray-600">Dots</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-32">
                    <LoadingSpinner variant="bar" size="md" />
                    <span className="text-xs text-gray-600">Bar</span>
                  </div>
                </div>
              </div>

              {/* Loading Card */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Loading Card</h3>
                <div className="flex gap-4">
                  <LoadingCard />
                  <LoadingCard lines={4} />
                </div>
              </div>

              {/* Error Boundary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Error Boundary</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Click the button below to trigger an error and see the ErrorBoundary in action.
                </p>
                <button
                  onClick={handleTriggerError}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Trigger Error
                </button>
              </div>

              {/* Original Counter Demo */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Original Demo</h3>
                <button
                  onClick={() => setCount((count) => count + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Count is {count}
                </button>
              </div>
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
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider position="top-right">
        <MainLayout appName="OrderDemo">
          <DemoContent />
        </MainLayout>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
