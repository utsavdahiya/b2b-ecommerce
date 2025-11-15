export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
          B2B Printing Platform
        </h1>
        <p className="text-lg sm:text-xl text-gray-600">
          Professional printing services for your business needs
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login
          </a>
          <a
            href="/auth/signup"
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </div>
    </main>
  );
}

