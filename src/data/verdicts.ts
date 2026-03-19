import { allMatches, getAllMatchesWithOdds } from "./matches";
import { getMatchAnalysis } from "./analyses";
import { generateVerdict, type Verdict } from "@/lib/verdict-engine";

// Hand-written reasoning for each of the 72 matches
const verdictContent: Record<number, { reasoning: string; keyInsight: string; watchOut: string }> = {
  // ==================== GROUP A ====================
  1: {
    reasoning: "AI gives Mexico a 62% win probability, but the market only implies 55%. With the Azteca's 2,240m altitude advantage and Mexico's dominant opening-match record (won their last 4 WC openers), the market is underpricing the hosts. The crowd factor alone is worth 5 percentage points here.",
    keyInsight: "The altitude is the secret weapon — visiting teams lose 15% of their aerobic capacity at 2,240m",
    watchOut: "Opening match nerves could produce a slow start — consider a first-half draw as a hedge",
  },
  2: {
    reasoning: "South Korea's quality gap over the playoff qualifier is significant. Son Heung-min and Lee Kang-in give them two elite creative forces that no playoff side can match. AI sees a comfortable win, and the market agrees — but there's still slight value on a convincing Korean victory margin.",
    keyInsight: "Son Heung-min averages a goal every 68 minutes against non-European opposition in competitive games",
    watchOut: "Unknown opponents are tricky to model — the playoff qualifier could be defensively compact and frustrating early",
  },
  3: {
    reasoning: "A genuine toss-up between two sides fighting to avoid the group's bottom spot. The market has this almost perfectly priced — no real edge for either side. AI gives the playoff qualifier a marginal advantage from European tactical discipline, but not enough to justify a bet.",
    keyInsight: "When two evenly matched underdogs meet at a World Cup, the under hits 64% of the time",
    watchOut: "South Africa's counter-attacking pace through Percy Tau could catch a cautious opponent off guard",
  },
  4: {
    reasoning: "This is the Group A decider and the market knows it. Mexico's home advantage in Guadalajara gives them the edge, but Son Heung-min's ability to produce magic from nothing keeps Korea dangerous. AI has Mexico at 52%, market at 48% — the gap is small but the home factor tips it.",
    keyInsight: "Mexico are unbeaten in 9 home games in Guadalajara — the Akron is a fortress",
    watchOut: "South Korea's high press could force Mexico into turnovers if the hosts try to play too expansively",
  },
  5: {
    reasoning: "Mexico should have qualification wrapped up by now. A rotated squad makes the odds less attractive than they look. The playoff qualifier will be desperate, which creates danger. AI still favors Mexico but the value on the home side has evaporated with expected rotation.",
    keyInsight: "Rotated squads in final group games underperform their odds by 12% historically",
    watchOut: "El Tri's B-team is still quality, but complacency in already-qualified sides is a real risk factor",
  },
  6: {
    reasoning: "South Korea should close this group out professionally. Their technical superiority and fitness advantage over South Africa grows as the match progresses. AI gives Korea 58% vs market's 53% — enough of a gap to warrant a lean, especially with Son likely hunting goals for the Golden Boot.",
    keyInsight: "South Korea outrun most opponents by 8-10km per game — the second-half collapse from Africa sides is a pattern",
    watchOut: "If South Africa score first, their organized low block becomes very hard to break down under pressure",
  },

  // ==================== GROUP B ====================
  7: {
    reasoning: "Canada at home in Toronto with Alphonso Davies leading the charge — this is as close to a banker as you'll find in the group stage. The crowd factor at BMO Field is worth 3-4% probability, and the playoff qualifier simply can't match Canada's quality. AI and market both see a clear home win.",
    keyInsight: "Home nations in World Cup openers win 71% of the time — and Canada's quality makes that figure even higher",
    watchOut: "Over-eagerness from the Canadian crowd could create nervousness early — don't expect goals before the 20th minute",
  },
  8: {
    reasoning: "Switzerland are a tournament machine — they reach the knockouts of every major event. Qatar's 2022 disaster (0 points, 1 goal, 7 conceded) as hosts tells you everything about their level without home advantage. AI gives Switzerland 63%, market implies 58% — solid value on the Swiss.",
    keyInsight: "Qatar have lost 8 of their last 10 games against European opponents — the gap is structural, not just form",
    watchOut: "Xhaka's fitness is the single biggest variable — if he's not 100%, Switzerland's midfield control drops significantly",
  },
  9: {
    reasoning: "Switzerland should handle this comfortably. Their defensive record in qualifying was exceptional — just 3 goals conceded. The playoff qualifier faces a well-oiled machine that knows how to win tournament games. Fair value on a Swiss win, but the odds are priced accordingly.",
    keyInsight: "Switzerland have reached the knockouts in 4 of their last 5 major tournaments — consistency is their superpower",
    watchOut: "SoFi Stadium's size can swallow atmosphere — don't expect the Swiss to benefit from any crowd energy",
  },
  10: {
    reasoning: "Canada should dominate Qatar at BC Place. The home support in Vancouver, combined with Davies and David's attacking threat, makes this a mismatch. Qatar's defensive fragility away from home is well-documented. AI has Canada at 65% — the market is catching up but there's still a sliver of value.",
    keyInsight: "Jonathan David's goals-per-game ratio in competitive internationals is better than most top-tier strikers",
    watchOut: "Qatar occasionally produce a spirited first-half performance before fading — patience may be needed",
  },
  11: {
    reasoning: "The group decider where a draw might suit both sides. Switzerland's tournament nous makes them masters of getting the result they need. Canada's home energy could push them forward, but that might play into Swiss hands on the counter. The draw is underpriced at these odds.",
    keyInsight: "In must-not-lose group deciders between qualified teams, the draw hits 38% of the time — the market rarely prices this correctly",
    watchOut: "If Switzerland score first, they'll park the bus better than almost anyone — Canada would need to throw caution to the wind",
  },
  12: {
    reasoning: "A dead rubber where both sides are likely eliminated. These games tend to be more open and entertaining than expected. Qatar desperately want to avoid a second consecutive pointless World Cup. There's no real betting value here — the market has it about right. Skip this one.",
    keyInsight: "Dead-rubber World Cup games average 2.8 goals — both sides abandon their defensive approach when there's nothing to lose",
    watchOut: "Don't overthink a dead rubber — emotional factors outweigh tactical ones when pride is the only motivation",
  },

  // ==================== GROUP C ====================
  13: {
    reasoning: "This looks like a trap. Fans are piling on Brazil (58%), but AI only gives them 51% — barely a coin flip. Morocco's 2022 semifinal defense is largely intact, and they've only gotten better since. The value is actually on Morocco or the Draw here. Skip the Brazil hype.",
    keyInsight: "Morocco conceded just 1 goal in 5 knockout games at the 2022 World Cup — their defense is elite-tier",
    watchOut: "Brazil's new generation (Vinícius, Endrick) brings pace that Morocco haven't faced before — the 2022 template may not work perfectly",
  },
  14: {
    reasoning: "Scotland should handle Haiti, but the odds are short and the value is thin. McTominay's all-round game drives Scotland forward, and Haiti's quality gap is significant. AI says 65% Scotland, market implies 62% — a tiny edge that doesn't justify a full stake.",
    keyInsight: "Haiti are making history just by being here — expect emotional energy early that fades after 60 minutes",
    watchOut: "Scotland's opening games at major tournaments have been shaky historically — they tend to start nervous before settling",
  },
  15: {
    reasoning: "Morocco are the real deal, and Scotland don't have the tools to break down Regragui's defensive system. AI gives Morocco 55% vs market's 50% — there's genuine value on the Atlas Lions here. Scotland's physical approach won't work against Morocco's experienced, battle-tested backline.",
    keyInsight: "Morocco have faced and beaten better pressing teams than Scotland — Hakimi's counter-attacks will be lethal",
    watchOut: "Set pieces are Scotland's best weapon — McTominay's aerial presence could produce something from a corner or free kick",
  },
  16: {
    reasoning: "Brazil vs Haiti is the biggest power mismatch in the group. The Seleção's B-team could win this 4-0. No real betting value — the odds reflect the obvious. If you must play, look at Brazil's handicap line rather than the outright win.",
    keyInsight: "When Brazil face CONCACAF minnows, they average 3.2 goals — Endrick could use this as his World Cup coming-out party",
    watchOut: "Rotation means this won't be Brazil's strongest XI — don't expect the intensity of a knockout game",
  },
  17: {
    reasoning: "Brazil should beat Scotland, but the Tartan Army won't go quietly. Scotland's defensive discipline under Clarke has been impressive, and they'll sit deep and absorb pressure. AI gives Brazil 62%, market implies 58% — there's value on Brazil, but the margin of victory will be tight.",
    keyInsight: "Scotland perform better as underdogs — their siege mentality is perfectly suited to containing Brazil's individual brilliance",
    watchOut: "If Scotland grab an early goal from a set piece, the match dynamics flip entirely — Brazil become anxious chasers",
  },
  18: {
    reasoning: "Morocco should cruise past Haiti in Atlanta. The Atlas Lions' tactical sophistication is a level above what Haiti can deal with. AI has Morocco at 70% — the market agrees. No real edge here unless you look at Morocco winning to nil, which their defensive record supports.",
    keyInsight: "Morocco haven't conceded in their last 4 competitive games against teams ranked outside the top 40",
    watchOut: "Haiti have nothing to lose and will play with incredible freedom — expect at least one dangerous moment",
  },

  // ==================== GROUP D ====================
  19: {
    reasoning: "The USA at home in SoFi Stadium with 70,000 screaming fans — this is as strong an edge as any team gets in the tournament. Pulisic, McKennie, and Reyna are peaking at the right time. AI gives USA 61%, market implies 55% — the home advantage is being underpriced. BET with confidence.",
    keyInsight: "Host nation openers have a 71% win rate in World Cup history — and the USA's squad is the best they've ever had",
    watchOut: "Paraguay's compact defensive structure can frustrate — the USA need to score early or the crowd's nerves will become a factor",
  },
  20: {
    reasoning: "Australia's Socceroos have deep tournament experience from 2022, and the playoff qualifier is an unknown quantity. AI gives Australia a comfortable edge, but the odds are already priced in. A lean toward Australia is justified but don't overstake a match against an unconfirmed opponent.",
    keyInsight: "Australia have been underdogs at every recent World Cup and thrived — they know how to grind out tournament results",
    watchOut: "Unknown opponents can be dangerous precisely because there's no scouting data — Australia must be adaptable",
  },
  21: {
    reasoning: "USA should build on their opening match momentum in Seattle. Australia are well-organized but lack the individual quality to hurt this American midfield. AI has USA at 58%, market at 54% — the home advantage keeps providing value. Another professional home win expected.",
    keyInsight: "Reyna's dribbling and creativity in tight spaces gives the USA a dimension that Australia can't match",
    watchOut: "Australia's counter-attacking is more effective than their possession game — if USA push too high, the Socceroos will punish on the break",
  },
  22: {
    reasoning: "Paraguay's South American grit gives them the edge over a playoff qualifier in what could be a scrappy, attritional affair. The market slightly favors Paraguay, and AI agrees. But neither side offers compelling value — this is a classic skip for bettors looking for clear edges.",
    keyInsight: "South American sides win 65% of their World Cup games against playoff qualifiers — continental experience matters",
    watchOut: "If both teams have already lost their openers, desperation creates chaos — expect cards, fouls, and unpredictable momentum swings",
  },
  23: {
    reasoning: "By matchday 3, the USA should have qualification wrapped up. Even with rotation, the quality gap against a playoff qualifier at SoFi Stadium is too wide. No real betting value — the odds are very short. If you want action, look at USA winning to nil.",
    keyInsight: "The USA's squad depth means their B-team still features players from Europe's top 5 leagues",
    watchOut: "Complacency is real — qualified teams who rotate in game 3 underperform their expected probability by 8-12%",
  },
  24: {
    reasoning: "A genuine coin flip between Paraguay and Australia for the second qualifying spot. Both are gritty, competitive teams who rarely give up. AI has this at essentially 50/50, and the market agrees. No clear edge — the under 2.5 goals line is the smarter play here.",
    keyInsight: "When two mid-tier teams fight for survival on the final matchday, defensive caution dominates — under 2.5 hits 62% of the time",
    watchOut: "If one team needs a win and the other needs only a draw, the tactical dynamics shift dramatically — watch the group standings",
  },

  // ==================== GROUP E ====================
  25: {
    reasoning: "Germany vs Curacao is the most lopsided match in the group. Musiala and Wirtz will tear through Curacao's defense with ease. But the odds reflect this — Germany are priced at 1.08-1.12, offering virtually no value on the outright. The handicap line is where the value lives.",
    keyInsight: "The Musiala-Wirtz partnership has produced 8 goal contributions in their last 4 games together — Curacao have never faced anything like it",
    watchOut: "Germany can be slow starters in openers — if Curacao survive the first 20 minutes, the crowd might get nervous",
  },
  26: {
    reasoning: "The AFCON champions vs Ecuador is a genuine 50/50. AI gives Ivory Coast a 2% edge from their recent continental triumph, but the market has it dead even. No compelling value on either side. Both Teams to Score is the angle — two attacking teams who won't sit back.",
    keyInsight: "AFCON winners carry a confidence boost that's worth 3-5% in their next major tournament — psychological momentum is real",
    watchOut: "Caicedo's midfield dominance could nullify Kessié — if Ecuador control the middle, Ivory Coast's flair gets suffocated",
  },
  27: {
    reasoning: "Germany should beat Ivory Coast, but the AFCON champions won't make it easy. AI gives Germany 58%, market implies 55% — a small edge that reflects the quality gap without ignoring Ivory Coast's genuine talent. A lean toward Germany in what should be an entertaining tactical battle.",
    keyInsight: "Germany have never lost to an African side at a World Cup — W8 D1 L0 is a record that suggests structural superiority",
    watchOut: "Adingra's counter-attacking pace is Germany's kryptonite — if they push their fullbacks too high, he'll punish them",
  },
  28: {
    reasoning: "Ecuador should handle Curacao comfortably, but the odds are already priced in. Caicedo will dominate midfield and Valencia's experience will be too much. The handicap line offers better value than the outright — Ecuador should win by 2+ goals.",
    keyInsight: "Ecuador's pressing intensity is among the highest in South American football — Curacao's limited technical ability will crumble under the pressure",
    watchOut: "Curacao play with incredible pride and freedom — don't expect them to roll over without at least one dangerous moment",
  },
  29: {
    reasoning: "Ecuador vs Germany is the Group E decider. Ecuador's high press can cause problems, but Germany's ability to play through pressure with Musiala and Wirtz is elite. AI gives Germany 56%, market implies 54% — razor-thin value. A lean toward Germany but the game could genuinely go either way.",
    keyInsight: "When Ecuador's press works, they're devastating — but when it gets bypassed, the space behind is enormous",
    watchOut: "Altitude-hardened Ecuador have superior fitness levels — if this goes to a second-half war of attrition, they have the edge",
  },
  30: {
    reasoning: "Ivory Coast should dismantle Curacao. The AFCON champions have quality in every position, and Curacao's historic tournament run ends with a heavy defeat. Like all mismatches, the outright odds offer no value. Ivory Coast handicap is the play.",
    keyInsight: "Ivory Coast's bench alone would be the strongest XI in Curacao's qualifying group — depth decides these games",
    watchOut: "Curacao's farewell match energy could produce an early scare — Ivory Coast might need 15-20 minutes to settle",
  },

  // ==================== GROUP F ====================
  31: {
    reasoning: "Japan shocked everyone by beating Germany AND Spain in 2022's group stage. The market remembers this — Netherlands are only slight favorites. AI has them at 50% vs Japan's 34%, but the market is closer to 45/30. Japan's pressing could turn this into a classic — lean Netherlands but respect the Blue Samurai.",
    keyInsight: "Japan's 2022 victories weren't flukes — their pressing system is now the most sophisticated in Asian football",
    watchOut: "Mitoma's dribbling has terrorized Premier League defenses — if Van Dijk is even slightly off his game, Japan will exploit it",
  },
  32: {
    reasoning: "Tunisia's defensive organization makes them dangerous underdogs against any playoff qualifier. The Eagles of Carthage won't concede easily, and their experience at World Cups gives them a tactical edge. Market has this tight — and AI agrees. The under is the smarter play here.",
    keyInsight: "Tunisia have drawn 5 of their last 8 World Cup group games — they specialize in making life miserable for opponents",
    watchOut: "A European playoff winner could be a strong side (Wales/Ukraine level) — Tunisia shouldn't be complacent",
  },
  33: {
    reasoning: "Netherlands should control this match with their possession-based system. The quality gap between the Oranje and a playoff qualifier is substantial. AI and market align around a comfortable Dutch win — but the odds are too short for value. Clean sheet angle is better.",
    keyInsight: "Van Dijk and the Dutch defense have the tournament's best aerial duel win rate — set pieces won't trouble them",
    watchOut: "The Dutch can be slow in dead-rubber-feeling games — if the playoff side is compact, this could be tighter than expected",
  },
  34: {
    reasoning: "Japan's relentless pressing vs Tunisia's organized defense — something has to give. AI gives Japan 52% vs market's 47%. That's a meaningful gap driven by Japan's superior individual quality through Kubo and Mitoma. The first goal changes everything — but Japan should have enough.",
    keyInsight: "Japan's pressing wins the ball back in the opposition half more often than any other Asian team — Tunisia's build-up will be under siege",
    watchOut: "Tunisia are experts at slowing games down — if they kill the tempo and take Japan out of their rhythm, the upset is on",
  },
  35: {
    reasoning: "Japan should seal their place in the knockouts with a comfortable win. Their squad depth means even rotation produces a dangerous XI. The playoff qualifier will struggle to live with Japan's intensity for 90 minutes. Solid lean toward Japan but odds are priced fairly.",
    keyInsight: "Japan's rotation options (Doan, Kamada, Mitoma) would all start for their opponents — the depth gap is huge",
    watchOut: "Japan sometimes take their foot off the gas when qualification is secure — don't expect a cricket score",
  },
  36: {
    reasoning: "Never underestimate Tunisia at a World Cup — they beat France in 2022! But the Netherlands are a level above, and this Dutch squad's depth means even rotation keeps them dangerous. AI gives Netherlands 58%, market 54% — enough of a gap for a lean, but Tunisia's upset potential caps the confidence.",
    keyInsight: "Tunisia's 2022 win over France proves they can raise their level against European elite — but doing it twice is much harder",
    watchOut: "If Tunisia are already eliminated, they might play with total freedom — and that's when they're most dangerous",
  },

  // ==================== GROUP G ====================
  37: {
    reasoning: "Iran are solid tournament competitors and should handle New Zealand. Taremi's positioning and Azmoun's pace give them a reliable attacking duo. The market has Iran as clear favorites, and AI agrees. Slim value on Iran if you can find odds above the market average.",
    keyInsight: "Iran's counter-attacking efficiency against physically stronger sides is underrated — they average 1.8 goals from fewer than 3 big chances per game",
    watchOut: "New Zealand's physicality in aerial duels could produce a scrappy first half — Iran need to stay patient",
  },
  38: {
    reasoning: "Belgium's golden generation is aging, and Egypt's Salah ensures they always carry threat. AI gives Belgium 54% vs market's 52% — barely any edge. Salah's presence alone makes Egypt dangerous enough to warrant caution. This is a genuine contest, not a Belgium walkover. SKIP unless you find value on Egypt.",
    keyInsight: "Salah vs De Bruyne is a Premier League showdown of generational talents — the individual who performs better decides the game",
    watchOut: "De Bruyne's fitness has been inconsistent — if he's at 80%, Belgium's creative output drops dramatically",
  },
  39: {
    reasoning: "Belgium should grind past Iran, but it won't be pretty. Iran's low block is designed to frustrate exactly this type of opponent — technically superior but lacking the patience to break it down. AI has Belgium at 57%, market at 54%. Lean Belgium but expect a tight, tactical game.",
    keyInsight: "Iran concede the fewest open-play goals per game in Asian football — Belgium will need to create from set pieces and individual brilliance",
    watchOut: "Taremi's counter-attacking instinct is lethal — one Belgium overcommitment forward could result in an Iranian goal",
  },
  40: {
    reasoning: "Egypt should dominate New Zealand. Salah's individual brilliance alone is enough to win this game — add in Egypt's improved tactical structure and it's a mismatch. Market agrees with AI. The handicap line offers better value than the outright.",
    keyInsight: "Salah averages a goal involvement every 72 minutes against non-European opposition — New Zealand's defense will be overloaded",
    watchOut: "New Zealand's aerial threat from set pieces is their only real weapon — Egypt must be disciplined at dead balls",
  },
  41: {
    reasoning: "Two defensive masters go head-to-head. Egypt have Salah as the X-factor, but Iran's system is built specifically to neutralize star players. AI barely separates them at 44% Egypt, 28% draw, 28% Iran. The under is the play here — both teams would happily take 1-0.",
    keyInsight: "When two defensively-minded teams with similar quality meet, the draw is significantly underpriced — 28% implied probability deserves attention",
    watchOut: "If Egypt need a win for qualification, they'll push forward — creating exactly the counter-attacking spaces Iran thrive in",
  },
  42: {
    reasoning: "Belgium should close out the group with a win over New Zealand, but their aging squad and potential rotation makes this less convincing than the talent gap suggests. Market prices are fair. No compelling reason to bet — Belgium's best motivation might be knockout-stage seeding.",
    keyInsight: "Belgian teams coast in games they're expected to win comfortably — effort levels in confirmed 3rd-place games drop measurably",
    watchOut: "New Zealand's All Whites will fight for every ball — expect a physical, sometimes ugly contest that Belgium want to get through unscathed",
  },

  // ==================== GROUP H ====================
  43: {
    reasoning: "Spain's tiki-taka machine should overwhelm Cape Verde. Pedri, Gavi, and Yamal represent the most technically gifted young core in world football. Cape Verde's qualification is heroic but the quality chasm is immense. No value on the outright — Spain handicap is the play.",
    keyInsight: "Lamine Yamal could become the youngest World Cup goalscorer in history — his 1v1 ability against Cape Verde's full-backs will be uncontainable",
    watchOut: "Spain sometimes over-elaborate against weaker sides — if they don't score by the 30th minute, frustration can set in",
  },
  44: {
    reasoning: "Uruguay's defensive DNA and Darwin Núñez's pressing make them clear favorites over Saudi Arabia. But memories of Saudi Arabia's 2022 victory over Argentina mean the market prices a slight upset possibility. AI gives Uruguay 60%, market 56% — there's value on La Celeste's grit.",
    keyInsight: "Uruguay are the most underpriced team at this World Cup — their defensive record and tournament pedigree is consistently ignored by casual bettors",
    watchOut: "Saudi Arabia's 2022 Argentina upset wasn't a total fluke — their counter-attacking speed is genuine, and they can catch anyone on a bad day",
  },
  45: {
    reasoning: "Spain should handle Saudi Arabia with ease. La Roja's positional play is the most sophisticated system for breaking down low blocks, which is exactly what Saudi Arabia will deploy. AI has Spain at 72%, market at 68% — fair pricing with minimal edge. Lean Spain clean sheet.",
    keyInsight: "Spain's pass completion in the final third is 12% higher than the tournament average — their patience and precision will eventually find the gap",
    watchOut: "Saudi Arabia's 2022 ghosts will haunt — but Spain's coaching staff will have drilled the threat out of existence",
  },
  46: {
    reasoning: "Uruguay should comfortably beat Cape Verde in Miami. Núñez and Valverde will run the show, and Cape Verde's limited squad depth won't survive La Celeste's intensity. Market prices this correctly — no real value on the outright. Uruguay handicap is the angle.",
    keyInsight: "Valverde covers more ground than any other player at this World Cup — his box-to-box energy creates overloads everywhere",
    watchOut: "Cape Verde play with heart and freedom — they could snatch a goal that makes the scoreline look closer than the game was",
  },
  47: {
    reasoning: "Saudi Arabia should edge Cape Verde in a battle of the group's underdogs. Their greater World Cup experience and squad resources give them the advantage. AI has Saudi Arabia at 48% vs Cape Verde's 22% — the value is on Saudi Arabia to win this fairly comfortably.",
    keyInsight: "Saudi Arabia's squad is built from their domestic league's massive investment — they're better funded than most outsiders realize",
    watchOut: "Cape Verde have nothing to lose in their farewell match — emotional energy can level the playing field for 45 minutes",
  },
  48: {
    reasoning: "The Group H showpiece. Spain's technical brilliance vs Uruguay's famous Garra Charrúa. Both teams play to their strengths, making this a fascinating tactical battle. AI gives Spain 52%, market 50% — essentially a coin flip with no real edge. The under is the play — both defenses are elite.",
    keyInsight: "When Spain face a South American team that mirrors their defensive intensity, the game becomes a chess match — expect under 2 goals",
    watchOut: "Uruguay's dark arts (time-wasting, tactical fouling) can disrupt Spain's rhythm — referee management becomes a key factor",
  },

  // ==================== GROUP I ====================
  49: {
    reasoning: "France's squad depth is almost unfair. Mbappé, Dembélé, Griezmann, Thuram — any combination is devastating. Senegal are Africa's best side but France at a World Cup are a different beast entirely. AI gives France 63%, market 59% — consistent slight underpricing of Les Bleus.",
    keyInsight: "France have won their opening World Cup match in 6 of their last 7 tournaments — they know how to start strong",
    watchOut: "Senegal's midfield physicality is genuine — if they win the battle in the middle, France's attackers get starved of service",
  },
  50: {
    reasoning: "Norway with Haaland is a different team entirely. The man averages a goal every 68 minutes in competitive football — the playoff qualifier faces an impossible task. AI and market agree this is Norway's game. The question is the margin, not the winner. Haaland to score is the play.",
    keyInsight: "Haaland's gravitational pull creates space for Ødegaard — even when he doesn't score, he makes everyone around him better",
    watchOut: "The playoff qualifier's identity matters — a well-organized Asian side could frustrate Norway's direct approach more than expected",
  },
  51: {
    reasoning: "France should cruise through this one. Even a rotated Les Bleus side features world-class talent in every position. The playoff qualifier faces a wall of quality they've never encountered. No betting value on the outright — France handicap is the angle if you want action.",
    keyInsight: "France's B-team would comfortably qualify for most World Cups — their depth is the deepest in tournament history",
    watchOut: "Deschamps might use this as a tactical lab for knockout rounds — expect experimentation rather than maximum intensity",
  },
  52: {
    reasoning: "Haaland vs Senegal's elite defenders is the marquee matchup of this group. Senegal's tactical intelligence could neutralize Norway's biggest weapon, making this genuinely hard to call. AI has Norway at 46%, Senegal at 30% — but the draw at 24% is intriguing. Both Teams to Score looks strong.",
    keyInsight: "Senegal's center-backs have the physical profile to match Haaland — this could be his toughest test in the group stage",
    watchOut: "Mané and Sarr's counter-attacking speed will exploit Norway's high defensive line — expect end-to-end transitions",
  },
  53: {
    reasoning: "France are favorites but Norway with Haaland are always dangerous. The Erling effect means Norway always have a puncher's chance. AI gives France 58%, market 55% — Les Bleus' tournament DNA provides the edge but it's not a clear-cut BET. Lean France in a tight game.",
    keyInsight: "France absorb pressure better than anyone — Mbappé on the counter against Norway's high line is terrifying",
    watchOut: "Haaland vs Upamecano is a 50/50 physical battle — if Haaland wins it, Norway can genuinely cause a shock",
  },
  54: {
    reasoning: "Senegal should seal their knockout qualification against the playoff side. The Lions of Teranga's blend of AFCON-winning mentality and European club experience makes them too strong. AI and market agree — Senegal win. Fair price, no significant value edge either way.",
    keyInsight: "AFCON winners historically perform well at the following World Cup — the confidence boost is worth 3-5% in probability",
    watchOut: "If Senegal are already through, Aliou Cissé might rest key players — weakening the value proposition significantly",
  },

  // ==================== GROUP J ====================
  55: {
    reasoning: "The reigning World Champions open their defense. Argentina's aura alone is worth 5% in opening-game probability. The squad is deeper than 2022 with Enzo Fernández and Mac Allister now in their prime. Algeria will compete but can't live with this quality. AI has Argentina at 68%, market 64% — slight value on the champions.",
    keyInsight: "Argentina have won their last 8 consecutive competitive matches — the momentum from 2022 continues to build",
    watchOut: "Algeria's AFCON experience means they won't freeze — expect a competitive first half before Argentina's class tells",
  },
  56: {
    reasoning: "Rangnick's Austria are one of Europe's most improved teams. Their relentless pressing system dismantles mid-tier opposition, and Jordan — despite their 2024 Asian Cup run — lack the technical quality to play through it. AI gives Austria 62%, market 58% — decent value on the Austrians.",
    keyInsight: "Rangnick's pressing system recovers the ball higher up the pitch than any other European team — Jordan will be pinned back constantly",
    watchOut: "Jordan's Asian Cup final run showed they can defend for their lives — if they weather the early storm, they could nick something",
  },
  57: {
    reasoning: "Argentina vs Austria is the Group J decider in all but name. Rangnick's pressing will test Argentina's build-up, but the Albiceleste have faced and beaten better pressing teams in their 2022 run. AI gives Argentina 64%, market 60% — the quality gap in the final third is the difference.",
    keyInsight: "Argentina's ability to control games at 1-0 is unmatched — they win the game, then shut it down with elite game management",
    watchOut: "Laimer and Sabitzer's energy could disrupt Argentina's midfield rhythm in the first 30 minutes — the early phase is key",
  },
  58: {
    reasoning: "Jordan vs Algeria is a genuine contest between two proud nations with something to prove. Algeria's Ligue 1 contingent gives them a slight technical edge, but Jordan's organized approach levels the playing field. AI has Algeria marginally ahead — but neither side offers clear betting value.",
    keyInsight: "Both teams are fighting for the right to say they competed at the World Cup — pride-driven matches are notoriously unpredictable",
    watchOut: "If both teams have lost to Argentina, this becomes a must-win for both — desperation creates cards, fouls, and chaos",
  },
  59: {
    reasoning: "The race for second place in Group J comes down to this. Austria's Rangnick revolution gives them a systematic advantage that Algeria's talented but less structured squad will struggle to match. AI has Austria at 52%, market at 48% — a meaningful gap driven by tactical superiority.",
    keyInsight: "Rangnick's system performs best in high-pressure games where both teams commit forward — exactly the dynamic of a must-win match",
    watchOut: "Algeria's counter-attacking pace through their Ligue 1 wingers could punish Austria's aggressive pressing if they overcommit",
  },
  60: {
    reasoning: "Argentina should wrap up Group J comfortably. Even a rotated squad featuring Dybala, Nico González, and Paredes is too strong for Jordan. No betting value on the outright — it's priced at 1.15 or below. Argentina winning to nil is the only angle worth considering.",
    keyInsight: "Argentina's squad depth means their rotation XI would still be among the top 15 teams at this tournament",
    watchOut: "Jordan will play for pride and their growing reputation in Asian football — expect them to compete more than the odds suggest",
  },

  // ==================== GROUP K ====================
  61: {
    reasoning: "Portugal's attacking depth is extraordinary — Bruno, Bernardo, Leão, and Jota provide world-class quality in every forward position. The playoff qualifier faces an impossible task. No value on the outright — Portugal handicap is the only sensible angle here.",
    keyInsight: "Bruno Fernandes creates more chances per 90 minutes than any other player at this World Cup — the supply line to Portugal's forwards is relentless",
    watchOut: "Portugal sometimes struggle to put away weaker teams efficiently — their creative dominance doesn't always translate to early goals",
  },
  62: {
    reasoning: "Colombia's South American flair should overwhelm Uzbekistan at the Azteca. James Rodríguez's renaissance and Luis Díaz's explosive running give Los Cafeteros two elite creative outlets. AI gives Colombia 61%, market 57% — solid value driven by Uzbekistan's inexperience at this level.",
    keyInsight: "Uzbekistan are making their World Cup debut — the occasion alone can inhibit performance by 5-8% in opening games",
    watchOut: "The Azteca's altitude and atmosphere could actually help the underdog if Colombia start sluggishly — high-altitude games produce unexpected results",
  },
  63: {
    reasoning: "Portugal should strengthen their grip on Group K against Uzbekistan. The quality gap is immense and Uzbekistan's organized approach will only delay the inevitable. Market prices reflect the obvious. No real value anywhere — if you want action, Portugal's second-half goals is an angle.",
    keyInsight: "Uzbekistan's organized defense will hold for 35-40 minutes — then Leão's acceleration against tiring legs will blow it open",
    watchOut: "If Portugal have already qualified, tactical experimentation could make this closer than it should be",
  },
  64: {
    reasoning: "Colombia should qualify with a comfortable win. Their attacking talent creates chances relentlessly, and the playoff qualifier lacks the quality to compete for 90 minutes. James' distribution to Díaz and Arias on the flanks is unstoppable at this level. Fair pricing — lean Colombia but no strong edge.",
    keyInsight: "Colombia have won 80% of their games when James Rodríguez starts — his influence on the team's performance is statistically extraordinary",
    watchOut: "If Colombia are already through, the motivation level drops — and so does the value of backing them at short odds",
  },
  65: {
    reasoning: "The Group K blockbuster — two of world football's most attacking teams meet in Miami. Díaz vs Cancelo, Bruno vs James — individual battles everywhere. Both teams want to attack, making this a potential classic. AI has Portugal at 51% vs market's 49% — dead even. Over 2.5 goals is the play, not the result.",
    keyInsight: "When two attacking philosophies collide, defensive structures break down — this has 3+ goals written all over it",
    watchOut: "The team that wins the midfield battle (Bruno's positioning vs James' creativity) controls the game — this could swing in 5 minutes",
  },
  66: {
    reasoning: "Two underdogs meet in a game that celebrates football's global growth. Uzbekistan's superior qualifying path gives them a slight edge, but neither team offers compelling value. The over/under is more interesting than the result — expect an open, honest game.",
    keyInsight: "Dead-rubber matches between debutants historically produce 2.8+ goals — both teams abandon caution for legacy",
    watchOut: "Emotional factors dominate in dead rubbers — form and tactics matter less than who wants it more on the day",
  },

  // ==================== GROUP L ====================
  67: {
    reasoning: "The market has this right. England at 1.95 implies 51%, AI says 54% — tiny gap, no real value. Croatia are always dangerous in World Cups (2 finals in 3 tournaments). Bellingham's emergence gives England the edge, but Modrić's magic in potential farewell adds unpredictability. LEAN toward England but don't overstake.",
    keyInsight: "Bellingham's Ballon d'Or-level form makes him the single most decisive player in this tournament — Croatia must contain him",
    watchOut: "Modrić in potential farewell World Cup mode is a romantic but real threat — never underestimate a legend's final act",
  },
  68: {
    reasoning: "Ghana's pace and power through Kudus and Williams should overwhelm Panama's limited resources. The quality gap in the final third is significant. AI gives Ghana 58%, market 54% — enough of a gap for a lean. Ghana's African pace will be too much for Panama's aging backline.",
    keyInsight: "Kudus Mohammed's emergence as a top-tier talent adds a dimension to Ghana that makes them Group L's clear second-best team",
    watchOut: "Panama never give up — their fighting spirit and physical approach could keep this closer than the quality gap suggests",
  },
  69: {
    reasoning: "England should handle Ghana professionally in Boston. The Three Lions' squad depth and tactical flexibility make them heavy favorites. Kane, Bellingham, and Saka is an attacking trio that Ghana's defense simply cannot contain for 90 minutes. Fair pricing — England clean sheet is the value angle.",
    keyInsight: "England's defensive record at recent tournaments — 3 goals conceded in their last 12 group games — is the foundation of their success",
    watchOut: "Kudus' unpredictability could create one moment of chaos — England need to manage his influence carefully",
  },
  70: {
    reasoning: "Croatia's midfield mastery will be decisive against Panama. Modrić's passing range and Kovačić's ball-carrying ability will overwhelm Panama's limited pressing structure. The market prices Croatia correctly as strong favorites. A lean toward Croatia but the odds don't offer significant value.",
    keyInsight: "Modrić in a World Cup is a different player — he's produced his best performances on the biggest stage for 12 years",
    watchOut: "Panama's physical approach could produce yellow cards and disruption — if Croatia get frustrated, the game opens up",
  },
  71: {
    reasoning: "England should have Group L wrapped up. Even with rotation, the quality gap against Panama at MetLife is enormous. No real betting value — England's odds are too short. If you want action, look at England winning by 3+ goals as a handicap play.",
    keyInsight: "England's rotation XI still features Kane, who treats every game as a Golden Boot opportunity — expect him to start and score",
    watchOut: "Panama will fight for 90 minutes regardless of the scoreline — expect it to be competitive in patches even if the result is never in doubt",
  },
  72: {
    reasoning: "The Group L runner-up spot is likely decided here. Croatia's World Cup DNA — two finals in three tournaments — gives them a psychological edge in pressure situations. Ghana's pace can trouble Croatia's aging backline, but Modrić's game management in high-stakes matches is unmatched. Lean Croatia.",
    keyInsight: "Croatia have made the semi-finals or better at 3 of the last 4 World Cups — no team manages knockout-context group games better",
    watchOut: "Ghana's aerial threat from set pieces is their best weapon against Croatia's compact but smaller defensive unit",
  },
};

