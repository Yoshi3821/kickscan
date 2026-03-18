import Link from "next/link";

const posts = [
  {
    slug: "world-cup-2026-complete-betting-guide",
    title: "The Complete World Cup 2026 Betting Guide",
    excerpt: "Everything you need to know about betting on the FIFA World Cup 2026 — markets, strategies, and bookmaker reviews.",
    date: "March 18, 2026",
    category: "Guide",
    readTime: "12 min",
  },
  {
    slug: "group-c-brazil-vs-morocco-preview",
    title: "Group C Preview: Brazil vs Morocco — The Rematch",
    excerpt: "Morocco shocked the world in 2022. Can they do it again against a revamped Brazil? AI analysis inside.",
    date: "March 18, 2026",
    category: "Analysis",
    readTime: "8 min",
  },
  {
    slug: "top-5-dark-horses-world-cup-2026",
    title: "Top 5 Dark Horses for World Cup 2026",
    excerpt: "The 48-team format opens the door for surprises. Here are the teams our AI model says could go deep.",
    date: "March 18, 2026",
    category: "Predictions",
    readTime: "6 min",
  },
  {
    slug: "arbitrage-betting-explained",
    title: "Arbitrage Betting Explained: How to Profit from Odds Gaps",
    excerpt: "A beginner-friendly guide to finding and exploiting arbitrage opportunities across bookmakers.",
    date: "March 18, 2026",
    category: "Guide",
    readTime: "10 min",
  },
];

const categoryColors: Record<string, string> = {
  Guide: "text-blue-400 bg-blue-400/10",
  Analysis: "text-green-400 bg-green-400/10",
  Predictions: "text-purple-400 bg-purple-400/10",
};

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Blog & <span className="text-green-400">Analysis</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Expert betting guides, AI-powered match analysis, and World Cup 2026 insights
        </p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-400/50 transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[post.category]}`}>
                {post.category}
              </span>
              <span className="text-xs text-gray-500">{post.date}</span>
              <span className="text-xs text-gray-500">· {post.readTime}</span>
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition mb-2">
              {post.title}
            </h2>
            <p className="text-gray-400 text-sm">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
