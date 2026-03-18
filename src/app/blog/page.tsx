import Link from "next/link";
import AdBanner from "@/components/AdBanner";

const categories = ["All", "Latest Updates", "Team News", "Tournament Headlines", "Guide", "Analysis", "Predictions"] as const;

const posts = [
  {
    slug: "opening-match-mexico-vs-south-africa",
    title: "Opening Match Preview: Mexico vs South Africa at the Estadio Azteca",
    excerpt: "The FIFA World Cup 2026 kicks off with a blockbuster opener in Mexico City. We break down the tactical battle, key players, and what to expect from this historic opening match.",
    date: "March 18, 2026",
    category: "Latest Updates",
    readTime: "7 min",
    featured: true,
    image: "🇲🇽 vs 🇿🇦",
  },
  {
    slug: "world-cup-2026-complete-betting-guide",
    title: "The Complete World Cup 2026 Betting Guide: Everything You Need to Know",
    excerpt: "From outright markets to Asian handicaps, prop bets to in-play trading — the definitive guide to betting on the biggest World Cup ever.",
    date: "March 17, 2026",
    category: "Guide",
    readTime: "15 min",
    featured: false,
  },
  {
    slug: "group-c-brazil-vs-morocco-preview",
    title: "Group C Blockbuster: Brazil vs Morocco — The Quarter-Final Rematch",
    excerpt: "Morocco shocked the world in 2022 by beating Brazil in the quarterfinals. Can the Atlas Lions do it again at MetLife Stadium? AI-powered analysis inside.",
    date: "March 16, 2026",
    category: "Analysis",
    readTime: "8 min",
    featured: false,
  },
  {
    slug: "usa-home-advantage-world-cup-2026",
    title: "Home Advantage: Can the USA Ride the Wave to World Cup Glory?",
    excerpt: "With 11 of 16 venues on American soil, the USMNT has a massive edge. We analyze how host-nation advantage has shaped past tournaments.",
    date: "March 15, 2026",
    category: "Team News",
    readTime: "10 min",
    featured: false,
  },
  {
    slug: "top-5-dark-horses-world-cup-2026",
    title: "Top 5 Dark Horses for World Cup 2026: Who Could Shock the Favorites?",
    excerpt: "The 48-team format opens the door for surprises. Japan, Morocco, Colombia, Croatia, and Norway — our AI model says these teams could go deep.",
    date: "March 14, 2026",
    category: "Predictions",
    readTime: "6 min",
    featured: false,
  },
  {
    slug: "arbitrage-betting-explained",
    title: "Arbitrage Betting Explained: How to Profit from Odds Gaps",
    excerpt: "A beginner-friendly guide to finding and exploiting arbitrage opportunities across bookmakers. Real examples and step-by-step calculations.",
    date: "March 13, 2026",
    category: "Guide",
    readTime: "12 min",
    featured: false,
  },
  {
    slug: "group-of-death-analysis",
    title: "Group H: Spain, Uruguay, Saudi Arabia & Cape Verde — The Group of Death?",
    excerpt: "Two world-class sides, a potential giant-killer, and an island nation making history. Group H could produce the most drama at WC 2026.",
    date: "March 12, 2026",
    category: "Analysis",
    readTime: "9 min",
    featured: false,
  },
  {
    slug: "48-team-format-explained",
    title: "The 48-Team World Cup: How the New Format Changes Everything",
    excerpt: "12 groups of 4, knockout rounds starting in the round of 32 — the new format explained, plus how it affects betting strategies and value markets.",
    date: "March 11, 2026",
    category: "Tournament Headlines",
    readTime: "8 min",
    featured: false,
  },
  {
    slug: "venue-guide-all-16-stadiums",
    title: "Stadium Guide: All 16 Venues Across USA, Mexico, and Canada",
    excerpt: "From the iconic Estadio Azteca to the brand-new SoFi Stadium — a complete guide to every venue hosting World Cup 2026 matches.",
    date: "March 10, 2026",
    category: "Tournament Headlines",
    readTime: "11 min",
    featured: false,
  },
  {
    slug: "argentina-defending-champions",
    title: "Argentina: Can Scaloni's Men Defend Their Crown Without Messi?",
    excerpt: "The big question heading into 2026 — will Lionel Messi play? And can Argentina compete at the highest level regardless? We analyze their squad depth.",
    date: "March 9, 2026",
    category: "Team News",
    readTime: "7 min",
    featured: false,
  },
];

