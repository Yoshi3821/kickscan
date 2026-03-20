import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#06060f] text-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <span className="text-6xl">⚽</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-green-400">Kick</span>Scan
        </h1>
        
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The match you're looking for seems to have been moved or doesn't exist. 
          Head back to the pitch and try again.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25"
          >
            Return to Home
          </Link>
          
          <div className="text-center">
            <Link 
              href="/leagues"
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              Or browse leagues →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}