"use client";
import Link from "next/link";
import {
  getPlayerBySlug,
  getRelatedPlayers,
  getCountryColor,
  allPlayers,
} from "@/data/players";
import { allMatches } from "@/data/matches";

const tagLabels: Record<string, string> = {
  "last-dance": "Last Dance 🕺",
  goat: "GOAT 🐐",
  "golden-boot-contender": "Golden Boot Contender 🥇",
  "rising-star": "Rising Star 🌟",
  "young-gun": "Young Gun 🔥",
  "heir-apparent": "Heir Apparent 👑",
  debut: "World Cup Debut 🆕",
  flair: "Flair Player ✨",
  "record-chaser": "Record Chaser 📊",
  "host-nation": "Host Nation Hero 🏠",
};

function generateAiAnalysis(player: (typeof allPlayers)[0]): string {
  const analyses: Record<string, string> = {
    messi: `Messi's impact at 38 will be carefully managed by Scaloni — expect limited minutes in group games with a view to peak performance in the knockouts. Argentina's Group J draw (Algeria, Austria, Jordan) is favorable enough to rest him strategically. When he does play, his passing vision and spatial awareness remain unmatched, even if the electric dribbling has slowed. The key question is fitness: if the ankle holds up, Messi's tournament intelligence and ability to produce decisive moments in tight games makes Argentina genuine favorites for back-to-back titles.`,
    ronaldo: `At 41, Ronaldo's role will be redefined. Portugal's coaching staff face a delicate balancing act — his aerial threat and penalty-box instinct remain elite, but the pressing demands of modern football require younger legs around him. Group K (Colombia, Uzbekistan, ICP1) should provide safe passage, but the knockout rounds will test whether Ronaldo can deliver in open play against top defenses. His free-kick threat has diminished, but his heading ability and sheer determination to score make him dangerous in any match. The emotional factor cannot be underestimated — this man refuses to go quietly.`,
    mbappe: `Mbappé at 27 is the perfect combination of experience and physical prime. His acceleration over 10-30 meters remains the most devastating weapon in world football, and his decision-making in the final third has matured significantly since the 2022 final. At Real Madrid, he's learned to play within a system rather than relying purely on individual brilliance. Group I pits France against Norway (Haaland), creating the tournament's most anticipated group-stage clash. Expect Mbappé to target 5+ goals — he has the quality, the service, and the big-game mentality to win the Golden Boot.`,
    haaland: `Haaland's World Cup debut is the biggest storyline in Group I. His Premier League record speaks for itself — but international football is a different beast. Norway's system funnels everything through him, which makes them predictable but also devastating when the supply line works. Against France's elite defense, Haaland will need to be clinical with limited chances. Against Senegal and the playoff qualifier, he should have more space to operate. The over/under on his group-stage goals is 3 — and the smart money says over. His physical presence alone changes how opponents set up, creating space for Ødegaard and others.`,
    "vinicius-jr": `Vinícius Jr. thrives in space, and Group C opponents will give him plenty. Morocco are the exception — Hakimi knows him from Real Madrid training, and their defensive organization neutralized bigger names in 2022. The Brazil-Morocco opener is the key match: if Vinícius Jr. dominates, it sets the tone for Brazil's entire tournament. His 1v1 success rate is the highest in world football, and on the counter-attack, he's virtually unstoppable. The concern is consistency — he can disappear in matches where he's closely marked. But when he's on, there is no more exciting player to watch at this World Cup.`,
    bellingham: `Bellingham's box-to-box range makes him England's most important player by a significant margin. His ability to arrive late in the penalty area — timing runs from deep — gives England a goal threat that opponents struggle to track. Against Croatia in the opener, his energy and dynamism will be crucial in winning the midfield battle against Modrić and Kovačić. His leadership at 22 is remarkable, and the Real Madrid winning mentality he's absorbed will permeate through the England squad. Expect 2-3 goals from midfield and several key assists — he is England's difference-maker.`,
    salah: `Salah's pace may have marginally decreased, but his intelligence, positioning, and finishing remain world-class. Egypt's chances of progressing from Group G depend almost entirely on his performances against Belgium and in the must-win matches against Iran and New Zealand. His Liverpool experience in high-pressure knockout football translates directly to the World Cup stage.`,
    yamal: `At just 18, the expectation should be managed — but Yamal has already proven he doesn't respect age brackets. His Euro 2024 performances showed he can handle the biggest stages. Spain's possession-heavy system protects him, and with Pedri feeding him the ball in dangerous areas, Yamal could be the tournament's breakout star.`,
    saka: `Saka's direct style is perfectly suited to knockout football where moments of individual brilliance decide games. His ability to beat defenders one-on-one and deliver in the final third makes him England's most dangerous wide player. The Arsenal connection with Rice gives England a right-side axis that few teams can handle.`,
    pedri: `Pedri controls tempo like few others in world football. Against teams that sit deep — which most of Spain's Group H opponents will — his ability to find pockets of space and thread through-balls will be essential. He won't score many, but his influence on Spain's overall performance cannot be overstated.`,
    hakimi: `Hakimi's overlapping runs transform Morocco's shape from a 4-3-3 to an asymmetric 3-4-3 in attack. Against Brazil, his duels with Vinícius Jr. will be one of the most fascinating individual battles of the tournament. His fitness levels allow him to cover the entire right flank, and his delivery into the box has improved significantly.`,
    son: `Son's ability to cut inside onto his left foot and curl shots into the far corner remains one of football's most beautiful sights. South Korea's group-stage chances depend on him being fit and firing. At 33, this is his farewell — and farewell tournaments often produce the best from great players driven by one last shot at glory.`,
    davies: `Playing a home World Cup as a refugee-turned-superstar gives Davies a narrative that transcends sport. His pace from left-back creates overloads that few teams can handle, and the Canadian crowd in Toronto and Vancouver will create an atmosphere that elevates his already electric performances. Real Madrid's tactical discipline has added structure to his raw athleticism.`,
    pulisic: `Pulisic on home soil, with a nation watching, is a different proposition. His AC Milan form has been excellent, and the semifinal-run ambitions of the US team rest heavily on his creative output. In Group D, he should have the freedom to express himself against Paraguay and Australia before tougher tests arrive.`,
    wirtz: `Wirtz and Musiala together give Germany the most exciting young creative partnership in the tournament. Wirtz's ability to receive between the lines, turn, and play incisive passes makes him the key to unlocking deep-sitting defenses. His shooting from distance is an added weapon that keeps goalkeepers honest.`,
    alvarez: `Álvarez's work rate sets the tone for Argentina's press, and his finishing in big moments — the semi-final and final goals in 2022 — proves he belongs at the highest level. With Messi's minutes managed, Álvarez will lead the line more often, and his partnership with whoever plays alongside him will be crucial to Argentina's title defense.`,
  };
  return (
    analyses[player.slug] ||
    `${player.name} will be a key figure for ${player.country} in Group ${player.group}. Their form heading into the tournament and fitness levels will determine how much impact they have on their team's World Cup campaign.`
  );
}