const categoryColors: Record<string, string> = {
  "Latest Updates": "text-red-400 bg-red-400/10 border-red-400/20",
  "Team News": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Tournament Headlines": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Guide: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  Analysis: "text-green-400 bg-green-400/10 border-green-400/20",
  Predictions: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

const popularPosts = posts.slice(0, 5);

export default function BlogPage() {
  const featured = posts.find(p => p.featured);
  const rest = posts.filter(p => !p.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-black">
          Blog & <span className="text-green-400">Analysis</span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Expert betting guides, AI-powered analysis, and World Cup 2026 coverage
        </p>
      </div>

      {/* Category filter (visual only since we don't have full blog pages) */}
      <div className="flex gap-2 flex-wrap mb-8 justify-center">
        {categories.map(cat => (
          <span
            key={cat}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              cat === "All"
                ? "bg-green-500 text-black border-green-500"
                : categoryColors[cat]
                  ? categoryColors[cat]
                  : "bg-gray-800 text-gray-400 border-gray-700"
            }`}
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Featured article */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="block bg-gradient-to-br from-green-900/20 to-gray-900 border border-green-400/20 rounded-2xl p-6 md:p-8 mb-8 hover:border-green-400/40 transition group"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">FEATURED</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[featured.category] || ""}`}>
                  {featured.category}
                </span>
                <span className="text-xs text-gray-500">{featured.date} · {featured.readTime}</span>
              </div>
              <div className="text-center text-5xl mb-4">{featured.image}</div>
              <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-green-400 transition mb-3">
                {featured.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">{featured.excerpt}</p>
              <span className="inline-block mt-4 text-green-400 text-sm font-medium">Read more →</span>
            </Link>
          )}

          {/* Article grid */}
          <div className="space-y-4">
            {rest.map((post, index) => (
              <div key={post.slug}>
              {index === 2 && (
                <AdBanner size="medium-rect" label="blog-mid" className="my-6" />
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 hover:border-gray-700 transition group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColors[post.category] || "text-gray-400 bg-gray-800 border-gray-700"}`}>
                    {post.category}
                  </span>
                  <span className="text-[10px] text-gray-600">{post.date}</span>
                  <span className="text-[10px] text-gray-600">· {post.readTime}</span>
                </div>
                <h2 className="text-base font-bold text-white group-hover:text-green-400 transition mb-1">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-xs leading-relaxed">{post.excerpt}</p>
              </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-72 shrink-0 space-y-6">
          {/* Categories */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Categories</h3>
            <ul className="space-y-2">
              {Object.keys(categoryColors).map(cat => (
                <li key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{cat}</span>
                  <span className="text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">
                    {posts.filter(p => p.category === cat).length}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Posts */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">🔥 Popular Posts</h3>
            <ul className="space-y-3">
              {popularPosts.map((post, i) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="flex gap-2 group">
                    <span className="text-green-400 font-bold text-xs mt-0.5">{i + 1}</span>
                    <span className="text-xs text-gray-400 group-hover:text-green-400 transition leading-relaxed">{post.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="bg-gradient-to-br from-green-900/20 to-gray-900 border border-green-400/20 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-2">📬 Newsletter</h3>
            <p className="text-xs text-gray-400 mb-3">Get weekly analysis and betting tips delivered to your inbox.</p>
            <Link href="/arb-alerts" className="block text-center px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded-lg transition">
              Subscribe →
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-8 text-center text-xs text-gray-600">
        Last updated: March 18, 2026
      </div>
    </div>
  );
}
