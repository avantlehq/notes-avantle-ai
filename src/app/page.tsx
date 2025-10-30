export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Notes
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              .Avantle.AI
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            AI-powered note-taking application for the modern knowledge worker
          </p>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">Coming Soon</h2>
            <p className="text-gray-300">
              We're building something amazing. Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