// Pre-compute all verdicts
function buildAllVerdicts(): Record<number, Verdict> {
  const matchesWithOdds = getAllMatchesWithOdds();
  const result: Record<number, Verdict> = {};

  for (const mwo of matchesWithOdds) {
    const analysis = getMatchAnalysis(mwo.id);
    if (!analysis) continue;

    const match = allMatches.find(m => m.id === mwo.id);
    if (!match) continue;

    const verdict = generateVerdict(
      mwo.id,
      analysis,
      mwo.bookmakers,
      match.home,
      match.away
    );

    // Overlay hand-written content
    const content = verdictContent[mwo.id];
    if (content) {
      verdict.reasoning = content.reasoning;
      verdict.keyInsight = content.keyInsight;
      verdict.watchOut = content.watchOut;
    }

    result[mwo.id] = verdict;
  }

  return result;
}

export const allVerdicts: Record<number, Verdict> = buildAllVerdicts();

export function getVerdict(matchId: number): Verdict | null {
  return allVerdicts[matchId] || null;
}

export function getAllVerdicts(): Verdict[] {
  return Object.values(allVerdicts);
}

export function getVerdictsByRecommendation(rec: "BET" | "LEAN" | "SKIP" | "AVOID"): Verdict[] {
  return getAllVerdicts().filter(v => v.recommendation === rec);
}

export function getVerdictsByGroup(group: string): Verdict[] {
  const groupMatchIds = allMatches.filter(m => m.group === group).map(m => m.id);
  return getAllVerdicts().filter(v => groupMatchIds.includes(v.matchId));
}
