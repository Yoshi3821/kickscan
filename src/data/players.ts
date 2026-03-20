export interface Player {
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  country: string;
  flag: string;
  position: string;
  club: string;
  age: number;
  number: number;
  tier: 1 | 2;
  group: string;
  wcGoals: number;
  wcApps: number;
  wcTitles: number;
  tagline: string;
  storyline: string;
  keyStats: string[];
  tags: string[];
  goldenBootOdds: string;
  matchIds: number[];
  image?: string;
}

export const playerImages: Record<string, string> = {
  "messi": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg",
  "ronaldo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Cristiano_Ronaldo_0876.jpg/500px-Cristiano_Ronaldo_0876.jpg",
  "mbappe": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Picture_with_Mbapp%C3%A9_%28cropped_and_rotated%29.jpg/500px-Picture_with_Mbapp%C3%A9_%28cropped_and_rotated%29.jpg",
  "haaland": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Erling_Haaland_June_2025.jpg/500px-Erling_Haaland_June_2025.jpg",
  "vinicius-jr": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/2023_05_06_Final_de_la_Copa_del_Rey_-_52879242230_%28cropped%29.jpg/500px-2023_05_06_Final_de_la_Copa_del_Rey_-_52879242230_%28cropped%29.jpg",
  "bellingham": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg/500px-25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg",
  "salah": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mohamed_Salah_2018.jpg/500px-Mohamed_Salah_2018.jpg",
  "yamal": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lamine_Yamal_in_2025.jpg/500px-Lamine_Yamal_in_2025.jpg",
  "saka": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/1_bukayo_saka_arsenal_2025_%28cropped%29.jpg/500px-1_bukayo_saka_arsenal_2025_%28cropped%29.jpg",
  "pedri": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Pedri.jpg/500px-Pedri.jpg",
  "hakimi": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Achraf_Hakimi_vs_Niger%2C_5_Sept_2025.jpg/500px-Achraf_Hakimi_vs_Niger%2C_5_Sept_2025.jpg",
  "son": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg/500px-BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg",
  "davies": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Alphonso_Davies_in_2022.jpg/500px-Alphonso_Davies_in_2022.jpg",
  "pulisic": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/USMNT_vs._Trinidad_and_Tobago_%2848125059622%29_%28cropped%29.jpg/500px-USMNT_vs._Trinidad_and_Tobago_%2848125059622%29_%28cropped%29.jpg",
  "wirtz": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Florian_Wirtz_04012026_%283%29_%28extracted%29.jpg/500px-Florian_Wirtz_04012026_%283%29_%28extracted%29.jpg",
  "alvarez": "",
};

export const countryColors: Record<string, string> = {
  Argentina: "#75AADB",
  Brazil: "#FDD835",
  France: "#002395",
  England: "#CF081F",
  Portugal: "#006847",
  Norway: "#BA0C2F",
  Egypt: "#C8102E",
  Spain: "#AA151B",
  Morocco: "#C1272D",
  "South Korea": "#003478",
  Canada: "#FF0000",
  USA: "#3C3B6E",
  Germany: "#FFCE00",
};

