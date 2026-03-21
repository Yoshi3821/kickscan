import Link from 'next/link'

export default function BlogPage() {
  const posts = [
    {
      slug: 'ai-world-cup-2026-predictions',
      title: 'AI World Cup 2026 Predictions: The Complete Intelligence Guide',
      excerpt: 'How artificial intelligence is revolutionizing FIFA World Cup predictions. Discover which teams our AI picks to win in 2026.',
      date: 'March 21, 2026',
      readTime: '12 min read',
      category: 'AI Predictions'
    },
    {
      slug: 'today-ai-predictions',
      title: `Today's AI Football Predictions: ${new Date().toLocaleDateString()}`,
      excerpt: 'Real-time AI analysis of today\'s biggest matches across all major leagues. See our algorithm\'s verdict and confidence levels.',
      date: new Date().toLocaleDateString(),
      readTime: '5 min read',
      category: 'Daily Predictions'
    },
    {
      slug: 'ai-vs-human-predictions',
      title: 'AI vs Human Football Predictions: Who\'s More Accurate?',
      excerpt: 'Can artificial intelligence outpredict human football experts? We analyzed 10,000 predictions to find the answer.',
      date: 'March 20, 2026', 
      readTime: '8 min read',
      category: 'Analysis'
    },
    {
      slug: 'messi-world-cup-2026-predictions',
      title: 'AI Predicts Messi\'s World Cup 2026 Performance: Detailed Analysis',
      excerpt: 'Our AI analyzed Lionel Messi\'s career patterns to predict his final World Cup performance. The results might surprise you.',
      date: 'March 19, 2026',
      readTime: '10 min read',
      category: 'Player Analysis'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-cyan-500 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            AI Football Intelligence Blog
          </h1>
          <p className="text-xl md:text-2xl text-white/80">
            Deep analysis, predictions, and insights from KickScan's AI brain
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article 
              key={post.slug}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-purple-600/20 text-purple-300 text-sm rounded-full">
                  {post.category}
                </span>
              </div>
              
              <h2 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-semibold"
              >
                Read Full Analysis →
              </Link>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-purple-600/10 to-cyan-500/10 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold mb-4">Want AI Predictions in Real-Time?</h2>
          <p className="text-gray-400 mb-6">
            Join thousands competing against our AI brain in daily prediction challenges.
          </p>
          <Link
            href="/predict"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl font-bold hover:from-purple-500 hover:to-cyan-400 transition-all"
          >
            🤖 Beat the AI Challenge
          </Link>
        </div>
      </div>
    </div>
  )
}