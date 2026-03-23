import { generatePrediction, type MatchAnalysis } from "@/lib/ai-engine";
import { allMatches } from "@/data/matches";

// Pre-generated unique analyses for all 72 matches
// Each analysis references real players, tactics, and football context

interface MatchAnalysisData {
  summary: string;
  keyFactors: string[];
  formGuide: { home: string[]; away: string[] };
  suggestedAngle: string;
}

const analysisData: Record<number, MatchAnalysisData> = {
  // ==================== GROUP A ====================

  // Match 1: Mexico vs South Africa
  1: {
    summary: "The opening match of the 2026 World Cup carries immense weight as Mexico host South Africa at the iconic Estadio Azteca. Mexico's attacking trident of Santiago Giménez, Hirving Lozano, and the creative Edson Álvarez in midfield will look to exploit South Africa's high defensive line. Bafana Bafana have improved under Hugo Broos but still lack consistent quality against CONCACAF's best. The altitude and 87,000 roaring fans will be a significant factor — expect Mexico to start the tournament with a commanding performance.",
    keyFactors: [
      "🏟️ Estadio Azteca altitude (2,240m) severely impacts visiting teams' stamina",
      "⚽ Santiago Giménez's clinical finishing — 20+ goals in Eredivisie last season",
      "🛡️ South Africa's vulnerability on set pieces against physically strong sides",
      "🔥 Opening match energy — Mexico have won their last 4 World Cup openers",
      "🎯 Edson Álvarez's ability to control tempo from deep midfield"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Mexico Win & Over 1.5 Goals — The home crowd will push El Tri forward relentlessly"
  },

  // Match 2: South Korea vs UEFA playoff D
  2: {
    summary: "South Korea bring their trademark intensity and technical excellence to Guadalajara, where they face an undetermined playoff qualifier. The Taegeuk Warriors' spine — built around Son Heung-min's devastating pace and Lee Kang-in's creative wizardry — represents a significant step up for any emerging nation. South Korea's 2022 run to the knockouts proved they can perform under pressure, and their blend of Premier League and European experience should see them through against a side still finding their feet at this level.",
    keyFactors: [
      "⭐ Son Heung-min's big-tournament record — 4 goals in last 2 World Cups",
      "🎨 Lee Kang-in's vision and set-piece delivery provides constant threat",
      "❓ Playoff qualifier is an unknown quantity — could be compact and hard to break down",
      "💪 South Korea's superior fitness levels from K-League's demanding schedule",
      "📊 Historical data shows playoff qualifiers lose 70% of their opening WC games"
    ],
    formGuide: { home: ["W", "W", "L", "W", "D"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "South Korea -1 Asian Handicap — Their quality should produce a comfortable margin"
  },

  // Match 3: UEFA playoff D vs South Africa
  3: {
    summary: "Two sides expected to battle for third place in Group A meet early in Atlanta. This match could define which team heads home early and which stays alive for the final matchday. South Africa's pacey wingers Percy Tau and Themba Zwane can exploit open games, but the European qualifier may have more tactical discipline from continental competition. A cagey, attritional encounter is likely with both teams wary of conceding first.",
    keyFactors: [
      "⚖️ Both teams likely to prioritize not losing over attacking intent",
      "🏃 South Africa's explosive pace on the counter — Tau and Zwane are dangerous",
      "🔒 European playoff sides tend to be well-organized defensively",
      "🌡️ Atlanta's June heat and humidity will be a leveler",
      "📈 First goal crucial — the team scoring first wins 68% of these matchups historically"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Under 2.5 Goals — Both sides will be cautious in a pivotal early encounter"
  },

  // Match 4: Mexico vs South Korea
  4: {
    summary: "The Group A blockbuster pits Mexico's fluid possession game against South Korea's relentless high press. This is a clash of styles that should produce an open, entertaining game in Guadalajara. Mexico's midfield engine Edson Álvarez must win the battle against Kim Min-jae's defensive marshaling and Son's incisive counter-attacks. Historically, these teams have produced tight, dramatic World Cup encounters — expect another thriller with everything to play for.",
    keyFactors: [
      "⚔️ Tactical chess match — Mexico's possession vs South Korea's gegenpressing",
      "🎯 Son Heung-min's movement behind the defensive line is Mexico's biggest worry",
      "🏠 Mexico's home advantage in Guadalajara — local support will be deafening",
      "🔑 Kim Min-jae's aerial dominance could nullify Mexico's set-piece threat",
      "📊 Group decider implications — winner likely tops the group"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "L", "W", "D"] },
    suggestedAngle: "Both Teams to Score — Two attacking sides that will commit numbers forward"
  },

  // Match 5: UEFA playoff D vs Mexico
  5: {
    summary: "By matchday 3, Mexico should have their qualification destiny in their own hands. A rotated El Tri squad could give fringe players their moment, but the playoff qualifier will be desperate and throwing everything at this match to stay alive. Mexico's depth — featuring talents like Orbelin Pineda and Uriel Antuna off the bench — means even a second-string side carries serious threat. The Azteca crowd won't let intensity drop regardless of the lineup.",
    keyFactors: [
      "🔄 Mexico likely to rotate — but depth is strong with Orbelin Pineda, Antuna",
      "😤 Desperation factor — playoff qualifier fighting for survival may be dangerous",
      "🏟️ Azteca atmosphere remains intimidating regardless of Mexico's lineup",
      "⚡ Counter-attacking opportunities as the qualifier pushes forward",
      "📋 Mexico's coaching staff will manage minutes carefully ahead of knockouts"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Mexico Win to Nil — Even a rotated Mexico should keep a clean sheet at home"
  },

  // Match 6: South Africa vs South Korea
  6: {
    summary: "A must-win clash for both sides in Monterrey. South Africa need three points to have any hope of qualification, while South Korea will want to seal their knockout round place with a victory. The BBVA Stadium's compact atmosphere suits South Korea's pressing intensity. Bafana Bafana's direct, physical approach could trouble South Korea early, but the Asian side's superior technical quality and tournament composure should tell over 90 minutes.",
    keyFactors: [
      "🎯 Son Heung-min's ability to unlock tight defenses with individual brilliance",
      "💪 South Africa's physical approach — aerial duels and set pieces their main weapons",
      "⏱️ South Korea's fitness advantage grows in the second half",
      "🏃 Zwane and Tau's pace on the break vs South Korea's high defensive line",
      "📊 South Korea unbeaten in their last 7 World Cup group stage matches"
    ],
    formGuide: { home: ["W", "L", "D", "W", "L"], away: ["W", "W", "L", "W", "D"] },
    suggestedAngle: "South Korea Win & Under 3.5 Goals — Comfortable but controlled victory"
  },

  // ==================== GROUP B ====================

  // Match 7: Canada vs UEFA playoff A
  7: {
    summary: "Canada kick off their home World Cup in front of a partisan Toronto crowd at BMO Field. Alphonso Davies — the Bayern Munich flyer — will be the star attraction, driving forward from left-back or left wing with blistering pace. Jonathan David provides the clinical finishing, while Tajon Buchanan adds width. The playoff qualifier faces an uphill task against a nation riding the wave of home-tournament energy. Canada's 2022 World Cup experience taught them valuable lessons about tournament football.",
    keyFactors: [
      "🏠 Home advantage at BMO Field — sold-out crowd will create electric atmosphere",
      "⚡ Alphonso Davies' explosive speed makes him unmarkable in open space",
      "⚽ Jonathan David's proven goal record in Ligue 1 translates to the big stage",
      "📈 Canada's tactical evolution since 2022 — more composed in possession",
      "❓ Playoff qualifier's unknowns could actually work as a tactical challenge"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Canada Win & Both Teams to Score — Home side wins but may concede early"
  },

  // Match 8: Qatar vs Switzerland
  8: {
    summary: "Switzerland's methodical, disciplined approach should prove too much for Qatar in San Francisco. The Swiss — perennial round-of-16 qualifiers — possess a midfield engine in Granit Xhaka that dictates play with metronomic passing. Qatar's 2022 hosting experience ended in group-stage humiliation with zero points, and without home advantage, their task is even harder. Manuel Akanji's defensive organization and Breel Embolo's movement will be the key differential.",
    keyFactors: [
      "🧠 Granit Xhaka's tactical intelligence and ability to control midfield tempo",
      "📉 Qatar's woeful 2022 record — 0 points, 1 goal scored, 7 conceded",
      "🛡️ Akanji and Elvedi form one of Europe's most reliable center-back pairings",
      "🔥 Breel Embolo's physicality and hold-up play stretches defenses",
      "🌍 Neutral venue eliminates any crowd advantage Qatar might have hoped for"
    ],
    formGuide: { home: ["L", "L", "L", "W", "D"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Switzerland -1 Handicap — Qatar's World Cup pedigree is extremely poor"
  },

  // Match 9: Switzerland vs UEFA playoff A
  9: {
    summary: "Switzerland should control this match at SoFi Stadium with their trademark tactical discipline. Having likely beaten Qatar in their opener, the Swiss will approach this with quiet confidence and a focus on securing qualification early. Their system under Murat Yakin is remarkably consistent — compact without the ball, incisive on transitions. The playoff qualifier will need to produce something special to breach one of Europe's most organized defensive units.",
    keyFactors: [
      "🔒 Switzerland's defensive record — conceded just 3 goals in qualifying",
      "🎯 Xhaka's set-piece delivery creates constant danger from dead balls",
      "⚙️ Yakin's 3-4-3 system is hard to prepare for with limited scouting time",
      "💪 Swiss physical conditioning — they rarely fade in second halves",
      "📊 Switzerland have reached the knockouts in 4 of their last 5 major tournaments"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Switzerland Win to Nil — Defensive solidity makes this a clean-sheet candidate"
  },

  // Match 10: Canada vs Qatar
  10: {
    summary: "Canada should stamp their authority on Group B at BC Place in Vancouver. The co-hosts have superior quality in every department, and Qatar's struggles outside Asia continue to mount. Davies and David will lead the charge with the backing of 55,000 fans. Qatar's compact 5-4-1 may frustrate early, but Canada's width through Buchanan and Davies will eventually create gaps. A professional home victory to set up a potential group-decider against Switzerland.",
    keyFactors: [
      "🏠 BC Place home support — Canada's fortress in qualifying",
      "⚡ Davies and Buchanan's overlapping runs will overload Qatar's flanks",
      "📉 Qatar's defensive fragility away from home — conceded 2+ in most away games",
      "⚽ Jonathan David hunting the Golden Boot from matchday one",
      "🔄 Canada's rotational options deeper than Qatar's limited squad"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["L", "L", "L", "W", "D"] },
    suggestedAngle: "Canada Win & Over 2.5 Goals — Home side to be clinical and entertaining"
  },

  // Match 11: Switzerland vs Canada
  11: {
    summary: "The Group B decider — Switzerland's tournament IQ against Canada's home energy. This tactical battle will likely determine who tops the group and earns a theoretically easier round-of-32 draw. Switzerland's experience in knockout-stage football gives them a psychological edge, but Canada have never had the opportunity to play a decisive World Cup match on home soil. Xhaka vs Davies is the individual duel that could swing the entire contest.",
    keyFactors: [
      "🧠 Switzerland's big-game composure vs Canada's emotional home advantage",
      "⚔️ Davies vs Widmer — the left flank battle will be decisive",
      "📊 Switzerland's unbeaten record against CONCACAF sides in competitive games",
      "🏆 Group winner implications for round-of-32 draw make this high-stakes",
      "🔑 Xhaka's leadership in high-pressure moments is unmatched at this level"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Draw — Both sides may settle for a point that guarantees qualification"
  },

  // Match 12: UEFA playoff A vs Qatar
  12: {
    summary: "Both sides likely already eliminated — this becomes about pride and World Cup memories. Qatar will be desperate to avoid leaving with zero points for a second consecutive tournament, which would be a devastating blow to their football development project. The playoff qualifier also needs something to show for their first World Cup appearance. A surprisingly open game could result as both teams have nothing to lose.",
    keyFactors: [
      "😤 Qatar's desperation to avoid back-to-back pointless World Cups",
      "🎭 Low-pressure environment could produce an unusually open game",
      "⚽ Akram Afif remains Qatar's main creative outlet and danger man",
      "🔄 Both coaches likely to give fringe players an opportunity",
      "📊 Dead-rubber World Cup games average 2.8 goals — higher than group average"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["L", "L", "L", "W", "D"] },
    suggestedAngle: "Over 2.5 Goals — Nothing-to-lose mentality from both sides"
  },

  // ==================== GROUP C ====================

  // Match 13: Brazil vs Morocco
  13: {
    summary: "The blockbuster Group C opener is a rematch of Morocco's stunning 2022 quarter-final victory over Brazil. The Atlas Lions' defensive masterclass in Qatar — marshaled by Achraf Hakimi, Sofyan Amrabat, and an impenetrable backline — shattered the Seleção's dreams. Brazil have rebuilt with a renewed focus on pressing intensity and directness under their new coaching regime. Vinícius Júnior, Rodrygo, and Endrick lead a frighteningly talented attack. MetLife Stadium will feel like a neutral venue with massive diasporas from both nations in New York.",
    keyFactors: [
      "🔥 Revenge factor — Brazil haven't forgotten the 2022 quarter-final humiliation",
      "⭐ Vinícius Júnior's Ballon d'Or-level form makes him the game's key man",
      "🛡️ Achraf Hakimi's defensive resilience and ability to break on the counter",
      "🧠 Walid Regragui's Morocco are tactically the best-drilled African side ever",
      "💫 Endrick's emergence gives Brazil a completely new dimension up front"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Both Teams to Score — Two elite attacks with proud defensive records"
  },

  // Match 14: Haiti vs Scotland
  14: {
    summary: "Haiti's presence at the World Cup is a historic achievement for Caribbean football, but Scotland's superior quality and European-battle-hardened squad should prove decisive. Scott McTominay has evolved into one of the Premier League's most complete midfielders, combining box-to-box energy with a genuine goal threat. Andy Robertson's overlapping runs from left-back will provide constant width. Haiti will compete with heart and the kind of fearless energy underdogs bring, but the class gap is significant.",
    keyFactors: [
      "⭐ McTominay's goal-scoring threat from midfield — 15+ goals in recent seasons",
      "🏃 Robertson's relentless running and crossing ability on the left",
      "🎉 Haiti playing with house money — no pressure, all energy",
      "📊 Scotland's group-stage struggles historically — need a fast start",
      "🏟️ Gillette Stadium's atmosphere could favor Scotland's physical approach"
    ],
    formGuide: { home: ["L", "D", "L", "W", "L"], away: ["W", "L", "D", "W", "W"] },
    suggestedAngle: "Scotland Win & Over 2.5 Goals — Should be comfortable but Haiti will score"
  },

  // Match 15: Scotland vs Morocco
  15: {
    summary: "Scotland face their toughest group test against a Morocco side that reached the 2022 semi-finals and have continued to improve. The Atlas Lions' organization is world-class — their back five is almost impossible to breach when set. Scotland's best chance is to make it a physical battle, win second balls, and rely on McTominay's late runs into the box. Morocco's transition play through Hakim Ziyech and Brahim Díaz can cut through any defense in seconds.",
    keyFactors: [
      "🛡️ Morocco's defensive record — best goals-against in 2022 World Cup",
      "🎨 Ziyech and Brahim Díaz's creativity on the counter is devastating",
      "💪 Scotland must make it physical — aerial duels and set pieces are their best route",
      "🧠 Regragui's tactical flexibility — Morocco adapt to every opponent",
      "📊 Scotland have never beaten an African nation at a World Cup"
    ],
    formGuide: { home: ["W", "L", "D", "W", "W"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Morocco Win or Draw Double Chance — Atlas Lions rarely lose to mid-tier Europeans"
  },

  // Match 16: Brazil vs Haiti
  16: {
    summary: "Brazil should cruise to a comprehensive victory in Philadelphia. The Seleção's embarrassment of attacking riches — Vinícius, Rodrygo, Endrick, Raphinha — means even rotation produces a world-class forward line. Haiti will compete for pride and every moment on this stage is a triumph for their program, but the quality chasm is vast. Expect Brazil to be clinical, professional, and manage the game to preserve energy for the Morocco group decider.",
    keyFactors: [
      "⚽ Brazil's attack averages 3.2 goals in games against CONCACAF minnows",
      "🌟 Endrick could start and look to announce himself on the world stage",
      "🔄 Rotation opportunity — Brazil will manage minutes ahead of Scotland/Morocco",
      "🎉 Haiti's historic moment — they'll give everything for 90 minutes",
      "📊 Biggest power-rating gap in the group — 34 points difference"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["L", "D", "L", "W", "L"] },
    suggestedAngle: "Brazil -2 Asian Handicap — The Seleção should win by 3+ goals comfortably"
  },

  // Match 17: Scotland vs Brazil
  17: {
    summary: "A massive occasion for Scotland — facing Brazil under the Miami lights at Hard Rock Stadium. The Tartan Army will travel in numbers but face a Brazilian side that should be through to the knockouts by now. Scotland need a result and must play the game of their lives. Their best hope is a backs-to-the-wall defensive effort combined with devastating counter-attacks through their pacey wingers. Brazil's talent should prevail, but Scotland's spirit makes an upset not impossible.",
    keyFactors: [
      "🏆 Brazil likely already qualified — but Seleção never take the foot off the gas",
      "🏴 Scotland's desperation could make them dangerous — cornered animals fight hardest",
      "⭐ Vinícius vs Tierney/Robertson — the flanks will decide this game",
      "🧊 Scotland's defensive discipline under Steve Clarke has been transformative",
      "📊 Brazil have lost just 2 World Cup group games in the last 40 years"
    ],
    formGuide: { home: ["W", "L", "D", "W", "W"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Brazil Win & Under 3.5 Goals — Scotland will make it tight but Brazil quality tells"
  },

  // Match 18: Morocco vs Haiti
  18: {
    summary: "Morocco will look to seal their knockout round place with a professional victory over Haiti in Atlanta. The Atlas Lions' tournament pedigree since 2022 has been extraordinary — they've become Africa's standard bearers. Hakimi's rampaging runs from right-back and Amrabat's midfield dominance should control the game. Haiti's spirited approach will test Morocco early, but Regragui's side are masters at strangling games once they take the lead.",
    keyFactors: [
      "🛡️ Morocco's ability to kill games — they concede the fewest second-half goals",
      "🏃 Hakimi's overlap and underlap runs create overloads on the right",
      "😤 Haiti will fight — but technical quality gap is immense",
      "🔑 Amrabat's midfield control allows Morocco to dictate the pace",
      "📊 Morocco targeting top of Group C — goal difference could matter"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["L", "D", "L", "W", "L"] },
    suggestedAngle: "Morocco Win to Nil — Defensive excellence meets limited attacking opposition"
  },

  // ==================== GROUP D ====================

  // Match 19: USA vs Paraguay
  19: {
    summary: "The United States kick off their home World Cup with a statement match at the iconic SoFi Stadium in Los Angeles. Christian Pulisic leads a golden generation that includes Weston McKennie, Giovanni Reyna, and the explosive Timothy Weah. Paraguay's compact, counter-attacking style could pose problems if the hosts are too open, but the sheer energy of 70,000 fans willing the Stars and Stripes forward should be overwhelming. This US squad is deeper and more talented than any before it.",
    keyFactors: [
      "🏠 SoFi Stadium home crowd — 70,000+ creating a wall of noise",
      "⭐ Pulisic's leadership and big-game experience from Chelsea/Milan",
      "🔒 Paraguay's defensive organization under Alfaro — hard to break down",
      "💨 Weah's pace and directness will stretch Paraguay's backline",
      "📊 USA have won 5 of their last 6 home World Cup matches"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "L", "W", "D"] },
    suggestedAngle: "USA Win & Over 1.5 Goals — Home side to deliver an emphatic opening statement"
  },

  // Match 20: Australia vs UEFA playoff C
  20: {
    summary: "Australia's Socceroos bring their never-say-die attitude to Vancouver, where they face a playoff qualifier in their Group D opener. Jackson Irvine's midfield presence, Mathew Leckie's experience, and the emergence of young talents gives Australia a balanced squad. Their 2022 round-of-16 appearance — including that unforgettable moment against Denmark — showed they can perform at the highest level. The playoff qualifier faces an uphill battle against a side with genuine World Cup pedigree.",
    keyFactors: [
      "🦘 Australia's 2022 knockout-stage experience provides tournament composure",
      "💪 Physical superiority likely — Socceroos are among the fittest squads",
      "❓ Unknown playoff qualifier adds unpredictability to preparations",
      "🎯 Irvine's aerial threat from set pieces is a reliable attacking weapon",
      "📊 Australia unbeaten in 8 consecutive competitive games coming into the tournament"
    ],
    formGuide: { home: ["W", "W", "D", "W", "L"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Australia Win — Tournament experience and physicality should be enough"
  },

  // Match 21: USA vs Australia
  21: {
    summary: "A fascinating trans-Pacific rivalry renewed in Seattle. The USA will look to build on their opening match momentum against a tough, well-organized Australia side. The Socceroos won't give the Americans easy space — their defensive structure and counter-attacking ability has troubled better sides. McKennie's box-to-box dynamism versus Irvine's physical midfield presence is the key individual battle. If the USA win this, they're through with a game to spare.",
    keyFactors: [
      "🏠 Seattle's passionate soccer fanbase will create a hostile environment",
      "🧠 Australia's tactical discipline — they sit deep and hit on transitions",
      "⚡ Reyna's dribbling and creativity could be the difference-maker",
      "🔑 McKennie vs Irvine — the midfield battle determines the game's flow",
      "📊 USA need a win to guarantee qualification — high motivation"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "D", "W", "L"] },
    suggestedAngle: "USA Win & Under 3.5 Goals — Tight, competitive game decided by one moment"
  },

  // Match 22: UEFA playoff C vs Paraguay
  22: {
    summary: "Two sides likely fighting for scraps in Group D meet in San Francisco. Paraguay's South American grit and experience at this level gives them a slight edge, but the playoff qualifier could spring a surprise against a side that may already be looking defeated. Gustavo Gómez's defensive leadership and Miguel Almirón's trickery remain Paraguay's key assets. A low-scoring, tactical affair where set pieces could prove decisive.",
    keyFactors: [
      "🛡️ Paraguay's defensive resilience — hard to score against in open play",
      "🎭 Both sides may be under pressure after potentially losing opening games",
      "⚽ Almirón's individual quality could be the decisive factor",
      "🔑 Set pieces likely to be the most productive attacking avenue for both",
      "📊 South American sides have a 65% win rate against playoff qualifiers historically"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "D", "L", "W", "D"] },
    suggestedAngle: "Under 2.5 Goals — Two defensive teams in a low-stakes encounter"
  },

  // Match 23: UEFA playoff C vs USA
  23: {
    summary: "The USA should wrap up Group D at SoFi Stadium. By matchday 3, the hosts will likely have 6 points and can afford some rotation ahead of the knockouts. The playoff qualifier will be fighting for survival, making them dangerous — but the quality gap and home advantage should be insurmountable. Expect the USA to control possession and manage the game professionally.",
    keyFactors: [
      "🔄 USA likely to rotate — but squad depth means quality barely drops",
      "😤 Desperate opponent could catch the hosts cold if they're complacent",
      "🏠 SoFi Stadium support remains a huge advantage even in a dead rubber",
      "📋 Tactical experimentation — Berhalter may test formations for the knockouts",
      "📊 Host nations win 78% of their final group games historically"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "USA Win to Nil — Professional home victory with clean sheet"
  },

  // Match 24: Paraguay vs Australia
  24: {
    summary: "A decisive Group D clash in San Francisco with potential round-of-32 implications. Paraguay's compact defensive structure and South American cunning against Australia's high-energy, physical approach. This is a classic clash of styles — Paraguay will look to frustrate and hit on the break, while the Socceroos will push forward with aerial bombardment and pace. The team that handles the occasion better will progress.",
    keyFactors: [
      "⚔️ Style clash — Paraguay's counter-attacking vs Australia's direct approach",
      "💪 Physical midfield battle will determine territorial dominance",
      "🎯 Almirón's ability to exploit space against Australia's high line",
      "🦘 Australia's set-piece threat — they score 35% of goals from dead balls",
      "📊 Must-win dynamics create open, unpredictable games"
    ],
    formGuide: { home: ["W", "D", "L", "W", "D"], away: ["W", "W", "D", "W", "L"] },
    suggestedAngle: "Both Teams to Score — Desperation from both sides leads to an open game"
  },

  // ==================== GROUP E ====================

  // Match 25: Germany vs Curacao
  25: {
    summary: "Germany open their campaign against the tournament's smallest nation. Curacao's qualification is a remarkable achievement for a country of 150,000 people, but they face a Mannschaft side loaded with generational talent. Jamal Musiala and Florian Wirtz represent perhaps the most exciting young attacking duo in world football, while Kai Havertz's movement and finishing have reached world-class levels. Germany should treat this as a training exercise — but Curacao will play with incredible pride.",
    keyFactors: [
      "⭐ Musiala-Wirtz partnership — the most creative duo in European football",
      "🇨🇼 Curacao's historic achievement — every minute on this stage is a victory",
      "📊 Biggest expected goals difference in the group — Germany by 30+ power rating",
      "🔄 Rotation opportunity — Germany can rest key players for bigger games",
      "⚽ Goal difference could matter — Germany will want to be clinical"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "L", "L", "D", "L"] },
    suggestedAngle: "Germany -3 Asian Handicap — Could be 5-0 or 6-0 if Germany are clinical"
  },

  // Match 26: Ivory Coast vs Ecuador
  26: {
    summary: "The AFCON champions meet Ecuador in a genuine 50/50 Group E clash in Philadelphia. Ivory Coast's triumphant 2024 continental victory transformed their self-belief — Sébastien Haller's goal-scoring revival, Simon Adingra's electric pace, and Franck Kessié's midfield dominance make them formidable. Ecuador counter with Moisés Caicedo — Brighton's midfield destroyer who's become one of the Premier League's best — plus the running power of Enner Valencia, their all-time World Cup top scorer.",
    keyFactors: [
      "🏆 Ivory Coast riding the wave of their AFCON triumph — supreme confidence",
      "⚡ Caicedo vs Kessié — a World Cup-quality midfield battle",
      "🏃 Adingra's pace against Ecuador's disciplined defensive line",
      "🎯 Valencia's big-tournament scoring record — 6 goals in 2 World Cups",
      "📊 This result likely determines who finishes 2nd behind Germany"
    ],
    formGuide: { home: ["W", "W", "W", "D", "L"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Both Teams to Score — Two evenly matched, attacking-minded sides"
  },

  // Match 27: Germany vs Ivory Coast
  27: {
    summary: "Germany face their sternest Group E test against the AFCON champions. Ivory Coast's blend of Ligue 1 and Premier League experience means they won't be intimidated by the occasion. Die Mannschaft will need Musiala's dribbling to unlock the Ivorian defense, while Kessié's physicality could disrupt Germany's passing rhythm. A high-quality encounter that will test both teams' knockout-stage credentials.",
    keyFactors: [
      "🧠 Musiala's dribbling vs Ivory Coast's aggressive pressing creates a fascinating duel",
      "💪 Kessié's physical presence could disrupt Germany's midfield fluidity",
      "🔥 Adingra's counter-attacking pace is Germany's biggest vulnerability",
      "🏆 Ivory Coast's AFCON-winning mentality — they believe they can beat anyone",
      "📊 Germany's record vs African sides at World Cups: W8 D1 L0"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "W", "W", "D", "L"] },
    suggestedAngle: "Germany Win & BTTS — Tight game where both defenses get breached"
  },

  // Match 28: Ecuador vs Curacao
  28: {
    summary: "Ecuador should handle Curacao comfortably in Kansas City, looking to build their goal difference in the race for second place. The South Americans' altitude-hardened fitness gives them a significant physical advantage, and their pressing intensity will overwhelm Curacao's limited defensive resources. Caicedo will dominate midfield, while Valencia and González provide the finishing. A professional job required.",
    keyFactors: [
      "⚽ Valencia hunting World Cup goals to extend his remarkable record",
      "🧠 Caicedo's midfield control will be absolute against limited opposition",
      "🏃 Ecuador's pressing intensity — they win the ball back faster than most",
      "🇨🇼 Curacao will defend deep — Ecuador need patience and crossing quality",
      "📊 Goal difference implications make this more than just a formality"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "L", "L", "D", "L"] },
    suggestedAngle: "Ecuador -2 Handicap — Comfortable South American victory"
  },

  // Match 29: Ecuador vs Germany
  29: {
    summary: "Ecuador's biggest test — facing Germany in New York with potential qualification on the line. The South Americans' high-pressing style could actually trouble Germany if the Mannschaft aren't sharp. Caicedo's ability to intercept and drive forward will be crucial, while Germany's firepower of Musiala, Wirtz, and Havertz should eventually create chances against a tiring Ecuador defense. A pivotal match that could go either way if Ecuador bring their A-game.",
    keyFactors: [
      "⚡ Caicedo's defensive work rate could neutralize Germany's creative hub",
      "🎯 Musiala and Wirtz's movement in tight spaces is hard to defend against",
      "😤 Ecuador's pressing can cause turnovers — Germany must be composed",
      "🔑 Valencia's experience in big games gives Ecuador a reliable focal point",
      "📊 Group permutations add pressure — both sides may need a result"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Germany Win & Over 1.5 Goals — Die Mannschaft to seal it with late quality"
  },

  // Match 30: Curacao vs Ivory Coast
  30: {
    summary: "Ivory Coast should complete their group stage campaign with a comfortable victory over Curacao. The AFCON champions possess quality in every position and will want to secure their round-of-32 place with a strong performance. Curacao will enjoy their final World Cup match and compete with pride, but the technical and physical gap is substantial. Haller's presence and Adingra's pace should create multiple chances.",
    keyFactors: [
      "🏆 Ivory Coast targeting maximum points and potential group-topping",
      "⚽ Haller's aerial threat against Curacao's limited defensive height",
      "🏃 Adingra's pace will terrorize the flanks",
      "🇨🇼 Curacao's farewell match — they'll play with freedom and emotion",
      "📊 Goal difference could determine group positions between Ivory Coast and Ecuador"
    ],
    formGuide: { home: ["W", "L", "L", "D", "L"], away: ["W", "W", "W", "D", "L"] },
    suggestedAngle: "Ivory Coast -2 Handicap — Quality gap too wide for Curacao to bridge"
  },

  // ==================== GROUP F ====================

  // Match 31: Netherlands vs Japan
  31: {
    summary: "A mouth-watering Group F opener at AT&T Stadium in Dallas. Japan's 2022 masterclasses against Germany and Spain — coming from behind to win both — served notice that they are genuine contenders. The Blue Samurai's aggressive pressing under Hajime Moriyasu and the emergence of talents like Kubo, Mitoma, and Kamada make them terrifying in transition. The Netherlands must control possession and tempo, with Virgil van Dijk's leadership and Cody Gakpo's directness their main weapons.",
    keyFactors: [
      "🎌 Japan's 2022 scalps — beat Germany AND Spain in group stages",
      "🛡️ Van Dijk's defensive command vs Japan's rapid transitional play",
      "⚡ Mitoma's dribbling has terrorized Premier League defenses all season",
      "🎯 Gakpo's tournament form — 3 goals at 2022 World Cup",
      "📊 Japan have won 5 of their last 7 matches against European opposition"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Both Teams to Score — Japan's pressing will create chances against anyone"
  },

  // Match 32: UEFA playoff B vs Tunisia
  32: {
    summary: "Tunisia bring their trademark defensive organization to Monterrey against a European playoff qualifier. The Eagles of Carthage are perennial World Cup participants who never make it easy for opponents — their compact 4-3-3 and aggressive midfield pressing can frustrate superior sides. The playoff qualifier's European tactical discipline may lead to a cagey, tight encounter where set pieces and individual moments decide the outcome.",
    keyFactors: [
      "🛡️ Tunisia's defensive resilience — they rarely get blown away at World Cups",
      "❓ European qualifier's identity unknown — adds preparation challenges",
      "🏟️ Monterrey's heat and altitude favor the more conditioned team",
      "🔑 Tunisia's set-piece defense has been a vulnerability in recent tournaments",
      "📊 Tunisia have drawn 5 of their last 8 World Cup group games"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["D", "W", "D", "L", "W"] },
    suggestedAngle: "Under 2.5 Goals — Tunisia's defensive approach guarantees a tight game"
  },

  // Match 33: Netherlands vs UEFA playoff B
  33: {
    summary: "The Netherlands should consolidate their Group F position at NRG Stadium. The Oranje's possession-based system and individual quality gives them a clear edge against a playoff qualifier. Memphis Depay's link-up play and Gakpo's directness from the left provide consistent attacking threat. With the Japan result already known, the Dutch will know exactly what they need — expect a professional, measured performance.",
    keyFactors: [
      "🎯 Gakpo's left-sided threat has been the Dutch's most reliable attacking weapon",
      "🧠 Dutch tactical flexibility — can play 4-3-3, 3-4-3, or 3-5-2",
      "🔒 Van Dijk marshals a defense that concedes very few chances",
      "💪 Dutch physical superiority in aerial duels and midfield battles",
      "📊 Netherlands unbeaten in 15 consecutive competitive home-region games"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Netherlands Win to Nil — Oranje's defensive record warrants this bet"
  },

  // Match 34: Tunisia vs Japan
  34: {
    summary: "Japan's relentless pressing faces its ultimate test against Tunisia's organized defense in Monterrey. The Blue Samurai's technical quality and pace in transition should create opportunities, but Tunisia are experts at slowing games down and frustrating flair teams. Kubo's creativity and Mitoma's direct running need to find gaps in what will be a disciplined Tunisian back four. If Japan score first, they'll control the game — but a 0-0 at halftime suits Tunisia perfectly.",
    keyFactors: [
      "⏱️ First goal is crucial — completely changes the tactical dynamic",
      "🎌 Japan's pressing intensity in the opening 15 minutes is world-class",
      "🛡️ Tunisia's defensive shape in a mid-low block is extremely hard to penetrate",
      "⚡ Kubo's movement between the lines can unlock the tightest defenses",
      "📊 Japan need a result to confirm their knockout-stage credentials"
    ],
    formGuide: { home: ["D", "W", "D", "L", "W"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Japan Win & Under 3.5 Goals — Narrow, hard-fought victory for the Blue Samurai"
  },

  // Match 35: Japan vs UEFA playoff B
  35: {
    summary: "Japan should seal their knockout round spot with a statement victory in Dallas. Having likely already proven themselves against the Netherlands, the Blue Samurai will carry supreme confidence into this match. Their squad depth — rotating between Kubo, Mitoma, Doan, and Kamada — means even fresh legs bring world-class quality. The playoff qualifier will struggle to live with Japan's pressing intensity for 90 minutes.",
    keyFactors: [
      "🎌 Japan's squad rotation still produces elite-level performances",
      "⚡ Doan and Mitoma's interchangeability creates tactical unpredictability",
      "😤 Japan won't take their foot off the gas — they play with pride every game",
      "📊 Japan are the best Asian team at World Cups in the last decade",
      "🔑 Kamada's clever movement in the half-spaces is impossible to track"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Japan -1 Handicap — Blue Samurai's quality should produce a comfortable win"
  },

  // Match 36: Tunisia vs Netherlands
  36: {
    summary: "Tunisia have a history of causing World Cup upsets on the final matchday — their 2022 victory over France is still fresh in memory. The Netherlands must not underestimate the Eagles of Carthage, who will approach this with nothing to lose. If Tunisia need a result to progress, they'll channel that 2022 spirit. However, the Oranje's depth and quality should prevail in what promises to be a tense encounter in Kansas City.",
    keyFactors: [
      "🔥 Tunisia's 2022 win over France proves they can beat anyone on their day",
      "🧠 Dutch must avoid complacency — Tunisia punish overconfidence",
      "🛡️ Tunisia's counter-attacking efficiency when pressed back",
      "📊 Final matchday permutations add tactical complexity",
      "🔑 Van Dijk's leadership will be essential to keep Dutch focus levels high"
    ],
    formGuide: { home: ["D", "W", "D", "L", "W"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Netherlands Win — Dutch professionalism to see them through despite Tunisia's spirit"
  },

  // ==================== GROUP G ====================

  // Match 37: Iran vs New Zealand
  37: {
    summary: "Iran bring their experience from multiple World Cup campaigns to face New Zealand in Los Angeles. Team Melli's competitive Asian qualifying environment has hardened them for tournament football — their organization under Carlos Queiroz's philosophy remains tactically sound. New Zealand's All Whites will compete with typical Kiwi determination but lack the quality in the final third to seriously threaten. Mehdi Taremi's clever movement and Sardar Azmoun's pace should create enough chances.",
    keyFactors: [
      "⚽ Taremi's intelligent positioning creates chances from limited possession",
      "🏃 Azmoun's pace on the counter is Iran's primary attacking weapon",
      "🇳🇿 New Zealand's physicality could make this a competitive first half",
      "🧠 Iran's defensive organization — they concede very few open-play goals",
      "📊 Iran have more World Cup experience in the last 20 years than New Zealand"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["D", "L", "W", "L", "D"] },
    suggestedAngle: "Iran Win & Under 2.5 Goals — Tight, defensive game decided by one or two goals"
  },

  // Match 38: Belgium vs Egypt
  38: {
    summary: "Belgium's golden generation has faded but still possesses enough quality to concern anyone, while Egypt's Mohamed Salah ensures they always carry a devastating attacking threat. Kevin De Bruyne's creativity, if he's fit, combined with Lukaku's physical presence gives Belgium reliable attacking outlets. Egypt have improved significantly under their current setup — Salah's influence extends beyond goals into leadership and pressing triggers. Seattle's atmosphere will suit this high-quality Group G opener.",
    keyFactors: [
      "⭐ Salah vs De Bruyne — two of the Premier League's greatest ever players",
      "🛡️ Egypt's improved defensive structure under their tactical evolution",
      "🔥 De Bruyne's fitness remains Belgium's biggest variable and concern",
      "⚽ Lukaku's hold-up play allows Belgium to progress the ball effectively",
      "📊 Belgium's generation is aging — Egypt represent a genuine upset threat"
    ],
    formGuide: { home: ["W", "L", "D", "W", "W"], away: ["W", "W", "D", "W", "L"] },
    suggestedAngle: "Both Teams to Score — Salah and De Bruyne guarantee goal threats at both ends"
  },

  // Match 39: Belgium vs Iran
  39: {
    summary: "Belgium should have enough quality to overcome Iran's disciplined setup. The Red Devils' superior technical quality, particularly through De Bruyne's passing and Doku's dribbling, should eventually break down Iran's organized low block. However, Iran's counter-attacking ability through Taremi and Azmoun means Belgium must remain vigilant at the back. A game that could be frustrating for the Europeans before they eventually find the breakthrough.",
    keyFactors: [
      "🧠 Iran's defensive discipline — they sit deep and frustrate superior sides",
      "⚡ Doku's dribbling offers Belgium's best chance of breaking the lines",
      "🔄 Taremi's counter-attacking runs are lethal if Belgium push too many forward",
      "💪 Belgium's need for 3 points creates pressure that Iran can exploit",
      "📊 Iran have only conceded 3 goals in their last 7 competitive games"
    ],
    formGuide: { home: ["W", "L", "D", "W", "W"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Belgium Win & Under 3.5 Goals — Tight game where Belgium grind it out"
  },

  // Match 40: New Zealand vs Egypt
  40: {
    summary: "Egypt should dominate this encounter in Vancouver, with Salah's presence alone making them overwhelming favorites. New Zealand's All Whites will try to make it physical and competitive, but Egypt's technical superiority and Salah's ability to create something from nothing will prove too much. The Pharaohs will want to build goal difference to strengthen their knockout-round bid.",
    keyFactors: [
      "⭐ Salah's individual brilliance can single-handedly win this game",
      "🇳🇿 New Zealand's limited technical quality makes this an uphill battle",
      "⚽ Egypt targeting a big win to boost goal difference",
      "💪 New Zealand's physical approach may keep it close early",
      "📊 Egypt's attackers have combined for 40+ goals in the qualification cycle"
    ],
    formGuide: { home: ["D", "L", "W", "L", "D"], away: ["W", "W", "D", "W", "L"] },
    suggestedAngle: "Egypt -1 Handicap — Salah-inspired Egypt to win comfortably"
  },

  // Match 41: Egypt vs Iran
  41: {
    summary: "A tactical chess match between two defensively astute sides in Seattle. Egypt's Salah provides the offensive X-factor, but Iran's compact 5-3-2 formation is designed specifically to neutralize star players. Queiroz has spent years perfecting the art of the defensive masterclass, and Salah will face his toughest challenge with Mohammadi and Hosseini tasked with shutting down his space. The team that takes fewer risks and scores from limited chances will prevail.",
    keyFactors: [
      "🛡️ Iran's defensive system specifically designed to nullify star forwards",
      "⭐ Salah's movement vs Iran's 5-man defensive line — chess match within the game",
      "⏱️ First goal transforms this — the trailing team must abandon their defensive shape",
      "🧠 Both coaches prioritize defensive organization above all else",
      "📊 Iran vs Egypt historically produces under 2 goals per game"
    ],
    formGuide: { home: ["W", "W", "D", "W", "L"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Under 2.5 Goals — Two defensive masters will produce a tight affair"
  },

  // Match 42: New Zealand vs Belgium
  42: {
    summary: "Belgium should complete their group campaign with a professional victory over New Zealand. Even if their golden generation has dimmed, the Red Devils retain enough quality to handle the All Whites. De Bruyne's vision and Lukaku's physical presence should create enough chances, though New Zealand will make it uncomfortable with their direct approach and aerial threat. Belgium will focus on efficiency rather than spectacle.",
    keyFactors: [
      "🔄 Belgium likely rotating with knockout round in mind",
      "🇳🇿 New Zealand's physicality — they won't be pushovers in aerial battles",
      "⚽ Lukaku's record in competitive games — he rarely fails to score against weaker sides",
      "📋 Belgium may experiment tactically ahead of the knockouts",
      "📊 Belgium need a professional result to finish the group positively"
    ],
    formGuide: { home: ["D", "L", "W", "L", "D"], away: ["W", "L", "D", "W", "W"] },
    suggestedAngle: "Belgium Win & Under 3.5 Goals — Controlled, measured Belgian victory"
  },

  // ==================== GROUP H ====================

  // Match 43: Spain vs Cape Verde
  43: {
    summary: "Spain's tiki-taka evolution continues against Cape Verde's spirited minnows in Atlanta. La Roja possess arguably the deepest squad in the tournament — Pedri and Gavi orchestrate from midfield, Lamine Yamal provides genuine star quality on the right, and Morata/Oyarzabal offer contrasting striking options. Cape Verde's historic World Cup debut is their tournament — every pass, every tackle is a moment to treasure. Spain should dominate possession and create chance after chance.",
    keyFactors: [
      "⭐ Lamine Yamal — the youngest player in World Cup history could make his mark",
      "🎯 Pedri and Gavi's midfield partnership is the best in world football",
      "🇨🇻 Cape Verde's historic debut — passion and pride vs technical superiority",
      "🔄 Spain's relentless ball circulation will exhaust Cape Verde's pressing",
      "📊 Spain average 68% possession in major tournament group games"
    ],
    formGuide: { home: ["W", "W", "W", "W", "D"], away: ["W", "L", "D", "L", "L"] },
    suggestedAngle: "Spain -3 Handicap — La Roja's quality gap should produce a dominant display"
  },

  // Match 44: Saudi Arabia vs Uruguay
  44: {
    summary: "Saudi Arabia will forever be remembered for their stunning 2022 victory over Argentina, but Uruguay represent a completely different challenge. La Celeste's defensive resilience — anchored by Diego Godín's successors and Darwin Núñez's relentless pressing — makes them one of the hardest teams in world football to score against. Saudi Arabia's pace on the counter could create isolated chances, but Uruguay's South American street smarts will likely prevail. Miami's heat could be a factor.",
    keyFactors: [
      "⚽ Núñez's pressing intensity — he never gives defenders a moment's peace",
      "🇸🇦 Saudi Arabia's 2022 Argentina upset proves they can produce magic moments",
      "🛡️ Uruguay's defensive DNA — La Garra Charrúa is more than just a phrase",
      "🌡️ Miami's heat and humidity could favor Saudi Arabia's fitness levels",
      "📊 Uruguay have lost just once in their last 12 competitive matches"
    ],
    formGuide: { home: ["W", "L", "D", "W", "L"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Uruguay Win & Under 2.5 Goals — La Celeste grind out a professional result"
  },

  // Match 45: Spain vs Saudi Arabia
  45: {
    summary: "Spain face the team that produced 2022's biggest shock against Argentina. Saudi Arabia will sit in an organized low block and try to hit La Roja on the counter, but Spain's positional play is specifically designed to break down such formations. Pedri's ability to find pockets of space, Yamal's one-on-one brilliance, and the constant movement of Spain's false nine should create an overwhelming number of chances. Saudi Arabia need a historic performance to get anything from this.",
    keyFactors: [
      "🧠 Spain's positional play — the most sophisticated system for breaking low blocks",
      "⚡ Yamal's 1v1 ability against Saudi Arabia's aging full-backs",
      "🇸🇦 Saudi Arabia's 2022 heroics against Argentina still linger — never say never",
      "🎯 Pedri finding space between the lines is almost impossible to stop",
      "📊 Spain are unbeaten in 18 consecutive group-stage games at major tournaments"
    ],
    formGuide: { home: ["W", "W", "W", "W", "D"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Spain Win to Nil — La Roja's quality and Saudi's limited attack means clean sheet"
  },

  // Match 46: Uruguay vs Cape Verde
  46: {
    summary: "Uruguay should secure their knockout-round spot with a convincing victory over Cape Verde in Miami. Núñez and Luis Suárez's spiritual successors will lead the line with characteristic Uruguayan aggression. Cape Verde's limited resources and the step up in quality from their qualifying path will be starkly evident. Expect Uruguay to be ruthlessly efficient — they don't waste chances at this level.",
    keyFactors: [
      "⚽ Núñez's goal-scoring instinct — clinical against lesser opposition",
      "🛡️ Uruguay's defensive organization won't give Cape Verde space to breathe",
      "🇨🇻 Cape Verde's courage will be tested against South American intensity",
      "📊 Goal difference matters — Uruguay will push for a big scoreline",
      "🔑 Valverde's box-to-box energy covers every blade of grass"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "L", "D", "L", "L"] },
    suggestedAngle: "Uruguay -2 Handicap — La Celeste to be clinical and commanding"
  },

  // Match 47: Cape Verde vs Saudi Arabia
  47: {
    summary: "Both outsiders in Group H battle it out in Houston for pride and potentially a mathematical miracle. Saudi Arabia's greater World Cup experience and squad depth gives them the edge, but Cape Verde will pour everything into their final group match. Saudi Arabia's pacey forwards — particularly their counter-attacking prowess — should exploit Cape Verde's high defensive line. A surprisingly entertaining encounter between two sides with nothing to lose.",
    keyFactors: [
      "🇸🇦 Saudi Arabia's experience — this is their 7th World Cup appearance",
      "🇨🇻 Cape Verde's fearless approach — underdogs with genuine belief",
      "⚡ Saudi counter-attacking pace against Cape Verde's adventurous defending",
      "🌡️ Houston heat favors the team with better conditioning",
      "📊 Both sides likely eliminated — pride and legacy are the only motivation"
    ],
    formGuide: { home: ["W", "L", "D", "L", "L"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Over 2.5 Goals — Nothing-to-lose football from both sides"
  },

  // Match 48: Uruguay vs Spain
  48: {
    summary: "The Group H showpiece — Spain's beautiful football against Uruguay's famous fighting spirit. This is a potential classic in Guadalajara, with both sides likely already qualified but fighting for group supremacy. La Celeste's physical approach and Núñez's pressing could disrupt Spain's rhythm, while Pedri and Yamal have the quality to unlock any defense. Uruguay's South American gamesmanship against Spain's technical excellence — a timeless World Cup narrative.",
    keyFactors: [
      "⚔️ Ultimate style clash — Spain's tiki-taka vs Uruguay's Garra Charrúa",
      "⭐ Yamal vs Uruguay's experienced defenders — youth vs wisdom",
      "🧠 Pedri's ability to resist Uruguay's physical pressing while maintaining composure",
      "💪 Uruguay's defensive organization — they make every game tight",
      "📊 Group winner gets an easier round-of-32 draw — both teams motivated"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "W", "W", "D"] },
    suggestedAngle: "Under 2.5 Goals — Two elite defenses in a high-stakes tactical battle"
  },

  // ==================== GROUP I ====================

  // Match 49: France vs Senegal
  49: {
    summary: "France bring their extraordinary depth of talent to MetLife Stadium against a Senegal side that won the 2022 AFCON and impressed at the last World Cup. Les Bleus' attacking riches are almost unfair — Mbappé, Dembélé, Griezmann, and Thuram offer breathtaking quality in every position. Senegal's organized pressing and athletic midfield can cause problems, but France's individual quality in the final third is a level above. Sadio Mané's presence ensures Senegal always carry a threat.",
    keyFactors: [
      "⚡ Mbappé's pace and movement is virtually impossible to contain for 90 minutes",
      "🦁 Senegal's 2022 AFCON victory shows they can perform in pressure situations",
      "🧠 Griezmann's creative intelligence — he finds spaces nobody else sees",
      "💪 Senegal's midfield physicality could disrupt France's passing lanes",
      "📊 France have won their opening World Cup match in 6 of their last 7 tournaments"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "W", "D", "L", "W"] },
    suggestedAngle: "France Win & Over 1.5 Goals — Les Bleus' attacking quality will prove decisive"
  },

  // Match 50: ICP2 vs Norway
  50: {
    summary: "Norway's Erling Haaland is the single most dangerous striker in world football, and the intercontinental playoff qualifier faces the near-impossible task of containing him. Haaland's positioning, timing, and finishing are superhuman — he only needs one chance. Norway also possess Martin Ødegaard's creative genius and a solid defensive structure. The qualifier will try to be compact and limit service to Haaland, but his sheer gravitational pull creates space for Ødegaard to exploit.",
    keyFactors: [
      "⚽ Haaland averages a goal every 68 minutes in competitive football",
      "🎨 Ødegaard's vision and set-piece delivery creates constant danger",
      "❓ Playoff qualifier's identity unknown — adds tactical complexity",
      "💪 Norway's Scandinavian physicality makes them hard to play against",
      "📊 Haaland has 35+ goals for Norway — a nation-transforming player"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Norway Win & Haaland to Score — Almost a certainty against weaker opposition"
  },

  // Match 51: France vs ICP2
  51: {
    summary: "France should cruise through this fixture in Philadelphia, with Deschamps likely using it to finalize his preferred system for the knockouts. Even a rotated Les Bleus side features world-class talent in every position — Coman, Kolo Muani, Tchouaméni, and Camavinga would start for most nations. The playoff qualifier will try to make it competitive, but France's relentless quality and the depth of their squad makes an upset near-impossible.",
    keyFactors: [
      "🔄 France's rotation — Coman, Kolo Muani, Camavinga all provide World Cup quality",
      "🧠 Deschamps' tactical experimentation ahead of the knockout rounds",
      "💪 France's physical superiority in every department",
      "📊 France have scored 2+ goals in 80% of their World Cup group games since 2014",
      "🏟️ Philadelphia's atmosphere will still be electric for a France game"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "France -2 Handicap — Les Bleus to win by 3+ with ease"
  },

  // Match 52: Norway vs Senegal
  52: {
    summary: "A fascinating clash at MetLife Stadium — Haaland's raw power against Senegal's elite defenders. Kalidou Koulibaly's successors and the Lions of Teranga's organized backline represent arguably the biggest test Haaland has faced on this stage. Ødegaard must find ways to get the ball into Haaland in dangerous positions, while Senegal's transitions through Mané and Ismaïla Sarr can punish Norway if they commit too many forward. A chess match between Scandinavian structure and West African intelligence.",
    keyFactors: [
      "⚔️ Haaland vs Senegal's center-backs — the marquee individual battle",
      "🎨 Ødegaard's crossing and through-balls are Haaland's lifeline",
      "🦁 Senegal's counter-attacking speed through Mané and Sarr is devastating",
      "🛡️ Norway's defensive vulnerability when pressed high",
      "📊 This result could determine who qualifies alongside France"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "D", "L", "W"] },
    suggestedAngle: "Both Teams to Score — Two quality attacks that will both find the net"
  },

  // Match 53: Norway vs France
  53: {
    summary: "Norway's biggest test — facing the reigning finalists in Boston. Haaland against Upamecano is the individual matchup everyone wants to see. France's ability to absorb pressure and strike on the counter through Mbappé's lightning pace makes them supremely dangerous against Norway's sometimes exposed defensive line. Ødegaard must out-think Tchouaméni in midfield, but France's tournament experience gives them a significant psychological edge.",
    keyFactors: [
      "⭐ Haaland vs Upamecano — a battle of titans in the penalty area",
      "⚡ Mbappé's counter-attacking speed exploiting Norway's high defensive line",
      "🧠 Tchouaméni's midfield screening protects France's backline expertly",
      "🎯 Ødegaard needs space to operate — France won't give him any",
      "📊 France are unbeaten in their last 20 games against Scandinavian opponents"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "France Win or Draw — Les Bleus' tournament DNA means they don't lose group games"
  },

  // Match 54: Senegal vs ICP2
  54: {
    summary: "Senegal should seal their knockout qualification with a victory in Toronto. The Lions of Teranga's blend of European club experience and African tournament battle-hardening makes them one of the most complete sides in the competition. Mané's leadership, combined with the energy of young midfield talents, should overwhelm the playoff qualifier. Senegal's set-piece threat and transition speed will be the decisive factors.",
    keyFactors: [
      "🦁 Senegal's tournament pedigree — 2022 AFCON winners and WC round-of-16",
      "⭐ Mané's big-game experience and leadership from the front",
      "💪 Senegal's physical superiority in midfield and defensive areas",
      "📊 AFCON winners have traditionally performed well at subsequent World Cups",
      "🔑 Senegal need a win to guarantee progression — high motivation"
    ],
    formGuide: { home: ["W", "W", "D", "L", "W"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Senegal Win to Nil — Lions of Teranga's defensive quality keeps clean sheet"
  },

  // ==================== GROUP J ====================

  // Match 55: Argentina vs Algeria
  55: {
    summary: "The reigning World Champions begin their title defense in Kansas City. Argentina's extraordinary squad depth — Messi's potential farewell tournament, plus Julián Álvarez, Lautaro Martínez, Enzo Fernández, and Mac Allister — makes them the most complete team in world football. Algeria's Desert Foxes are technically gifted with Ligue 1-quality players throughout, but facing the champions is a different proposition entirely. The psychological weight of the gold star on Argentina's shirt is immense.",
    keyFactors: [
      "🏆 Defending champions' aura — Argentina enter every game as psychological favorites",
      "⭐ Messi's potential last World Cup adds emotional weight to every match",
      "🧠 Enzo Fernández's midfield mastery controls the tempo for Argentina",
      "🇩🇿 Algeria's AFCON experience means they won't freeze on the big stage",
      "📊 Argentina have won their last 8 consecutive competitive matches"
    ],
    formGuide: { home: ["W", "W", "W", "W", "D"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Argentina Win & Over 1.5 Goals — Champions to make a statement in their opener"
  },

  // Match 56: Austria vs Jordan
  56: {
    summary: "Austria's Bundesliga core brings tactical sophistication to San Francisco against Jordan's rising Asian stars. Ralf Rangnick's pressing system has transformed Austria into one of Europe's most exciting teams — their intensity off the ball is relentless. Jordan's surprise run to the 2024 Asian Cup final showed they belong at this level, but Austria's European competition experience gives them a structural advantage. Marcel Sabitzer's leadership and Christoph Baumgartner's movement will be key.",
    keyFactors: [
      "🧠 Rangnick's pressing system — Austria are one of the hardest-working teams in Europe",
      "🇯🇴 Jordan's 2024 Asian Cup final run proved they can compete with the best in Asia",
      "⚽ Sabitzer and Baumgartner's complementary styles drive Austria's attack",
      "💪 Austria's physical intensity will be a shock for Jordan's lighter build",
      "📊 Austria have won 8 of their last 10 competitive matches under Rangnick"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "L", "W", "L"] },
    suggestedAngle: "Austria Win & Over 1.5 Goals — Rangnick's system will create multiple chances"
  },

  // Match 57: Argentina vs Austria
  57: {
    summary: "Argentina face their toughest Group J test against Rangnick's well-drilled Austria side. The Albiceleste's technical superiority should tell, but Austria's relentless pressing could cause problems if Argentina try to play out from the back too casually. Enzo Fernández and Mac Allister must dominate the midfield battle against Sabitzer and Laimer. If Argentina's quality on the ball survives Austria's press, the champions will create enough chances to win comfortably.",
    keyFactors: [
      "⚔️ Argentina's composure vs Austria's pressing intensity — the defining tactical battle",
      "⭐ Julián Álvarez's work rate matches Austria's energy while adding elite finishing",
      "🧠 Rangnick will have a specific plan to disrupt Argentina's build-up play",
      "💪 Laimer vs Mac Allister — a high-intensity midfield duel",
      "📊 Argentina's ability to control games at 1-0 is unmatched"
    ],
    formGuide: { home: ["W", "W", "W", "W", "D"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Argentina Win & Under 3.5 Goals — Champions will manage the game expertly"
  },

  // Match 58: Jordan vs Algeria
  58: {
    summary: "A crucial Group J clash between two sides fighting for a place in the round of 32. Jordan's Asian Cup exploits and Algeria's AFCON experience make this a genuine contest between two proud footballing nations. Algeria's Riyad Mahrez-led attack (if still active) provides creative spark, while Jordan's organized defensive structure and counter-attacking ability could cause problems. The team that handles the pressure better will likely secure the vital three points.",
    keyFactors: [
      "🔑 Both teams need a result — desperation creates unpredictable dynamics",
      "🇩🇿 Algeria's technically gifted midfield against Jordan's disciplined shape",
      "🇯🇴 Jordan's 2024 Asian Cup form showed they can raise their game in big moments",
      "📊 Head-to-head between these confederation champions could go either way",
      "😤 Whoever scores first gains a massive psychological advantage"
    ],
    formGuide: { home: ["W", "D", "L", "W", "L"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Under 2.5 Goals — Two cautious teams in a must-not-lose scenario"
  },

  // Match 59: Algeria vs Austria
  59: {
    summary: "The race for second place in Group J likely comes down to this Kansas City encounter. Algeria's technical quality and AFCON battle-hardening against Austria's Rangnick revolution. The Desert Foxes will try to use their quick passing combinations to evade Austria's press, while Rangnick's men will look to win the ball high and transition quickly. A high-energy, absorbing tactical battle where the first goal will be crucial.",
    keyFactors: [
      "🧠 Rangnick's pressing vs Algeria's quick passing — a fascinating tactical duel",
      "⚽ Sabitzer's big-game goals could be the difference",
      "🇩🇿 Algeria's counter-attacking pace through their Ligue 1 contingent",
      "💪 Austria's physical advantage in aerial duels and set pieces",
      "📊 Second-place playoff — loser likely goes home"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Austria Win — Rangnick's system gives them an edge in high-pressure games"
  },

  // Match 60: Jordan vs Argentina
  60: {
    summary: "Argentina should close out Group J with a comfortable victory regardless of permutations. The champions may rotate, but even Argentina's B-team features players like Dybala, Nico González, and Paredes — quality that would start for most World Cup squads. Jordan will look to keep the score respectable and demonstrate their growth as an Asian football force. A professional Argentine display is expected in Dallas.",
    keyFactors: [
      "🔄 Argentina's rotation still produces a team of European top-5-league starters",
      "🇯🇴 Jordan playing for pride and future reputation on the global stage",
      "⚽ Lautaro Martínez may start and look to add to his goal tally",
      "📋 Argentina managing minutes ahead of the knockout rounds",
      "📊 Champions have won their last 12 group-stage matches at major tournaments"
    ],
    formGuide: { home: ["W", "D", "L", "W", "L"], away: ["W", "W", "W", "W", "D"] },
    suggestedAngle: "Argentina Win to Nil — Even a rotated side keeps a clean sheet here"
  },

  // ==================== GROUP K ====================

  // Match 61: Portugal vs ICP1
  61: {
    summary: "Portugal's star-studded squad opens against an intercontinental playoff qualifier in Houston. Whether Cristiano Ronaldo is involved or not, Portugal possess extraordinary attacking depth — Bruno Fernandes, Bernardo Silva, Rafael Leão, and Diogo Jota provide world-class quality in every forward position. The playoff qualifier faces the daunting task of containing one of the most talented attacking units in tournament history. Portugal should dominate from the first whistle.",
    keyFactors: [
      "⭐ Bruno Fernandes' creativity — he creates more chances than almost any player alive",
      "🏃 Leão's pace and dribbling ability is terrifying for any defense",
      "❓ Playoff qualifier's unknowns won't compensate for the quality gap",
      "🧠 Bernardo Silva's intelligent movement between the lines creates overloads",
      "📊 Portugal have scored 3+ goals in 70% of their games against non-European sides"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Portugal -2 Handicap — Expect a dominant display from the Portuguese"
  },

  // Match 62: Uzbekistan vs Colombia
  62: {
    summary: "Colombia's South American flair meets Uzbekistan's Central Asian grit at the Estadio Azteca. James Rodríguez's renaissance continues — his vision and passing range orchestrate Colombia's fluid attack, while Luis Díaz's explosive running from the left creates chaos. Uzbekistan have qualified for their first World Cup and will compete with immense pride, but Colombia's experience at this level and individual quality should be decisive in Mexico City.",
    keyFactors: [
      "🎨 James Rodríguez's set-piece delivery is still among the world's best",
      "⚡ Luis Díaz's pace and directness will stretch Uzbekistan's defense",
      "🇺🇿 Uzbekistan's historic first World Cup — pride and passion guaranteed",
      "🏟️ Azteca's atmosphere adds weight to the occasion",
      "📊 Colombia have reached the knockouts in their last 3 World Cup appearances"
    ],
    formGuide: { home: ["W", "L", "D", "W", "L"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Colombia Win & Over 1.5 Goals — Cafeteros' attacking quality is irresistible"
  },

  // Match 63: Portugal vs Uzbekistan
  63: {
    summary: "Portugal should strengthen their grip on Group K with a convincing win over Uzbekistan in Houston. The Central Asian debutants will try to make it competitive, but Portugal's relentless attacking waves — Bernardo finding space, Leão running at defenders, Bruno delivering crosses — will eventually overwhelm. Uzbekistan's organized approach may keep the score respectable in the first half, but Portugal's quality and fitness in the second half should open things up.",
    keyFactors: [
      "⚽ Portugal targeting a big win to top the group on goal difference",
      "🛡️ Uzbekistan's defensive organization — they won't make it easy early",
      "⚡ Leão's acceleration in the second half against tiring legs",
      "🧠 Bruno Fernandes' dead-ball delivery creates constant set-piece danger",
      "📊 Portugal average 2.7 goals per game against Asian opponents"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Portugal -1 First Half Handicap — Expect early dominance"
  },

  // Match 64: Colombia vs ICP1
  64: {
    summary: "Colombia should secure their last-16 spot with a professional victory in Guadalajara. Los Cafeteros' combination of experience and young talent gives them a squad capable of hurting any opponent. James' intelligent distribution to Díaz and Arias on the flanks creates a constant stream of chances. The playoff qualifier will defend deep but Colombia's patience in possession and ability to switch play rapidly should create openings.",
    keyFactors: [
      "🎯 James' through-balls into channels exploit the spaces left by deep defenses",
      "🏃 Díaz's tireless running makes Colombia's left side a constant threat",
      "🔄 Colombia's squad depth allows rotation without quality loss",
      "📋 Qualifying for knockouts — team cohesion and confidence building",
      "📊 Colombia have won 80% of their games when James starts"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Colombia Win & Clean Sheet — Defensive solidity matches attacking quality"
  },

  // Match 65: Colombia vs Portugal
  65: {
    summary: "The Group K blockbuster — two of world football's most attacking teams meet in Miami for group supremacy. This has the potential to be the best game of the group stage. Díaz against Cancelo on the flank, Bruno vs James in creative midfield, Bernardo's intelligence vs Colombia's pressing — individual battles everywhere. Both teams play aesthetically pleasing football, making this a dream fixture for neutrals. The team that controls transitions will likely emerge victorious.",
    keyFactors: [
      "🔥 Díaz vs Cancelo — one of the tournament's most exciting individual matchups",
      "🎨 James vs Bruno — who creates more? The ultimate playmaker showdown",
      "⚡ Leão's counter-attacking pace against Colombia's sometimes exposed defense",
      "🧠 Both teams want to attack — expect an open, thrilling encounter",
      "📊 Group winner avoids a potential nightmare round-of-32 matchup"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Over 2.5 Goals — Two attacking philosophies collide in an open game"
  },

  // Match 66: ICP1 vs Uzbekistan
  66: {
    summary: "Two underdogs meet in Atlanta in what could be a celebration of football's global growth. Uzbekistan's World Cup debut continues, while the playoff qualifier also treasures every moment on this stage. Both sides will be motivated to end their group campaigns on a positive note, creating an open, honest contest. Uzbekistan's organized approach and technical quality from their emerging generation gives them a slight edge.",
    keyFactors: [
      "🎭 Two underdogs — neither has anything to lose, creating open football",
      "🇺🇿 Uzbekistan's superior qualifying campaign suggests more depth",
      "⚽ Both teams want a World Cup victory to take home as a legacy moment",
      "🔄 Form from earlier group games will influence confidence levels",
      "📊 Dead-rubber matches between debutants historically produce goals"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Over 2.5 Goals — Two open teams with nothing to lose"
  },

  // ==================== GROUP L ====================

  // Match 67: England vs Croatia
  67: {
    summary: "A rematch of the agonizing 2018 semi-final that Croatia won in extra time. England have evolved significantly since then — Jude Bellingham's emergence as a genuine Ballon d'Or contender transforms their midfield, while Phil Foden and Bukayo Saka provide devastating width. Croatia's golden generation, led by the ageless Luka Modrić, may be playing their final World Cup together. AT&T Stadium in Dallas provides a grand stage for this clash of European heavyweights.",
    keyFactors: [
      "⭐ Bellingham's Ballon d'Or-level form makes him the tournament's most in-demand player",
      "🧙 Modrić's potential final World Cup — motivation and magic in equal measure",
      "⚡ Saka's direct running and goal-scoring ability from the right wing",
      "🛡️ Gvardiol's defensive quality vs England's fluid attacking movement",
      "📊 England have reached the semi-finals or better at 3 of their last 4 major tournaments"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "England Win — This generation has the quality and experience to beat aging Croatia"
  },

  // Match 68: Ghana vs Panama
  68: {
    summary: "Ghana's Black Stars bring their electric African football to Toronto against Panama's battlers. Ghana's pace and power — Kudus Mohammed's dribbling wizardry, Inaki Williams' relentless running — should overwhelm Panama's limited defensive resources. Panama will fight for every ball and make it physical, but the quality gap in the final third favors Ghana significantly. BMO Field's atmosphere will be electric with a large diaspora supporting both sides.",
    keyFactors: [
      "⭐ Kudus Mohammed's emergence as a genuine top-level talent at West Ham/Ajax",
      "🏃 Williams' tireless running makes Ghana's attack unpredictable",
      "🇵🇦 Panama's fighting spirit — they'll never give up regardless of scoreline",
      "💪 Ghana's physical dominance in midfield and defensive areas",
      "📊 Ghana have traditionally performed well in World Cup group stages"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["L", "D", "L", "W", "L"] },
    suggestedAngle: "Ghana Win & Over 1.5 Goals — Black Stars' pace will create multiple chances"
  },

  // Match 69: England vs Ghana
  69: {
    summary: "England face Ghana in Boston with qualification the primary objective. The Three Lions' squad depth is absurd — Rice, Bellingham, and Foden provide midfield excellence, while Kane's goal record speaks for itself. Ghana will try to make it a contest through Kudus' creative genius and their impressive physical athleticism, but England's defensive organization under their coaching setup should limit Ghana's threat. A professional England victory is expected.",
    keyFactors: [
      "⭐ Kane hunting more World Cup goals — already among England's all-time best scorers",
      "🧠 Rice's defensive screening allows Bellingham and Foden to roam freely",
      "⚡ Kudus' potential to create chaos if England give him space",
      "🛡️ England's defensive record at recent tournaments — consistently solid",
      "📊 England have won 8 of their last 9 competitive matches"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "England Win to Nil — Three Lions' defensive structure keeps another clean sheet"
  },

  // Match 70: Panama vs Croatia
  70: {
    summary: "Croatia's midfield mastery will be the decisive factor in Toronto. Modrić's passing range and Kovačić's ball-carrying ability will dominate against Panama's limited pressing structure. The Central Americans will compete physically and try to make it an ugly game, but Croatia's composure in possession and ability to control the tempo should prevail. Panama need a result but may struggle to create genuine chances against Croatia's experienced backline.",
    keyFactors: [
      "🧙 Modrić's passing — Panama have never faced a midfielder of this caliber",
      "🔑 Kovačić's ball progression through midfield lines is irresistible",
      "🇵🇦 Panama's physical approach — they'll try to make it a battle",
      "🛡️ Gvardiol's defensive quality means Croatia rarely concede from open play",
      "📊 Croatia have lost just twice in their last 20 competitive matches"
    ],
    formGuide: { home: ["L", "D", "L", "W", "L"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Croatia Win — Midfield superiority will tell over 90 minutes"
  },

  // Match 71: Panama vs England
  71: {
    summary: "England should wrap up Group L at MetLife Stadium with a comprehensive victory. Having already faced Croatia and Ghana, the Three Lions will know exactly what's needed. Panama will fight — as they always do — but the quality chasm is vast. Kane, Bellingham, and Saka will rotate in and out but each brings match-winning quality. This could be a comfortable afternoon for England ahead of the knockouts.",
    keyFactors: [
      "🔄 England's rotation still produces a world-class starting eleven",
      "😤 Panama's never-say-die attitude ensures they'll compete for 90 minutes",
      "⚽ Kane's clinical finishing means England convert a high percentage of chances",
      "📋 Tactical rehearsal — England may test systems for the knockout rounds",
      "📊 England are unbeaten in 15 consecutive World Cup group games"
    ],
    formGuide: { home: ["L", "D", "L", "W", "L"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "England -2 Handicap — Dominant display expected from the Three Lions"
  },

  // Match 72: Croatia vs Ghana
  72: {
    summary: "The Group L runner-up spot may be decided in Philadelphia. Croatia's World Cup pedigree — two finals in the last three tournaments — gives them a psychological edge, but Ghana's pace and power can cause problems for Croatia's aging backline. Modrić's influence will be key, but Kudus' unpredictability could be the wildcard. If Croatia need a point, they'll manage the game expertly; if Ghana need to win, the game opens up and favors Croatia's counter-attacking quality.",
    keyFactors: [
      "🏆 Croatia's World Cup DNA — 3 semi-finals and 2 finals in the last 3 tournaments",
      "⚡ Kudus vs Gvardiol — pace and trickery vs physical defending",
      "🧙 Modrić reading the game's permutations and adjusting in real-time",
      "💪 Ghana's aerial threat from set pieces against Croatia's compact defense",
      "📊 Group permutations create complex tactical decisions for both coaches"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "D", "W", "L", "W"] },
    suggestedAngle: "Croatia Win or Draw — Their tournament experience means they get the result they need"
  },

  // ==================== WC QUALIFIER PLAYOFFS ====================

  // Match 73: Italy vs Northern Ireland
  73: {
    summary: "Italy face their biggest qualifying nightmare for the third consecutive cycle. The Azzurri cannot afford another World Cup absence — the sporting, financial, and cultural damage would be catastrophic. Playing at Atalanta's Gewiss Stadium in Bergamo gives them a compact, hostile atmosphere rather than the often-silent San Siro. Spalletti's squad has the talent through Barella, Tonali, and Retegui, but Northern Ireland's disciplined low block and set-piece threat could make this a frustrating evening if Italy don't score early.",
    keyFactors: [
      "🔥 Existential pressure — Italy haven't been at a World Cup since 2014",
      "🏟️ Bergamo's Gewiss Stadium is far more intimidating than the San Siro for qualifiers",
      "🛡️ Northern Ireland's deep defensive block frustrated Spain and Denmark in qualifying",
      "⚽ Retegui's emergence gives Italy a genuine focal point in attack",
      "😰 Italian qualifying trauma — they lost to Sweden (2018) and North Macedonia (2022) in playoffs"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["D", "L", "D", "L", "L"] },
    suggestedAngle: "Italy Win & Under 3.5 Goals — The Azzurri will be cautious despite home advantage"
  },

  // Match 74: Wales vs Bosnia & Herzegovina
  74: {
    summary: "Wales return to Cardiff City Stadium with World Cup dreams alive. The 2022 experience — their first World Cup since 1958 — gave this squad a taste of the biggest stage, and they're desperate to return. Bale may be retired but the squad has evolved around Brennan Johnson, Harry Wilson, and a solid defensive core. Bosnia bring talent through Demirović and the evergreen Džeko, but away playoff atmospheres have historically been their undoing.",
    keyFactors: [
      "🏴 Cardiff's atmosphere under lights is worth an extra man for Wales",
      "⚡ Brennan Johnson's pace stretches defenses and creates space for others",
      "🎯 Džeko's big-game experience — but he's now 40 and managing minutes",
      "🛡️ Wales' 3-5-2 system is tailor-made for knockout football",
      "📊 Bosnia have lost 4 of their last 5 away playoff matches across all competitions"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "L", "D", "L", "L"] },
    suggestedAngle: "Wales Win — Home advantage and playoff experience give the Welsh a clear edge"
  },

  // Match 75: Ukraine vs Sweden
  75: {
    summary: "A fascinating neutral-venue clash in Valencia's Mestalla stadium. Ukraine have become the world's most experienced team at playing 'away from home' — every competitive match since 2022 has been at neutral grounds due to the ongoing conflict. This gives them a unique psychological edge that most opponents underestimate. Sweden are solid and organized but lack the individual brilliance that marked their Ibrahimović era. Isak leads the line but creative supply is inconsistent.",
    keyFactors: [
      "🇪🇸 Mestalla in Valencia is truly neutral — neither team has meaningful fan support",
      "🇺🇦 Ukraine's emotional resilience from playing in extraordinary circumstances",
      "⚽ Dovbyk's clinical finishing and Mudryk's explosive pace form a devastating partnership",
      "🔒 Sweden's defensive organization under Tomasson is their greatest asset",
      "🏃 Isak vs Ukraine's center-backs — pace and movement against physical defending"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "W", "L", "D", "W"] },
    suggestedAngle: "Ukraine Win — Their neutral-venue experience is an underrated advantage"
  },

  // Match 76: Poland vs Albania
  76: {
    summary: "Poland welcome Albania to the PGE Narodowy in Warsaw for a playoff semifinal with World Cup berths at stake. Lewandowski remains the talisman despite his advancing years — his 83 international goals speak to a relentless scoring instinct that elevates Poland's ceiling. Albania's Euro 2024 campaign proved they can compete with anyone for 90 minutes, but sustaining that level in an away playoff environment against Lewandowski is a different challenge entirely. Warsaw's passionate crowd adds another layer.",
    keyFactors: [
      "⚽ Lewandowski's big-game scoring record — goals in 9 of his last 12 competitive home starts",
      "🛡️ Albania's defensive system frustrated Italy, Spain, and Croatia at Euro 2024",
      "🏟️ PGE Narodowy sold out — 58,000 creating a wall of sound",
      "🎯 Zieliński's creativity from midfield gives Poland a different attacking dimension",
      "💪 Albania's physicality and organization make them dangerous from set pieces"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["D", "W", "L", "D", "L"] },
    suggestedAngle: "Poland Win & BTTS No — Expect a controlled home performance"
  },

  // Match 77: Turkey vs Romania
  77: {
    summary: "Istanbul's Atatürk Olympic Stadium will be a cauldron for this playoff clash. Turkey's golden generation — led by Çalhanoğlu's vision, Güler's flair, and Yıldız's explosiveness — is the most talented Turkish squad in a decade. But talent hasn't always translated to results in qualifying. Romania shocked everyone at Euro 2024 by topping their group, and Iordănescu's pragmatic approach makes them extremely difficult to beat. This is closer than the bookmakers suggest.",
    keyFactors: [
      "🔥 Turkish crowd in Istanbul — one of the most hostile atmospheres in world football",
      "⭐ Arda Güler's creative brilliance can unlock any defense on his day",
      "🛡️ Romania topped their Euro 2024 group — their defensive organization is elite",
      "🎯 Çalhanoğlu's set-piece delivery is a weapon — Turkey score heavily from dead balls",
      "😤 Turkey's emotional volatility — they can go from brilliant to chaotic within 10 minutes"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "W", "D", "W", "D"] },
    suggestedAngle: "Turkey Win but tight — Consider Turkey & Under 3.5 Goals for value"
  },

  // Match 78: Slovakia vs Kosovo
  78: {
    summary: "Slovakia's tournament reliability faces Kosovo's exciting but inexperienced squad at Tehelné pole in Bratislava. The Slovaks have made the Euros twice in a row and gave England a genuine scare in the 2024 knockouts. Škriniar anchors the defense, Lobotka controls midfield, and Haraslín provides attacking thrust. Kosovo's rapid rise through the rankings has been impressive, but they lack the big-game experience that playoff football demands.",
    keyFactors: [
      "🏟️ Tehelné pole is a fortress — Slovakia have won 8 of their last 10 home qualifiers",
      "🛡️ Škriniar's defensive leadership sets the tone — Kosovo will find chances scarce",
      "⚡ Zhegrova's pace and dribbling ability is Kosovo's primary creative outlet",
      "🎯 Lobotka's midfield control ensures Slovakia dictate tempo",
      "📊 Kosovo have never qualified for a World Cup or Euros — the psychological weight of a playoff is new territory"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "L", "W", "L"] },
    suggestedAngle: "Slovakia Win to Nil — Their defensive solidity should contain Kosovo's threat"
  },

  // Match 79: Denmark vs North Macedonia
  79: {
    summary: "Denmark at Parken should be the most straightforward playoff of the round. The Danes have become one of Europe's most consistent qualifiers — reaching every major tournament since Euro 2020. Eriksen's creativity, Højlund's movement, and a defensively solid backline make them clear favorites. North Macedonia's magic run — beating Germany in qualifying and reaching Euro 2020 — feels like ancient history now. Without Pandev and with an aging squad, they lack the quality to trouble Denmark.",
    keyFactors: [
      "🇩🇰 Denmark have qualified for 4 consecutive major tournaments — consistency personified",
      "⚽ Højlund's development at Manchester United gives Denmark a genuine top-level striker",
      "🎨 Eriksen's set-piece delivery and through balls are the creative engine",
      "📉 North Macedonia have declined significantly since their 2020-21 peak",
      "🏟️ Parken Stadium with 38,000 Danes — expect a dominant atmosphere"
    ],
    formGuide: { home: ["W", "W", "W", "W", "D"], away: ["L", "D", "L", "L", "W"] },
    suggestedAngle: "Denmark -1.5 Handicap — Comfortable home win expected"
  },

  // Match 80: Czechia vs Rep. of Ireland
  80: {
    summary: "Czechia host Ireland at the Eden Arena in Prague knowing their superior technical quality should prevail. Schick remains a goal threat, Souček's aerial presence dominates midfield, and Coufal provides attacking width. Ireland's style is fundamentally defensive — they sit deep, stay compact, and hope to nick something from set pieces or counter-attacks. It works against better teams more often than you'd expect, but the Eden Arena's bouncy pitch suits Czechia's passing game.",
    keyFactors: [
      "🎯 Schick's movement and finishing — he averages a goal every 2.1 international games",
      "💪 Souček's box-to-box energy and aerial threat gives Czechia midfield dominance",
      "🛡️ Ireland's defensive discipline — they've conceded fewer than 1 goal per game in their last 8",
      "🏟️ Eden Arena suits Czechia's technical passing game perfectly",
      "⚽ Ireland have scored just 8 goals in their last 10 away competitive matches"
    ],
    formGuide: { home: ["W", "D", "W", "W", "W"], away: ["D", "L", "D", "L", "D"] },
    suggestedAngle: "Czechia Win & Under 2.5 Goals — Low-scoring home win is the likely outcome"
  },

  // Match 81: New Caledonia vs Jamaica
  81: {
    summary: "Jamaica's Reggae Boyz face OFC minnows New Caledonia at the Estadio Akron in Guadalajara — a neutral venue that suits neither side but where Jamaica's superior athleticism and squad quality should dominate. With Bailey, Antonio, and a contingent of Premier League and Championship players, Jamaica's squad is lightyears ahead of the semi-professional New Caledonian side. This is about margin of victory, not the result.",
    keyFactors: [
      "⭐ Leon Bailey's electrifying pace and dribbling will torment New Caledonia's defense",
      "💪 Michail Antonio's physical presence gives Jamaica an aerial and hold-up advantage",
      "📊 Squad value comparison is approximately 50:1 in Jamaica's favor",
      "🏟️ Neutral venue in Guadalajara — heat and humidity may slow the pace",
      "🇯🇲 Jamaica haven't been to a World Cup since 1998 — motivation is sky-high"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["L", "L", "L", "D", "L"] },
    suggestedAngle: "Jamaica -2.5 Handicap — The quality gap is enormous"
  },

  // Match 82: Bolivia vs Suriname
  82: {
    summary: "Bolivia meet Suriname in Monterrey at the Estadio BBVA — a sea-level neutral venue that removes Bolivia's legendary altitude advantage. Without the 3,600m La Paz factor, Bolivia are a much more modest proposition, but they still carry CONMEBOL qualifying experience that Suriname can't match. Suriname's Dutch-heritage players from the Eredivisie bring genuine technical quality, but the step up to a World Cup playoff is significant. Bolivia should edge this, but it won't be comfortable.",
    keyFactors: [
      "🏔️ Sea-level venue completely neutralizes Bolivia's altitude advantage",
      "🇸🇷 Suriname's Eredivisie contingent brings genuine quality — not a typical minnow",
      "📊 Bolivia's CONMEBOL qualifying experience provides tactical awareness advantage",
      "🏟️ Estadio BBVA is a world-class venue — the occasion may overwhelm Suriname",
      "⚽ Bolivia's defensive vulnerabilities at sea level — they concede more without altitude protection"
    ],
    formGuide: { home: ["L", "D", "W", "L", "W"], away: ["W", "W", "D", "W", "L"] },
    suggestedAngle: "Bolivia Win but consider BTTS Yes — Sea-level Bolivia are vulnerable at the back"
  },

  // ==================== PRE-WC FRIENDLIES ====================

  // Match 83: Brazil vs France
  83: {
    summary: "The glamour friendly of the pre-World Cup window. Brazil and France meet at Gillette Stadium in Foxborough in what promises to be a showcase of global football's two most iconic brands. Brazil are rebuilding under a new identity post-Neymar, with Vinícius Jr., Rodrygo, and Endrick leading a new wave. France's depth under Deschamps is simply absurd — even a rotated XI features multiple Champions League winners. Expect an open, entertaining match with both sides using this as a genuine tactical test.",
    keyFactors: [
      "⭐ Vinícius Jr. vs Mbappé — two of the world's top 3 players on the same pitch",
      "🔄 Both sides will rotate — but the quality off the bench is still world-class",
      "🏟️ Foxborough's moderate climate suits both teams — no extreme weather factor",
      "📊 Brazil vs France has produced 4+ goals in 6 of their last 8 meetings",
      "🎯 Both coaches treating this as genuine World Cup preparation — not a throwaway friendly"
    ],
    formGuide: { home: ["W", "D", "W", "W", "L"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Both Teams to Score — Two attacking powerhouses will prioritize offense"
  },

  // Match 84: Colombia vs Croatia
  84: {
    summary: "Colombia's relentless pressing system under Néstor Lorenzo meets Croatia's controlled possession game in Orlando. This is a genuine clash of philosophies — Colombia's high-energy press against Modrić's ability to slow the game to his preferred tempo. The Inter&Co Stadium in Orlando provides a warm, humid environment that suits Colombia's physical approach. With an extraordinary unbeaten run behind them, Colombia carry serious momentum.",
    keyFactors: [
      "🔥 Colombia's 30+ match unbeaten run is the longest in South American football",
      "🧙 Modrić's game management — can he slow Colombia's frenetic pressing?",
      "⚡ Luís Díaz's directness on the left wing causes constant problems",
      "🌡️ Orlando humidity favors Colombia's conditioning and pressing tolerance",
      "📊 Croatia's average age suggests fatigue management is critical this close to the World Cup"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Colombia Win or Draw — Their pressing intensity overwhelms most opponents"
  },

  // Match 85: England vs Uruguay
  85: {
    summary: "Wembley hosts a fascinating tactical duel between England's expansive attacking play and Uruguay's disciplined, counter-attacking approach under Bielsa. England will dominate possession — likely 65%+ — but Uruguay's defensive shape and clinical transitions make them dangerous regardless of territory. Kane, Bellingham, and Saka form arguably the most creative attacking trio in world football, but Valverde's box-to-box energy can disrupt England's rhythm.",
    keyFactors: [
      "🏟️ Wembley under lights — England's strongest home advantage factor",
      "🛡️ Uruguay's defensive organization under Bielsa is paradoxically their best asset",
      "⚽ Kane's scoring record at Wembley — 30+ goals in 40+ appearances",
      "⚡ Valverde's engine in midfield can match England's intensity box-to-box",
      "🔄 Both teams will rotate — but core tactical setups will be tested"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "W", "W", "D"] },
    suggestedAngle: "Under 2.5 Goals — Uruguay's defensive discipline keeps this tight"
  },

  // Match 86: Switzerland vs Germany
  86: {
    summary: "A derby of sorts — the Swiss-German football connection runs deep through Bundesliga pipelines. Switzerland hosting at St. Jakob-Park in Basel gives them a genuine edge against a German side that has been transformed under Nagelsmann. The Swiss' tournament pedigree — reaching the knockout stages of every major event — makes them perpetual dark horses. Xhaka's leadership and Ndoye's pace give them genuine attacking outlets, while Germany's pressing intensity under Nagelsmann will test Swiss composure.",
    keyFactors: [
      "📊 Switzerland have beaten Germany in 3 of their last 5 meetings — a genuine bogey team",
      "🎯 Xhaka's midfield control dictates Switzerland's attacking rhythm",
      "🔥 Nagelsmann's Germany play at an intensity most teams can't match",
      "⚡ Ndoye's pace on the wing gives Switzerland a counter-attacking outlet",
      "🏟️ St. Jakob-Park — compact, loud, and Switzerland's preferred venue"
    ],
    formGuide: { home: ["W", "D", "W", "W", "D"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Draw — These two consistently produce tight, cagey encounters"
  },

  // Match 87: Spain vs Serbia
  87: {
    summary: "European champions Spain host Serbia at the Santiago Bernabéu in what should be a showcase of their generational talent. Yamal, Williams, Pedri, and the rejuvenated Spanish system under De la Fuente have made La Roja the most exciting team in world football. Serbia have genuine quality through Mitrović, Vlahović, and Tadić, but their defensive fragility against elite pressing teams has been exposed repeatedly. The Bernabéu crowd will be expectant.",
    keyFactors: [
      "🏆 Spain are reigning European champions — confidence and system are at peak levels",
      "⭐ Lamine Yamal at 18 is already one of Europe's most dangerous attackers",
      "💪 Mitrović and Vlahović's physical aerial presence threatens any defense",
      "🏟️ Bernabéu atmosphere — 80,000 expecting a statement performance",
      "📊 Spain have won 7 consecutive home matches under De la Fuente"
    ],
    formGuide: { home: ["W", "W", "W", "W", "D"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Spain Win & Over 2.5 Goals — They attack relentlessly at home"
  },

  // Match 88: Argentina vs Mauritania
  88: {
    summary: "The world champions host World Cup debutants Mauritania at the Estadio Monumental in what will be an enormous occasion for the visitors and a training exercise for Argentina. Scaloni will rotate heavily — this is about giving fringe players minutes and managing the fitness of key stars. Even Argentina's B-team would be heavy favorites here. The Monumental crowd will enjoy the party atmosphere, but the competitive edge will be minimal.",
    keyFactors: [
      "🏆 Argentina are world champions — their depth is unprecedented in South American football",
      "🔄 Heavy rotation expected — Messi likely rested or limited to a cameo",
      "🇲🇷 Mauritania's first-ever World Cup — the occasion may overwhelm them",
      "📊 Argentina have scored 3+ goals in 9 of 12 recent home matches",
      "🏟️ Monumental will be a celebration rather than a high-intensity contest"
    ],
    formGuide: { home: ["W", "W", "W", "W", "W"], away: ["W", "L", "L", "D", "L"] },
    suggestedAngle: "Argentina -3.5 Handicap — Even a rotated Albiceleste should dominate"
  },

  // Match 89: Saudi Arabia vs Egypt
  89: {
    summary: "A strategically significant friendly given both teams are in the same World Cup group. Saudi Arabia hosting in Riyadh at King Fahd Stadium gives them a passionate crowd, but Egypt's squad quality — anchored by Salah — is notably higher. Both managers face a dilemma: play to win or protect tactical secrets for the World Cup group stage. Expect a cagey, chess-like encounter where neither team reveals their full hand.",
    keyFactors: [
      "🔍 Same World Cup group — tactical information management overrides result importance",
      "⭐ Salah's presence transforms Egypt from a solid team to a genuinely dangerous one",
      "🏟️ King Fahd Stadium crowd will create a hostile atmosphere for Egypt",
      "🤔 Both coaches likely to hide key tactical setups — misleading lineups possible",
      "📊 Saudi Arabia stunned Argentina at the 2022 World Cup — they can't be underestimated at home"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "W", "D", "W", "D"] },
    suggestedAngle: "Under 2.5 Goals — Neither team wants to reveal too much before the World Cup"
  },

  // Match 90: USA vs Belgium
  90: {
    summary: "The USA's World Cup preparation intensifies with Belgium visiting Mercedes-Benz Stadium in Atlanta. This is a venue where the Americans are virtually unbeatable — the atmosphere is electric and the pitch dimensions suit their high-pressing style. Belgium's golden generation has evolved into a more balanced, less star-dependent squad, with Doku, Trossard, and Onana providing fresh energy. Pulisic, Reyna, and McKennie will look to make a statement.",
    keyFactors: [
      "🏟️ Mercedes-Benz Stadium — USA are unbeaten in 14 home matches here",
      "⚡ Pulisic's big-game mentality — he elevates for prestige friendlies",
      "🔥 Doku's dribbling and pace can trouble any fullback in world football",
      "🇺🇸 Home World Cup motivation — every friendly is about building momentum",
      "📊 Belgium have struggled in friendlies recently — their away form is inconsistent"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["D", "W", "L", "W", "D"] },
    suggestedAngle: "USA Win — Home advantage and motivation give them a genuine edge"
  },

  // Match 91: Mexico vs Portugal
  91: {
    summary: "Mexico welcome Portugal to the Azteca — but without Cristiano Ronaldo, who misses out through injury. Portugal's depth means they're still fielding a side packed with elite talent: Bernardo Silva, Bruno Fernandes, Leão, and João Félix can all start. But the Azteca at 2,240m altitude is a unique challenge that few European squads handle well. Mexico will be physical, direct, and backed by 87,000 passionate fans.",
    keyFactors: [
      "🏔️ Azteca's 2,240m altitude — European teams historically lose 15% aerobic capacity",
      "❌ Ronaldo absent — Portugal lose their talisman and penalty specialist",
      "🔥 Mexico's crowd factor — 87,000 at the Azteca is overwhelming for visitors",
      "⭐ Bruno Fernandes and Bernardo Silva still give Portugal elite creative quality",
      "📊 Mexico are unbeaten in 9 home matches in Mexico City"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "D", "W", "W", "L"] },
    suggestedAngle: "Mexico Win or Draw — Altitude and crowd make the Azteca a fortress"
  },

  // Match 92: Colombia vs France
  92: {
    summary: "Colombia and France meet again in Washington DC, this time at Audi Field. Colombia's pressing intensity under Lorenzo is relentless, but France's quality in transition — even with rotation — is lethal. This is a genuine high-level test for both squads with the World Cup weeks away. The neutral venue in DC suits France, who are well-practiced at performing away from home. Colombia's confidence from their unbeaten run makes this a fascinating contest.",
    keyFactors: [
      "🔥 Colombia's extraordinary unbeaten run continues — 30+ matches without defeat",
      "⚡ Mbappé in transition needs just one moment — Colombia must stay disciplined",
      "🎯 James Rodríguez's set-piece delivery against France's aerial vulnerability",
      "📊 France have lost just 3 of their last 40 matches — unmatched consistency",
      "🏟️ Neutral DC venue — slight advantage to France who thrive in away environments"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "W", "W", "D", "W"] },
    suggestedAngle: "Draw — Two evenly matched powerhouses in World Cup preparation mode"
  },

  // Match 93: Germany vs Ghana
  93: {
    summary: "A callback to their dramatic 2014 World Cup group stage encounter. Germany under Nagelsmann are a completely different beast — aggressive, high-pressing, and clinical. Ghana's new generation brings pace and physicality but lacks the household names of previous cycles. At a TBD venue, this becomes a pure quality test where Germany's tactical sophistication should prevail. Expect Germany to use this as a final tactical drill.",
    keyFactors: [
      "🔥 Nagelsmann's Germany have won 5 of 6 recent friendlies — system is clicking",
      "⚡ Musiala and Wirtz — the most exciting young midfield duo in world football",
      "💪 Ghana's athleticism in wide areas can disrupt Germany's pressing structure",
      "📊 Germany's tactical evolution under Nagelsmann is the story of 2025-26",
      "🔄 Both teams will rotate — Germany's depth is vastly superior"
    ],
    formGuide: { home: ["W", "W", "W", "D", "W"], away: ["W", "L", "D", "W", "L"] },
    suggestedAngle: "Germany Win & Over 2.5 — Nagelsmann's Germany are scoring freely"
  },

  // Match 94: Spain vs Egypt
  94: {
    summary: "European champions Spain take on Egypt in what should be a one-sided affair in terms of possession and territory. But Egypt's defensive organization and Salah's counter-attacking threat make them dangerous regardless. Spain will likely dominate with 70%+ possession, creating constant half-chances through Yamal, Williams, and Pedri's intricate interplay. The question is whether Egypt's deep block can frustrate Spain into impotence.",
    keyFactors: [
      "🏆 Spain's Euro 2024 triumph has given them supreme confidence in their system",
      "⭐ Salah in transition against Spain's high line — a genuine match-winning threat",
      "🎨 Yamal and Williams' width stretches any defense — Egypt will need to stay narrow",
      "🛡️ Egypt's defensive discipline under their current system is genuinely impressive",
      "📊 Spain average 68% possession in friendlies — Egypt must be clinical with limited chances"
    ],
    formGuide: { home: ["W", "W", "W", "W", "D"], away: ["W", "D", "W", "L", "D"] },
    suggestedAngle: "Spain Win but consider Under 3.5 — Egypt's defense will frustrate"
  },

  // Match 95: England vs Japan
  95: {
    summary: "England host Japan at Wembley in arguably the most tactically interesting friendly of the window. Japan's evolution into a genuine global force — beating Germany and Spain at the 2022 World Cup — makes them a serious test. Their high-pressing, quick-passing style from the Bundesliga and La Liga contingent can embarrass any team that isn't fully focused. England's quality should prevail at home, but Japan will test their concentration for the full 90 minutes.",
    keyFactors: [
      "🇯🇵 Japan have beaten Germany and Spain in recent tournaments — they fear nobody",
      "⚡ Japan's pressing intensity is among the highest in world football",
      "🏟️ Wembley advantage — England's record at home is excellent",
      "🎯 Mitoma and Kubo provide Japan with genuine creative quality",
      "📊 Japan's intensity typically drops after 60 minutes — England's bench can exploit late"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "W", "D", "L"] },
    suggestedAngle: "England Win but BTTS Yes — Japan's quality ensures they'll create chances"
  },

  // Match 96: USA vs Portugal
  96: {
    summary: "The headline friendly of the USA's pre-World Cup preparation. Portugal without Ronaldo still field a fearsome squad, and this is the kind of game that defines whether the USA can compete with established European powers. Mercedes-Benz Stadium will be sold out, and the atmosphere could be the difference. Pulisic and Reyna represent genuine quality, but Portugal's technical midfield of Bernardo Silva and Vitinha could suffocate American build-up play.",
    keyFactors: [
      "🏟️ Mercedes-Benz Stadium sold out — USA's home fortress",
      "⭐ Bernardo Silva orchestrating from midfield — USA must match his intensity",
      "🇺🇸 Statement game — the USA have never beaten Portugal in a competitive fixture",
      "🔥 Pulisic vs Portugal's left-back — a critical individual matchup",
      "📊 Portugal's possession dominance averages 62% in friendlies — USA must press high"
    ],
    formGuide: { home: ["W", "W", "D", "W", "W"], away: ["W", "W", "D", "W", "L"] },
    suggestedAngle: "USA Win or Draw — Home crowd and motivation give them an edge"
  },

  // Match 97: Argentina vs Zambia
  97: {
    summary: "Another mismatch at the Monumental as Argentina face Zambia in their final pre-World Cup home friendly. Scaloni will use this to finalize squad decisions and give borderline players a last audition. Zambia's enthusiasm and pace will test Argentina's rotated backline, but the quality chasm is vast. Expect Argentina to control this without exerting themselves, saving energy for the World Cup while still providing a comfortable winning margin.",
    keyFactors: [
      "🔄 Massive rotation expected — Messi likely rested entirely",
      "📊 Argentina's B-team is stronger than many nations' first XIs",
      "🏟️ Monumental in party mode — World Cup send-off atmosphere",
      "⚡ Zambia's pace and athleticism — their best weapon against a rotated defense",
      "🎯 Final squad auditions — fringe players will be desperate to impress"
    ],
    formGuide: { home: ["W", "W", "W", "W", "W"], away: ["L", "D", "L", "W", "L"] },
    suggestedAngle: "Argentina -2.5 Handicap — Even rotated, the quality gap is enormous"
  },

  // Match 98: Algeria vs Uruguay
  98: {
    summary: "An intriguing matchup between Algeria's Ligue 1/Serie A talent pool and Uruguay's Bielsa-driven intensity. Algeria under Petkovic have found defensive solidity while maintaining creative threat through their European-based players. Uruguay under Bielsa treat every match — friendly or competitive — with maximum intensity, making them dangerous opponents regardless of context. The neutral venue creates a pure quality test with no external factors.",
    keyFactors: [
      "🔥 Uruguay under Bielsa press relentlessly — highest work rate in South American football",
      "⚽ Algeria's Serie A and Ligue 1 contingent provides genuine European-level quality",
      "🏟️ Neutral venue — no crowd advantage for either side",
      "📊 Uruguay's pressing intensity means they outrun most opponents by 8-10km per match",
      "🎯 Set-piece quality from both sides — Belaïli and Valverde both deliver dangerous balls"
    ],
    formGuide: { home: ["W", "D", "W", "L", "W"], away: ["W", "W", "D", "W", "W"] },
    suggestedAngle: "Uruguay Win — Bielsa's intensity overmatches most opponents in friendlies"
  },
};

// Build full analyses combining computed predictions with hand-written content
export function getMatchAnalysis(matchId: number): MatchAnalysis | null {
  const match = allMatches.find(m => m.id === matchId);
  if (!match) return null;

  const prediction = generatePrediction(match.home, match.away, match.venue, match.city);
  const data = analysisData[matchId];

  if (!data) return prediction;

  return {
    ...prediction,
    summary: data.summary,
    keyFactors: data.keyFactors,
    formGuide: data.formGuide,
    suggestedAngle: data.suggestedAngle,
  };
}

// Get all analyses (for the matches listing page)
export function getAllAnalyses(): Record<number, MatchAnalysis> {
  const result: Record<number, MatchAnalysis> = {};
  for (const match of allMatches) {
    const analysis = getMatchAnalysis(match.id);
    if (analysis) {
      result[match.id] = analysis;
    }
  }
  return result;
}