export const allPlayers: Player[] = [
  // ═══════════════════════════════════════
  // TIER 1 — Full Profiles
  // ═══════════════════════════════════════
  {
    slug: "messi",
    name: "Lionel Messi",
    firstName: "Lionel",
    lastName: "Messi",
    country: "Argentina",
    flag: "🇦🇷",
    position: "Forward",
    club: "Inter Miami",
    age: 38,
    number: 10,
    tier: 1,
    group: "J",
    wcGoals: 13,
    wcApps: 26,
    wcTitles: 1,
    tagline: "The GOAT's Last Dance",
    storyline: `When Lionel Messi lifted the World Cup trophy in Lusail on December 18, 2022, the football world exhaled. The greatest player to ever grace the game had finally claimed the one prize that had eluded him for nearly two decades. It was the perfect ending — except Messi, as he has done throughout his career, refused to let others write the final chapter.\n\nNow 38 and plying his trade in Major League Soccer with Inter Miami, Messi arrives at the 2026 World Cup as the reigning champion, the defending Golden Ball holder, and the most scrutinized player on the planet. The question isn't whether he's earned the right to be here — eight Ballon d'Or awards settle that debate — it's whether his body can endure one more month of the highest-stakes football on Earth. His Copa América 2024 ankle injury sent shockwaves through Argentina, and the grueling MLS schedule has offered little respite.\n\nYet doubt has always been fuel for Messi. Argentina's squad is deeper than ever, with Julián Álvarez, Enzo Fernández, and a generation of players who grew up idolizing #10 now tasked with protecting him. In Group J, the defending champions face Algeria, Austria, and Jordan — a manageable draw that should allow Scaloni to carefully manage his minutes. If Messi is fit for the knockout rounds, everything remains possible. And if this truly is the last dance, the entire footballing world will be watching every touch, every dribble, every moment of magic.`,
    keyStats: [
      "8 Ballon d'Or",
      "2022 World Cup Champion",
      "World Cup Golden Ball 2014 & 2022",
      "Argentina all-time top scorer",
    ],
    tags: ["last-dance", "goat", "golden-boot-contender"],
    goldenBootOdds: "+1200",
    matchIds: [55, 57, 60],
  },
  {
    slug: "ronaldo",
    name: "Cristiano Ronaldo",
    firstName: "Cristiano",
    lastName: "Ronaldo",
    country: "Portugal",
    flag: "🇵🇹",
    position: "Forward",
    club: "Al Nassr",
    age: 41,
    number: 7,
    tier: 1,
    group: "K",
    wcGoals: 8,
    wcApps: 22,
    wcTitles: 0,
    tagline: "CR7: One More Time",
    storyline: `At 41 years old, Cristiano Ronaldo will walk onto a World Cup pitch knowing something that haunts him more than any defeat: this is almost certainly the last time. Five World Cups, 22 appearances, 8 goals — and yet the one trophy that would complete the most extraordinary career in footballing history remains locked behind glass in someone else's cabinet. The Euro 2016 triumph in Paris, the five Champions League titles, the 900+ career goals — none of it erases the ache of a World Cup medal never worn.\n\nCritics will point to the Saudi Pro League move, to the declining pace, to the tears shed at Euro 2024 when the game seemed to be slipping away from him. But Ronaldo's entire career has been built on proving people wrong with an almost supernatural defiance of biology. His fitness obsession is legendary — the man who arrives first at training and leaves last, who sleeps in hyperbaric chambers and eats with the discipline of an Olympic athlete. At Al Nassr, the goals have continued to flow, even if the stage lacks the prestige of the Bernabéu.\n\nPortugal's squad is loaded with talent — Bruno Fernandes, Bernardo Silva, Rafael Leão — and the tactical question of whether Ronaldo starts or serves as a super-sub will dominate every pre-match press conference. But in Group K alongside Colombia, Uzbekistan, and a playoff qualifier, Portugal have the quality to progress comfortably. The real question is what happens when the knockout rounds begin, when the lights are brightest, when CR7 has one final chance to chase the dream that Messi already caught.`,
    keyStats: [
      "5 Ballon d'Or",
      "Euro 2016 Champion",
      "All-time international top scorer (130+ goals)",
      "5 Champions League titles",
    ],
    tags: ["last-dance", "record-chaser"],
    goldenBootOdds: "+2500",
    matchIds: [61, 63, 65],
  },
  {
    slug: "mbappe",
    name: "Kylian Mbappé",
    firstName: "Kylian",
    lastName: "Mbappé",
    country: "France",
    flag: "🇫🇷",
    position: "Forward",
    club: "Real Madrid",
    age: 27,
    number: 10,
    tier: 1,
    group: "I",
    wcGoals: 4,
    wcApps: 14,
    wcTitles: 1,
    tagline: "The Next King",
    storyline: `The image is seared into World Cup folklore: Kylian Mbappé, hat-trick hero, standing alone in the center circle at Lusail Stadium after the most dramatic final in history, his face a portrait of devastation despite scoring three goals that should have won any other match. That December night in Qatar was the moment the throne was offered — and the penalty shootout was the moment it was snatched away.\n\nFour years later, Mbappé arrives in North America as arguably the most complete forward on the planet. The move to Real Madrid in 2024 added the final line to a CV that was already absurd — World Cup winner at 19 in Russia, Champions League contender every season, and a goalscoring record that makes defenders lose sleep. At 27, this is his prime World Cup, the tournament where his physical gifts — electric pace, devastating finishing, ice-cold composure — should be at their absolute peak.\n\nFrance are perennial contenders, and Group I pairs them with Senegal, Norway, and a playoff qualifier. The marquee clash is obvious: Mbappé vs Haaland when France face Norway in Boston. It's the kind of generational matchup that defines World Cups. Didier Deschamps (or his successor) will build the team around Mbappé's penetrating runs, and with Griezmann, Tchouaméni, and a stacked squad behind him, France will fancy their chances of going back-to-back. For Mbappé, though, it's personal — the 2022 final owes him a debt, and he intends to collect.`,
    keyStats: [
      "2018 World Cup Champion",
      "2022 WC Final hat-trick",
      "Real Madrid's marquee signing",
      "France's all-time WC top scorer potential",
    ],
    tags: ["heir-apparent", "golden-boot-contender"],
    goldenBootOdds: "+600",
    matchIds: [49, 51, 53],
  },
  {
    slug: "haaland",
    name: "Erling Haaland",
    firstName: "Erling",
    lastName: "Haaland",
    country: "Norway",
    flag: "🇳🇴",
    position: "Forward",
    club: "Manchester City",
    age: 25,
    number: 9,
    tier: 1,
    group: "I",
    wcGoals: 0,
    wcApps: 0,
    wcTitles: 0,
    tagline: "The Viking Arrives",
    storyline: `For the first time since 1998 — when a 17-year-old Tore André Flo was the star attraction — Norway will compete at the FIFA World Cup. And this time, they bring with them the most terrifying striker in world football. Erling Haaland has demolished every goalscoring record placed in front of him: the Premier League's single-season record, Manchester City's all-time scoring charts, and the kind of Champions League performances that made defenders physically wince. But World Cup football? Zero caps. Zero goals. A blank page.\n\nThat blank page is precisely what makes Haaland's tournament debut so compelling. Every great striker is ultimately measured by their World Cup legacy — it's why Ronaldo (the Brazilian) is revered, why Gerd Müller is immortal, why even Messi needed Qatar to complete his story. Haaland enters with no World Cup baggage but with suffocating expectations. Norway are in Group I with France, meaning Haaland vs Mbappé in Boston is one of the most anticipated group-stage matches in World Cup history. Two generational talents, same group, same ambition.\n\nAt 25, Haaland is in his physical prime — 6'4" of raw power, devastating acceleration, and a left foot that can rearrange the net from 30 yards. The question isn't whether he'll score; it's whether Norway's supporting cast can create enough around him. Ødegaard provides the creativity, but this is a team built around one man. If Haaland fires, Norway could be the tournament's great story. If he's contained, they may not survive the group. The world is about to find out which version shows up.`,
    keyStats: [
      "Premier League record scorer in a season",
      "Champions League winner 2023",
      "First WC appearance",
      "100+ goals for Man City",
    ],
    tags: ["debut", "rising-star", "golden-boot-contender"],
    goldenBootOdds: "+500",
    matchIds: [50, 52, 53],
  },
  {
    slug: "vinicius-jr",
    name: "Vinícius Jr.",
    firstName: "Vinícius",
    lastName: "Jr.",
    country: "Brazil",
    flag: "🇧🇷",
    position: "Forward",
    club: "Real Madrid",
    age: 25,
    number: 7,
    tier: 1,
    group: "C",
    wcGoals: 0,
    wcApps: 5,
    wcTitles: 0,
    tagline: "Brazil's New #7",
    storyline: `The Bernabéu has seen many Brazilian wizards — Ronaldo, Ronaldinho, Roberto Carlos — but Vinícius Jr. has carved out something entirely his own. The kid from São Gonçalo who signed with Real Madrid at 16 has transformed into the most electrifying attacker in world football, a player whose every touch on the ball sends a current of anticipation through 80,000 people. Defenders don't just respect him — they fear him.\n\nBrazil's 2022 World Cup ended in tears: a quarter-final exit to Croatia on penalties that felt like the death of a generation's dream. Neymar's era faded into heartbreak and injury, and the Seleção entered a period of painful rebuilding. From that rubble, Vinícius Jr. emerged as the undisputed talisman — the man wearing the iconic #7, the man tasked with returning Brazilian football to its throne. His Champions League performances, his Ballon d'Or candidacy, his ability to produce magic in the moments that matter most all point to a player ready for the biggest stage.\n\nGroup C places Brazil alongside Morocco — the team that shocked the 2022 tournament and carries the hopes of an entire continent. That opening match at MetLife Stadium is dripping with narrative: revenge, redemption, and the kind of high-stakes football that Vinícius Jr. was born for. Scotland and Haiti complete the group, but make no mistake — this is Vinícius Jr.'s audition for World Cup immortality. At 25, in his prime, with Real Madrid's winning DNA in his blood, the question isn't whether he has the talent. It's whether he can translate the magic of the Bernabéu to the world's biggest stage.`,
    keyStats: [
      "Champions League winner",
      "Ballon d'Or contender",
      "La Liga's most fouled player",
      "Brazil's new talisman",
    ],
    tags: ["rising-star", "golden-boot-contender", "flair"],
    goldenBootOdds: "+800",
    matchIds: [13, 16, 17],
  },
  {
    slug: "bellingham",
    name: "Jude Bellingham",
    firstName: "Jude",
    lastName: "Bellingham",
    country: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    position: "Midfielder",
    club: "Real Madrid",
    age: 22,
    number: 5,
    tier: 1,
    group: "L",
    wcGoals: 1,
    wcApps: 7,
    wcTitles: 0,
    tagline: "England's Golden Boy",
    storyline: `There is a moment from Euro 2024 that will follow Jude Bellingham for the rest of his career: stoppage time, England staring at elimination, and the 20-year-old from Stourbridge producing an overhead kick so audacious, so perfectly timed, that it felt like the universe had scripted it. That goal didn't just save England's tournament — it announced, in neon lights, that this was no ordinary talent.\n\nFrom Birmingham City's academy to Borussia Dortmund's Champions League nights to Real Madrid's La Liga title celebrations, Bellingham's trajectory has been vertical. At 22, he has already captained Real Madrid, won the league in Spain, and established himself as the most important player in an England shirt since Wayne Rooney. His box-to-box energy is relentless — arriving in the penalty area with the timing of a striker, tracking back with the discipline of a defensive midfielder, and dictating tempo with the vision of a playmaker. He is, quite simply, the most complete young player in world football.\n\nEngland have carried 60+ years of hurt to every major tournament, and the weight of that history falls heavier with each passing cycle. But this squad — Bellingham, Saka, Foden, Rice — feels different. Group L pits them against Croatia in a rematch of the 2018 semi-final that still stings, alongside Ghana and Panama. For Bellingham, the opening match against Croatia in Dallas is the stage he was built for. If England are finally going to win a World Cup, he will be the reason why.`,
    keyStats: [
      "Real Madrid's youngest foreign captain",
      "Euro 2024 standout",
      "La Liga champion",
      "England's key creative force",
    ],
    tags: ["rising-star", "young-gun"],
    goldenBootOdds: "+2000",
    matchIds: [67, 69, 71],
  },

  // ═══════════════════════════════════════
  // TIER 2 — Shorter Profiles
  // ═══════════════════════════════════════
  {
    slug: "salah",
    name: "Mohamed Salah",
    firstName: "Mohamed",
    lastName: "Salah",
    country: "Egypt",
    flag: "🇪🇬",
    position: "Forward",
    club: "Liverpool",
    age: 33,
    number: 11,
    tier: 2,
    group: "G",
    wcGoals: 2,
    wcApps: 3,
    wcTitles: 0,
    tagline: "The Egyptian King",
    storyline: `Mohamed Salah carries a nation of 110 million on his shoulders every time he pulls on the Egypt shirt, and after years of heartbreak — the 2018 World Cup shoulder injury, the 2022 AFCON final penalty miss — the 33-year-old Liverpool legend finally gets the stage he deserves. Still devastating in the Premier League, still capable of moments that leave defenders grasping at air, Salah is the greatest African footballer of his generation. In Group G alongside Belgium, Iran, and New Zealand, Egypt have a genuine shot at the knockout rounds, and Salah's big-game pedigree at Anfield translates perfectly to the pressure of World Cup football. This could be the tournament where the Egyptian King writes his crowning chapter.`,
    keyStats: [
      "Premier League Golden Boot (x3)",
      "Champions League winner 2019",
      "Africa's most decorated active player",
      "Liverpool's modern-era legend",
    ],
    tags: ["last-dance", "golden-boot-contender"],
    goldenBootOdds: "+2000",
    matchIds: [38, 40, 41],
  },
  {
    slug: "yamal",
    name: "Lamine Yamal",
    firstName: "Lamine",
    lastName: "Yamal",
    country: "Spain",
    flag: "🇪🇸",
    position: "Forward",
    club: "Barcelona",
    age: 18,
    number: 19,
    tier: 2,
    group: "H",
    wcGoals: 0,
    wcApps: 0,
    wcTitles: 0,
    tagline: "Born to Be a Star",
    storyline: `Born on July 13, 2007 — the exact day Lionel Messi made his 2006 World Cup debut — Lamine Yamal seems destined for football immortality. At 16, he became the youngest player and scorer in European Championship history at Euro 2024, terrorizing defenses with the casual brilliance of a player who simply doesn't understand that what he's doing should be impossible at his age. Now 18, a Barcelona starter, and Spain's most dangerous attacking weapon, Yamal arrives at his first World Cup as the youngest star in the tournament. In a Spain squad overflowing with midfield wizardry, he provides the cutting edge — pace, audacious skill, and a left foot that paints goals from impossible angles.`,
    keyStats: [
      "Youngest Euro Championship scorer ever",
      "Euro 2024 Best Young Player",
      "Barcelona first-team regular at 16",
      "Spain's youngest-ever international",
    ],
    tags: ["rising-star", "young-gun"],
    goldenBootOdds: "+1500",
    matchIds: [43, 45, 48],
  },
  {
    slug: "saka",
    name: "Bukayo Saka",
    firstName: "Bukayo",
    lastName: "Saka",
    country: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    position: "Forward",
    club: "Arsenal",
    age: 24,
    number: 7,
    tier: 2,
    group: "L",
    wcGoals: 1,
    wcApps: 7,
    wcTitles: 0,
    tagline: "The Starboy",
    storyline: `The missed penalty in the Euro 2020 final would have broken lesser players. Bukayo Saka, then just 19, was subjected to vile racist abuse and the crushing weight of a nation's disappointment. His response? Become Arsenal's most important player, lead them to title challenges, score in World Cups, and arrive at 2026 as one of England's most dangerous attackers. Saka's direct running, clinical finishing, and unshakable mentality make him the perfect big-tournament player — and at 24, he's entering the prime of his career with a point to prove and a score to settle.`,
    keyStats: [
      "Arsenal's Player of the Season (x3)",
      "2022 World Cup goalscorer",
      "Premier League assist leader",
      "England's most direct attacker",
    ],
    tags: ["rising-star", "golden-boot-contender"],
    goldenBootOdds: "+2500",
    matchIds: [67, 69, 71],
  },
  {
    slug: "pedri",
    name: "Pedri",
    firstName: "Pedro",
    lastName: "González López",
    country: "Spain",
    flag: "🇪🇸",
    position: "Midfielder",
    club: "Barcelona",
    age: 23,
    number: 8,
    tier: 2,
    group: "H",
    wcGoals: 0,
    wcApps: 0,
    wcTitles: 0,
    tagline: "The Magician",
    storyline: `Spain's midfield tradition — Xavi, Iniesta, Busquets — has a worthy successor in Pedri. The Barcelona conductor's first touch is a magic trick, his passing range is symphonic, and his ability to control the tempo of a match belies his 23 years. After injuries disrupted his early career, Pedri has emerged fully fit and devastating, orchestrating Spain's play with the quiet authority of a player who knows exactly what the ball should do before he even receives it. In Group H alongside Uruguay, Saudi Arabia, and Cape Verde, Spain will dominate possession — and Pedri will be the reason why.`,
    keyStats: [
      "Golden Boy Award winner",
      "Euro 2020 Young Player of the Tournament",
      "Barcelona's midfield conductor",
      "Spain's most creative passer",
    ],
    tags: ["rising-star", "young-gun"],
    goldenBootOdds: "+5000",
    matchIds: [43, 45, 48],
  },
  {
    slug: "hakimi",
    name: "Achraf Hakimi",
    firstName: "Achraf",
    lastName: "Hakimi",
    country: "Morocco",
    flag: "🇲🇦",
    position: "Defender",
    club: "PSG",
    age: 27,
    number: 2,
    tier: 2,
    group: "C",
    wcGoals: 0,
    wcApps: 7,
    wcTitles: 0,
    tagline: "Morocco's Marauder",
    storyline: `Achraf Hakimi's panenka penalty against Spain in the 2022 World Cup round of 16 wasn't just a goal — it was a statement of audacity that captured Morocco's entire fairy-tale run to the semi-finals. The PSG right-back is the heartbeat of a Moroccan team that proved to the world that African football belongs at the very top. At 27, Hakimi combines blistering pace with defensive intelligence and the kind of overlapping runs that turn him into an extra attacker. In Group C alongside Brazil, Scotland, and Haiti, Morocco are no longer underdogs — they're contenders, and Hakimi's marauding runs down the right flank will be central to their ambitions.`,
    keyStats: [
      "2022 WC semi-finalist",
      "Panenka penalty vs Spain",
      "PSG's starting right-back",
      "Africa's best defender",
    ],
    tags: ["rising-star", "flair"],
    goldenBootOdds: "N/A",
    matchIds: [13, 15, 18],
  },
  {
    slug: "son",
    name: "Son Heung-min",
    firstName: "Heung-min",
    lastName: "Son",
    country: "South Korea",
    flag: "🇰🇷",
    position: "Forward",
    club: "Tottenham",
    age: 33,
    number: 7,
    tier: 2,
    group: "A",
    wcGoals: 3,
    wcApps: 12,
    wcTitles: 0,
    tagline: "Asia's Greatest",
    storyline: `Son Heung-min is, quite simply, the greatest Asian footballer of all time. The Tottenham captain's lethal left foot, devastating pace, and ability to score from anywhere have made him a Premier League icon for over a decade. At 33, this will likely be his final World Cup — a chance to add to the three goals he's already scored across previous tournaments and lead South Korea deep into the competition. In Group A alongside co-hosts Mexico, South Africa, and a playoff qualifier, Son carries the hopes of an entire continent. His work rate, his smile, and his ability to produce magic in the biggest moments make him one of the most beloved players in world football.`,
    keyStats: [
      "Premier League Golden Boot winner",
      "Tottenham's all-time top scorer",
      "South Korea captain & all-time top scorer",
      "Asia's greatest footballer",
    ],
    tags: ["last-dance", "golden-boot-contender"],
    goldenBootOdds: "+3000",
    matchIds: [2, 4, 6],
  },
  {
    slug: "davies",
    name: "Alphonso Davies",
    firstName: "Alphonso",
    lastName: "Davies",
    country: "Canada",
    flag: "🇨🇦",
    position: "Defender/Wing",
    club: "Real Madrid",
    age: 25,
    number: 19,
    tier: 2,
    group: "B",
    wcGoals: 0,
    wcApps: 3,
    wcTitles: 0,
    tagline: "Canada's Speed Demon",
    storyline: `Alphonso Davies' story transcends football. Born in a Ghanaian refugee camp in Buduburam, raised in Edmonton, and now starring for Real Madrid — his journey from stateless child to one of the fastest players on the planet is the kind of narrative that Hollywood scripts can't match. As co-hosts, Canada will play their group matches in front of home crowds in Toronto and Vancouver, and Davies will be the poster boy for a nation experiencing World Cup fever for the first time since 1986. His explosive pace, fearless attacking runs from left-back, and genuine star power make him one of the tournament's most watchable players.`,
    keyStats: [
      "Champions League winner with Bayern",
      "Real Madrid's starting left-back",
      "Fastest player in football",
      "Canada's all-time most capped",
    ],
    tags: ["rising-star", "host-nation"],
    goldenBootOdds: "N/A",
    matchIds: [7, 10, 11],
  },
  {
    slug: "pulisic",
    name: "Christian Pulisic",
    firstName: "Christian",
    lastName: "Pulisic",
    country: "USA",
    flag: "🇺🇸",
    position: "Forward",
    club: "AC Milan",
    age: 27,
    number: 10,
    tier: 2,
    group: "D",
    wcGoals: 1,
    wcApps: 6,
    wcTitles: 0,
    tagline: "Captain America",
    storyline: `Christian Pulisic has carried the weight of American soccer's ambitions since he was a teenager at Borussia Dortmund, and in 2026, that weight becomes something else entirely: opportunity. Playing a home World Cup, in front of tens of thousands of American fans at SoFi Stadium and beyond, Pulisic has the chance to become a genuine American sporting icon — not just within soccer circles, but across the entire sports landscape. His move to AC Milan reignited his career, his Champions League winner for Chelsea proved his big-game credentials, and at 27, he arrives at the peak of his powers. In Group D alongside Paraguay, Australia, and a playoff qualifier, the USA are expected to advance — and Captain America is expected to lead the charge.`,
    keyStats: [
      "Champions League winner 2021",
      "AC Milan's creative talisman",
      "USA's youngest-ever captain",
      "Most expensive American player ever",
    ],
    tags: ["host-nation", "golden-boot-contender"],
    goldenBootOdds: "+4000",
    matchIds: [19, 21, 23],
  },
  {
    slug: "wirtz",
    name: "Florian Wirtz",
    firstName: "Florian",
    lastName: "Wirtz",
    country: "Germany",
    flag: "🇩🇪",
    position: "Midfielder",
    club: "Bayern Munich",
    age: 23,
    number: 17,
    tier: 2,
    group: "E",
    wcGoals: 0,
    wcApps: 0,
    wcTitles: 0,
    tagline: "Germany's Wunderkind",
    storyline: `Germany's post-2014 World Cup malaise — early exits, aging squads, tactical stagnation — needed a spark of genius to ignite a new era. Florian Wirtz provided a bonfire. The Bayern Munich midfielder is Germany's most exciting talent since Thomas Müller burst onto the scene in 2010, combining silky technique, intelligent movement, and a knack for scoring spectacular goals that make stadiums hold their breath. At 23, his move from Bayer Leverkusen to Bayern signaled his arrival at the absolute top of European football. In Group E alongside Ecuador, Ivory Coast, and Curaçao, Germany will look to Wirtz — alongside Musiala — to provide the creative brilliance that has been missing from Die Mannschaft for a decade.`,
    keyStats: [
      "Bundesliga's youngest-ever scorer",
      "Bayern Munich's creative engine",
      "Germany's most exciting talent",
      "Euro 2024 breakout star",
    ],
    tags: ["rising-star", "young-gun"],
    goldenBootOdds: "+3000",
    matchIds: [25, 27, 29],
  },
  {
    slug: "alvarez",
    name: "Julián Álvarez",
    firstName: "Julián",
    lastName: "Álvarez",
    country: "Argentina",
    flag: "🇦🇷",
    position: "Forward",
    club: "Atlético Madrid",
    age: 26,
    number: 9,
    tier: 2,
    group: "J",
    wcGoals: 4,
    wcApps: 7,
    wcTitles: 1,
    tagline: "Messi's Heir",
    storyline: `Julián Álvarez was supposed to be a supporting actor in Argentina's 2022 World Cup story — the hard-working forward who did the dirty work so Messi could shine. Instead, he scored four goals, delivered relentless pressing that exhausted opponents, and proved that he was far more than a sidekick. Now at Atlético Madrid and firmly established as one of Europe's most lethal strikers, the 26-year-old arrives at 2026 with a new mandate: begin the transition from Messi's Argentina to his own. Whether Messi starts, comes off the bench, or watches from the stands, Álvarez will be the man expected to lead the attack — and his big-game mentality suggests he's more than ready for the responsibility.`,
    keyStats: [
      "2022 World Cup winner & 4 goals",
      "Atlético Madrid's star striker",
      "Copa América 2024 champion",
      "Argentina's next-generation #9",
    ],
    tags: ["rising-star", "golden-boot-contender"],
    goldenBootOdds: "+1800",
    matchIds: [55, 57, 60],
  },
];

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

export function getPlayerBySlug(slug: string): Player | undefined {
  const p = allPlayers.find((p) => p.slug === slug);
  if (p && !p.image && playerImages[p.slug]) {
    p.image = playerImages[p.slug];
  }
  return p;
}

export function getPlayersForMatch(home: string, away: string): Player[] {
  return allPlayers.filter(
    (p) => p.country === home || p.country === away
  );
}

export function getPlayersByTier(tier: 1 | 2): Player[] {
  return allPlayers.filter((p) => p.tier === tier);
}

export function getPlayersByTag(tag: string): Player[] {
  return allPlayers.filter((p) => p.tags.includes(tag));
}

export function getRelatedPlayers(player: Player, limit = 4): Player[] {
  // Same group first, then same tier, excluding self
  const sameGroup = allPlayers.filter(
    (p) => p.slug !== player.slug && p.group === player.group
  );
  const sameTier = allPlayers.filter(
    (p) => p.slug !== player.slug && p.tier === player.tier && p.group !== player.group
  );
  return [...sameGroup, ...sameTier].slice(0, limit);
}

export function getCountryColor(country: string): string {
  return countryColors[country] || "#8B5CF6";
}