export default function PlayerProfile({ slug }: { slug: string }) {
  const player = getPlayerBySlug(slug);

  if (!player) {
    return (
      <main className="min-h-screen bg-[#06060f] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Player Not Found</h1>
          <Link href="/players" className="text-purple-400 hover:text-purple-300">
            ← Back to Players
          </Link>
        </div>
      </main>
    );
  }

  const color = getCountryColor(player.country);
  const relatedPlayers = getRelatedPlayers(player, 4);
  const playerMatches = allMatches.filter((m) => player.matchIds.includes(m.id));
  const aiAnalysis = generateAiAnalysis(player);

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition"
        >
          ← All Players
        </Link>

        {/* ═══ HERO SECTION ═══ */}
        <div
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden"
          style={{
            borderLeftWidth: "4px",
            borderLeftColor: color,
          }}
        >
          {/* Subtle glow */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ backgroundColor: color }}
          />

          <div className="relative">
            {/* Flag + Number */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-7xl md:text-8xl">{player.flag}</span>
              <span className="text-5xl md:text-6xl font-black text-white/10">
                #{player.number}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2">
              {player.name}
            </h1>

            {/* Position / Club / Age */}
            <p className="text-lg text-gray-400 mb-4">
              {player.position} · {player.club} · Age {player.age}
            </p>

            {/* Tagline */}
            <p className="text-xl md:text-2xl italic bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-semibold mb-6">
              &ldquo;{player.tagline}&rdquo;
            </p>

            {/* Country Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">{player.flag}</span>
              <span className="text-sm text-gray-300 font-medium">
                {player.country} · Group {player.group}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {player.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30"
                >
                  {tagLabels[tag] || tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ STORYLINE ═══ */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-10 mb-8">
          <h2 className="text-2xl font-black text-white mb-6">📖 The Story</h2>
          <div className="max-w-3xl space-y-5">
            {player.storyline.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="text-gray-300 text-base md:text-lg leading-relaxed"
                style={{ lineHeight: "1.85" }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* ═══ KEY STATS ═══ */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-black text-white mb-6">📊 Key Stats</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/[0.04] rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-white">{player.wcGoals}</div>
              <div className="text-xs text-gray-500 mt-1">WC Goals</div>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-white">{player.wcApps}</div>
              <div className="text-xs text-gray-500 mt-1">WC Apps</div>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-white">
                {player.wcTitles > 0 ? `${player.wcTitles} 🏆` : "0"}
              </div>
              <div className="text-xs text-gray-500 mt-1">WC Titles</div>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-4 text-center">
              <div className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                {player.goldenBootOdds}
              </div>
              <div className="text-xs text-gray-500 mt-1">Golden Boot Odds</div>
            </div>
          </div>

          {/* Achievements */}
          <div className="flex flex-wrap gap-2">
            {player.keyStats.map((stat, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ WORLD CUP SCHEDULE ═══ */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-black text-white mb-6">
            🏟️ {player.firstName}&apos;s World Cup Schedule
          </h2>

          <div className="space-y-4">
            {playerMatches.map((m) => {
              const isHome = m.home === player.country;
              const opponent = isHome ? m.away : m.home;
              const opponentFlag = isHome ? m.awayFlag : m.homeFlag;

              return (
                <div
                  key={m.id}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-xs text-gray-500">{m.date}</div>
                      <div className="text-xs text-gray-600">{m.time}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{player.flag}</span>
                      <span className="text-xs font-bold text-gray-500">VS</span>
                      <span className="text-2xl">{opponentFlag}</span>
                      <span className="text-sm font-bold text-white">{opponent}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">{m.venue}, {m.city}</span>
                    <Link
                      href={`/match/${m.id}`}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition whitespace-nowrap"
                    >
                      View Analysis →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ AI ANALYSIS ═══ */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-black text-white mb-6">
            🧠 AI Analysis: How Will {player.name} Perform?
          </h2>
          <p
            className="text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl"
            style={{ lineHeight: "1.85" }}
          >
            {aiAnalysis}
          </p>
        </div>

        {/* ═══ RELATED PLAYERS ═══ */}
        {relatedPlayers.length > 0 && (
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8">
            <h2 className="text-2xl font-black text-white mb-6">
              Other Stars to Watch
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedPlayers.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/players/${rp.slug}`}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/20 transition group"
                  style={{
                    borderLeftWidth: "3px",
                    borderLeftColor: getCountryColor(rp.country),
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{rp.flag}</span>
                    <span className="text-xs text-gray-500">#{rp.number}</span>
                  </div>
                  <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition uppercase">
                    {rp.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">
                    {rp.position} · {rp.club}
                  </p>
                  <p className="text-xs italic text-purple-400/80">
                    &ldquo;{rp.tagline}&rdquo;
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
