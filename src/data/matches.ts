export interface Match {
  id: number;
  group: string;
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
  city: string;
  homeFlag: string;
  awayFlag: string;
}

export interface MatchWithOdds extends Match {
  bookmakers: {
    name: string;
    home: number;
    draw: number;
    away: number;
  }[];
}

export interface MatchPrediction extends Match {
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedScore: string;
  analysis: string;
  confidence: number;
}

const flags: Record<string, string> = {
  "Mexico": "🇲🇽",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  "UEFA playoff D": "🏳️",
  "Canada": "🇨🇦",
  "Switzerland": "🇨🇭",
  "Qatar": "🇶🇦",
  "UEFA playoff A": "🏳️",
  "Brazil": "🇧🇷",
  "Morocco": "🇲🇦",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Haiti": "🇭🇹",
  "USA": "🇺🇸",
  "Paraguay": "🇵🇾",
  "Australia": "🇦🇺",
  "UEFA playoff C": "🏳️",
  "Germany": "🇩🇪",
  "Ecuador": "🇪🇨",
  "Ivory Coast": "🇨🇮",
  "Curacao": "🇨🇼",
  "Netherlands": "🇳🇱",
  "Japan": "🇯🇵",
  "Tunisia": "🇹🇳",
  "UEFA playoff B": "🏳️",
  "Belgium": "🇧🇪",
  "Iran": "🇮🇷",
  "Egypt": "🇪🇬",
  "New Zealand": "🇳🇿",
  "Spain": "🇪🇸",
  "Uruguay": "🇺🇾",
  "Saudi Arabia": "🇸🇦",
  "Cape Verde": "🇨🇻",
  "France": "🇫🇷",
  "Senegal": "🇸🇳",
  "Norway": "🇳🇴",
  "ICP2": "🏳️",
  "Argentina": "🇦🇷",
  "Austria": "🇦🇹",
  "Algeria": "🇩🇿",
  "Jordan": "🇯🇴",
  "Portugal": "🇵🇹",
  "Colombia": "🇨🇴",
  "Uzbekistan": "🇺🇿",
  "ICP1": "🏳️",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croatia": "🇭🇷",
  "Panama": "🇵🇦",
  "Ghana": "🇬🇭",
};

export function getFlag(team: string): string {
  return flags[team] || "🏳️";
}

export const allMatches: Match[] = [
  // Group A
  { id: 1, group: "A", date: "June 11", time: "3:00 PM ET", home: "Mexico", away: "South Africa", venue: "Estadio Azteca", city: "Mexico City", homeFlag: "🇲🇽", awayFlag: "🇿🇦" },
  { id: 2, group: "A", date: "June 11", time: "10:00 PM ET", home: "South Korea", away: "UEFA playoff D", venue: "Estadio Akron", city: "Guadalajara", homeFlag: "🇰🇷", awayFlag: "🏳️" },
  { id: 3, group: "A", date: "June 18", time: "12:00 PM ET", home: "UEFA playoff D", away: "South Africa", venue: "Mercedes-Benz Stadium", city: "Atlanta", homeFlag: "🏳️", awayFlag: "🇿🇦" },
  { id: 4, group: "A", date: "June 18", time: "9:00 PM ET", home: "Mexico", away: "South Korea", venue: "Estadio Akron", city: "Guadalajara", homeFlag: "🇲🇽", awayFlag: "🇰🇷" },
  { id: 5, group: "A", date: "June 24", time: "9:00 PM ET", home: "UEFA playoff D", away: "Mexico", venue: "Estadio Azteca", city: "Mexico City", homeFlag: "🏳️", awayFlag: "🇲🇽" },
  { id: 6, group: "A", date: "June 24", time: "9:00 PM ET", home: "South Africa", away: "South Korea", venue: "Estadio BBVA", city: "Monterrey", homeFlag: "🇿🇦", awayFlag: "🇰🇷" },
  // Group B
  { id: 7, group: "B", date: "June 12", time: "3:00 PM ET", home: "Canada", away: "UEFA playoff A", venue: "BMO Field", city: "Toronto", homeFlag: "🇨🇦", awayFlag: "🏳️" },
  { id: 8, group: "B", date: "June 13", time: "3:00 PM ET", home: "Qatar", away: "Switzerland", venue: "Levi's Stadium", city: "San Francisco Bay Area", homeFlag: "🇶🇦", awayFlag: "🇨🇭" },
  { id: 9, group: "B", date: "June 18", time: "3:00 PM ET", home: "Switzerland", away: "UEFA playoff A", venue: "SoFi Stadium", city: "Los Angeles", homeFlag: "🇨🇭", awayFlag: "🏳️" },
  { id: 10, group: "B", date: "June 18", time: "6:00 PM ET", home: "Canada", away: "Qatar", venue: "BC Place", city: "Vancouver", homeFlag: "🇨🇦", awayFlag: "🇶🇦" },
  { id: 11, group: "B", date: "June 24", time: "3:00 PM ET", home: "Switzerland", away: "Canada", venue: "BC Place", city: "Vancouver", homeFlag: "🇨🇭", awayFlag: "🇨🇦" },
  { id: 12, group: "B", date: "June 24", time: "3:00 PM ET", home: "UEFA playoff A", away: "Qatar", venue: "Lumen Field", city: "Seattle", homeFlag: "🏳️", awayFlag: "🇶🇦" },
  // Group C
  { id: 13, group: "C", date: "June 13", time: "6:00 PM ET", home: "Brazil", away: "Morocco", venue: "MetLife Stadium", city: "New York/New Jersey", homeFlag: "🇧🇷", awayFlag: "🇲🇦" },
  { id: 14, group: "C", date: "June 13", time: "9:00 PM ET", home: "Haiti", away: "Scotland", venue: "Gillette Stadium", city: "Boston", homeFlag: "🇭🇹", awayFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { id: 15, group: "C", date: "June 19", time: "6:00 PM ET", home: "Scotland", away: "Morocco", venue: "Gillette Stadium", city: "Boston", homeFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", awayFlag: "🇲🇦" },
  { id: 16, group: "C", date: "June 19", time: "9:00 PM ET", home: "Brazil", away: "Haiti", venue: "Lincoln Financial Field", city: "Philadelphia", homeFlag: "🇧🇷", awayFlag: "🇭🇹" },
  { id: 17, group: "C", date: "June 24", time: "6:00 PM ET", home: "Scotland", away: "Brazil", venue: "Hard Rock Stadium", city: "Miami", homeFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", awayFlag: "🇧🇷" },
  { id: 18, group: "C", date: "June 24", time: "6:00 PM ET", home: "Morocco", away: "Haiti", venue: "Mercedes-Benz Stadium", city: "Atlanta", homeFlag: "🇲🇦", awayFlag: "🇭🇹" },
  // Group D
  { id: 19, group: "D", date: "June 12", time: "9:00 PM ET", home: "USA", away: "Paraguay", venue: "SoFi Stadium", city: "Los Angeles", homeFlag: "🇺🇸", awayFlag: "🇵🇾" },
  { id: 20, group: "D", date: "June 13", time: "12:00 AM ET", home: "Australia", away: "UEFA playoff C", venue: "BC Place", city: "Vancouver", homeFlag: "🇦🇺", awayFlag: "🏳️" },
  { id: 21, group: "D", date: "June 19", time: "3:00 PM ET", home: "USA", away: "Australia", venue: "Lumen Field", city: "Seattle", homeFlag: "🇺🇸", awayFlag: "🇦🇺" },
  { id: 22, group: "D", date: "June 19", time: "12:00 AM ET", home: "UEFA playoff C", away: "Paraguay", venue: "Levi's Stadium", city: "San Francisco Bay Area", homeFlag: "🏳️", awayFlag: "🇵🇾" },
  { id: 23, group: "D", date: "June 25", time: "10:00 PM ET", home: "UEFA playoff C", away: "USA", venue: "SoFi Stadium", city: "Los Angeles", homeFlag: "🏳️", awayFlag: "🇺🇸" },
  { id: 24, group: "D", date: "June 25", time: "10:00 PM ET", home: "Paraguay", away: "Australia", venue: "Levi's Stadium", city: "San Francisco Bay Area", homeFlag: "🇵🇾", awayFlag: "🇦🇺" },
  // Group E
  { id: 25, group: "E", date: "June 14", time: "1:00 PM ET", home: "Germany", away: "Curacao", venue: "NRG Stadium", city: "Houston", homeFlag: "🇩🇪", awayFlag: "🇨🇼" },
  { id: 26, group: "E", date: "June 14", time: "7:00 PM ET", home: "Ivory Coast", away: "Ecuador", venue: "Lincoln Financial Field", city: "Philadelphia", homeFlag: "🇨🇮", awayFlag: "🇪🇨" },
  { id: 27, group: "E", date: "June 20", time: "4:00 PM ET", home: "Germany", away: "Ivory Coast", venue: "BMO Field", city: "Toronto", homeFlag: "🇩🇪", awayFlag: "🇨🇮" },
  { id: 28, group: "E", date: "June 20", time: "8:00 PM ET", home: "Ecuador", away: "Curacao", venue: "Arrowhead Stadium", city: "Kansas City", homeFlag: "🇪🇨", awayFlag: "🇨🇼" },
  { id: 29, group: "E", date: "June 25", time: "4:00 PM ET", home: "Ecuador", away: "Germany", venue: "MetLife Stadium", city: "New York/New Jersey", homeFlag: "🇪🇨", awayFlag: "🇩🇪" },
  { id: 30, group: "E", date: "June 25", time: "4:00 PM ET", home: "Curacao", away: "Ivory Coast", venue: "Lincoln Financial Field", city: "Philadelphia", homeFlag: "🇨🇼", awayFlag: "🇨🇮" },
  // Group F
  { id: 31, group: "F", date: "June 14", time: "4:00 PM ET", home: "Netherlands", away: "Japan", venue: "AT&T Stadium", city: "Dallas", homeFlag: "🇳🇱", awayFlag: "🇯🇵" },
  { id: 32, group: "F", date: "June 14", time: "10:00 PM ET", home: "UEFA playoff B", away: "Tunisia", venue: "Estadio BBVA", city: "Monterrey", homeFlag: "🏳️", awayFlag: "🇹🇳" },
  { id: 33, group: "F", date: "June 20", time: "1:00 PM ET", home: "Netherlands", away: "UEFA playoff B", venue: "NRG Stadium", city: "Houston", homeFlag: "🇳🇱", awayFlag: "🏳️" },
  { id: 34, group: "F", date: "June 20", time: "12:00 AM ET", home: "Tunisia", away: "Japan", venue: "Estadio BBVA", city: "Monterrey", homeFlag: "🇹🇳", awayFlag: "🇯🇵" },
  { id: 35, group: "F", date: "June 25", time: "7:00 PM ET", home: "Japan", away: "UEFA playoff B", venue: "AT&T Stadium", city: "Dallas", homeFlag: "🇯🇵", awayFlag: "🏳️" },
  { id: 36, group: "F", date: "June 25", time: "7:00 PM ET", home: "Tunisia", away: "Netherlands", venue: "Arrowhead Stadium", city: "Kansas City", homeFlag: "🇹🇳", awayFlag: "🇳🇱" },
  // Group G
  { id: 37, group: "G", date: "June 15", time: "9:00 PM ET", home: "Iran", away: "New Zealand", venue: "SoFi Stadium", city: "Los Angeles", homeFlag: "🇮🇷", awayFlag: "🇳🇿" },
  { id: 38, group: "G", date: "June 15", time: "3:00 PM ET", home: "Belgium", away: "Egypt", venue: "Lumen Field", city: "Seattle", homeFlag: "🇧🇪", awayFlag: "🇪🇬" },
  { id: 39, group: "G", date: "June 21", time: "3:00 PM ET", home: "Belgium", away: "Iran", venue: "SoFi Stadium", city: "Los Angeles", homeFlag: "🇧🇪", awayFlag: "🇮🇷" },
  { id: 40, group: "G", date: "June 21", time: "9:00 PM ET", home: "New Zealand", away: "Egypt", venue: "BC Place", city: "Vancouver", homeFlag: "🇳🇿", awayFlag: "🇪🇬" },
  { id: 41, group: "G", date: "June 26", time: "11:00 PM ET", home: "Egypt", away: "Iran", venue: "Lumen Field", city: "Seattle", homeFlag: "🇪🇬", awayFlag: "🇮🇷" },
  { id: 42, group: "G", date: "June 26", time: "11:00 PM ET", home: "New Zealand", away: "Belgium", venue: "BC Place", city: "Vancouver", homeFlag: "🇳🇿", awayFlag: "🇧🇪" },
  // Group H
  { id: 43, group: "H", date: "June 15", time: "12:00 PM ET", home: "Spain", away: "Cape Verde", venue: "Mercedes-Benz Stadium", city: "Atlanta", homeFlag: "🇪🇸", awayFlag: "🇨🇻" },
  { id: 44, group: "H", date: "June 15", time: "6:00 PM ET", home: "Saudi Arabia", away: "Uruguay", venue: "Hard Rock Stadium", city: "Miami", homeFlag: "🇸🇦", awayFlag: "🇺🇾" },
  { id: 45, group: "H", date: "June 21", time: "12:00 PM ET", home: "Spain", away: "Saudi Arabia", venue: "Mercedes-Benz Stadium", city: "Atlanta", homeFlag: "🇪🇸", awayFlag: "🇸🇦" },
  { id: 46, group: "H", date: "June 21", time: "6:00 PM ET", home: "Uruguay", away: "Cape Verde", venue: "Hard Rock Stadium", city: "Miami", homeFlag: "🇺🇾", awayFlag: "🇨🇻" },
  { id: 47, group: "H", date: "June 26", time: "8:00 PM ET", home: "Cape Verde", away: "Saudi Arabia", venue: "NRG Stadium", city: "Houston", homeFlag: "🇨🇻", awayFlag: "🇸🇦" },
  { id: 48, group: "H", date: "June 26", time: "8:00 PM ET", home: "Uruguay", away: "Spain", venue: "Estadio Akron", city: "Guadalajara", homeFlag: "🇺🇾", awayFlag: "🇪🇸" },
  // Group I
  { id: 49, group: "I", date: "June 16", time: "3:00 PM ET", home: "France", away: "Senegal", venue: "MetLife Stadium", city: "New York/New Jersey", homeFlag: "🇫🇷", awayFlag: "🇸🇳" },
  { id: 50, group: "I", date: "June 16", time: "6:00 PM ET", home: "ICP2", away: "Norway", venue: "Gillette Stadium", city: "Boston", homeFlag: "🏳️", awayFlag: "🇳🇴" },
  { id: 51, group: "I", date: "June 22", time: "5:00 PM ET", home: "France", away: "ICP2", venue: "Lincoln Financial Field", city: "Philadelphia", homeFlag: "🇫🇷", awayFlag: "🏳️" },
  { id: 52, group: "I", date: "June 22", time: "8:00 PM ET", home: "Norway", away: "Senegal", venue: "MetLife Stadium", city: "New York/New Jersey", homeFlag: "🇳🇴", awayFlag: "🇸🇳" },
  { id: 53, group: "I", date: "June 26", time: "3:00 PM ET", home: "Norway", away: "France", venue: "Gillette Stadium", city: "Boston", homeFlag: "🇳🇴", awayFlag: "🇫🇷" },
  { id: 54, group: "I", date: "June 26", time: "3:00 PM ET", home: "Senegal", away: "ICP2", venue: "BMO Field", city: "Toronto", homeFlag: "🇸🇳", awayFlag: "🏳️" },
  // Group J
  { id: 55, group: "J", date: "June 16", time: "9:00 PM ET", home: "Argentina", away: "Algeria", venue: "Arrowhead Stadium", city: "Kansas City", homeFlag: "🇦🇷", awayFlag: "🇩🇿" },
  { id: 56, group: "J", date: "June 16", time: "12:00 AM ET", home: "Austria", away: "Jordan", venue: "Levi's Stadium", city: "San Francisco Bay Area", homeFlag: "🇦🇹", awayFlag: "🇯🇴" },
  { id: 57, group: "J", date: "June 22", time: "1:00 PM ET", home: "Argentina", away: "Austria", venue: "AT&T Stadium", city: "Dallas", homeFlag: "🇦🇷", awayFlag: "🇦🇹" },
  { id: 58, group: "J", date: "June 22", time: "11:00 PM ET", home: "Jordan", away: "Algeria", venue: "Levi's Stadium", city: "San Francisco Bay Area", homeFlag: "🇯🇴", awayFlag: "🇩🇿" },
  { id: 59, group: "J", date: "June 27", time: "10:00 PM ET", home: "Algeria", away: "Austria", venue: "Arrowhead Stadium", city: "Kansas City", homeFlag: "🇩🇿", awayFlag: "🇦🇹" },
  { id: 60, group: "J", date: "June 27", time: "10:00 PM ET", home: "Jordan", away: "Argentina", venue: "AT&T Stadium", city: "Dallas", homeFlag: "🇯🇴", awayFlag: "🇦🇷" },
  // Group K
  { id: 61, group: "K", date: "June 17", time: "1:00 PM ET", home: "Portugal", away: "ICP1", venue: "NRG Stadium", city: "Houston", homeFlag: "🇵🇹", awayFlag: "🏳️" },
  { id: 62, group: "K", date: "June 17", time: "10:00 PM ET", home: "Uzbekistan", away: "Colombia", venue: "Estadio Azteca", city: "Mexico City", homeFlag: "🇺🇿", awayFlag: "🇨🇴" },
  { id: 63, group: "K", date: "June 23", time: "1:00 PM ET", home: "Portugal", away: "Uzbekistan", venue: "NRG Stadium", city: "Houston", homeFlag: "🇵🇹", awayFlag: "🇺🇿" },
  { id: 64, group: "K", date: "June 23", time: "10:00 PM ET", home: "Colombia", away: "ICP1", venue: "Estadio Akron", city: "Guadalajara", homeFlag: "🇨🇴", awayFlag: "🏳️" },
  { id: 65, group: "K", date: "June 27", time: "7:30 PM ET", home: "Colombia", away: "Portugal", venue: "Hard Rock Stadium", city: "Miami", homeFlag: "🇨🇴", awayFlag: "🇵🇹" },
  { id: 66, group: "K", date: "June 27", time: "7:30 PM ET", home: "ICP1", away: "Uzbekistan", venue: "Mercedes-Benz Stadium", city: "Atlanta", homeFlag: "🏳️", awayFlag: "🇺🇿" },
  // Group L
  { id: 67, group: "L", date: "June 17", time: "4:00 PM ET", home: "England", away: "Croatia", venue: "AT&T Stadium", city: "Dallas", homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", awayFlag: "🇭🇷" },
  { id: 68, group: "L", date: "June 17", time: "7:00 PM ET", home: "Ghana", away: "Panama", venue: "BMO Field", city: "Toronto", homeFlag: "🇬🇭", awayFlag: "🇵🇦" },
  { id: 69, group: "L", date: "June 23", time: "4:00 PM ET", home: "England", away: "Ghana", venue: "Gillette Stadium", city: "Boston", homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", awayFlag: "🇬🇭" },
  { id: 70, group: "L", date: "June 23", time: "7:00 PM ET", home: "Panama", away: "Croatia", venue: "BMO Field", city: "Toronto", homeFlag: "🇵🇦", awayFlag: "🇭🇷" },
  { id: 71, group: "L", date: "June 27", time: "5:00 PM ET", home: "Panama", away: "England", venue: "MetLife Stadium", city: "New York/New Jersey", homeFlag: "🇵🇦", awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 72, group: "L", date: "June 27", time: "5:00 PM ET", home: "Croatia", away: "Ghana", venue: "Lincoln Financial Field", city: "Philadelphia", homeFlag: "🇭🇷", awayFlag: "🇬🇭" },
];

export const groupNames: Record<string, string[]> = {
  A: ["Mexico", "South Korea", "South Africa", "UEFA playoff D"],
  B: ["Canada", "Switzerland", "Qatar", "UEFA playoff A"],
  C: ["Brazil", "Morocco", "Scotland", "Haiti"],
  D: ["USA", "Paraguay", "Australia", "UEFA playoff C"],
  E: ["Germany", "Ecuador", "Ivory Coast", "Curacao"],
  F: ["Netherlands", "Japan", "Tunisia", "UEFA playoff B"],
  G: ["Belgium", "Iran", "Egypt", "New Zealand"],
  H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
  I: ["France", "Senegal", "Norway", "ICP2"],
  J: ["Argentina", "Austria", "Algeria", "Jordan"],
  K: ["Portugal", "Colombia", "Uzbekistan", "ICP1"],
  L: ["England", "Croatia", "Panama", "Ghana"],
};

// Generate sample odds for all matches
function generateOdds(home: string, away: string): MatchWithOdds["bookmakers"] {
  // Power ratings for realistic odds
  const power: Record<string, number> = {
    "Brazil": 92, "Argentina": 93, "France": 91, "Spain": 94, "England": 89,
    "Germany": 88, "Portugal": 90, "Netherlands": 87, "Belgium": 85, "Croatia": 84,
    "Uruguay": 83, "Colombia": 82, "USA": 78, "Mexico": 80, "Japan": 81,
    "Morocco": 82, "Senegal": 79, "South Korea": 79, "Switzerland": 83, "Ecuador": 77,
    "Canada": 76, "Australia": 75, "Iran": 74, "Tunisia": 73, "Ivory Coast": 78,
    "Egypt": 76, "Algeria": 75, "Norway": 77, "Austria": 78, "Scotland": 74,
    "Ghana": 73, "Panama": 68, "Qatar": 72, "Saudi Arabia": 72, "New Zealand": 65,
    "Cape Verde": 62, "Haiti": 58, "Jordan": 67, "Curacao": 55, "Uzbekistan": 70,
    "UEFA playoff A": 72, "UEFA playoff B": 72, "UEFA playoff C": 72, "UEFA playoff D": 72,
    "ICP1": 65, "ICP2": 65,
  };
  const hp = power[home] || 70;
  const ap = power[away] || 70;
  const diff = hp - ap;
  
  // Base probabilities
  let homeProb = 0.40 + diff * 0.012;
  let drawProb = 0.28 - Math.abs(diff) * 0.005;
  let awayProb = 1 - homeProb - drawProb;
  
  homeProb = Math.max(0.08, Math.min(0.82, homeProb));
  drawProb = Math.max(0.12, Math.min(0.32, drawProb));
  awayProb = Math.max(0.08, Math.min(0.82, awayProb));
  
  const total = homeProb + drawProb + awayProb;
  homeProb /= total;
  drawProb /= total;
  awayProb /= total;

  const bookmakers = ["Bet365", "1xBet", "Betway", "Pinnacle"];
  return bookmakers.map(name => {
    const margin = name === "Pinnacle" ? 1.02 : 1.06;
    const variance = () => (Math.random() - 0.5) * 0.03;
    return {
      name,
      home: Math.round((margin / (homeProb + variance())) * 100) / 100,
      draw: Math.round((margin / (drawProb + variance())) * 100) / 100,
      away: Math.round((margin / (awayProb + variance())) * 100) / 100,
    };
  });
}

export function getAllMatchesWithOdds(): MatchWithOdds[] {
  return allMatches.map(m => ({
    ...m,
    bookmakers: generateOdds(m.home, m.away),
  }));
}

// Generate predictions for all matches
function generatePrediction(match: Match): MatchPrediction {
  const power: Record<string, number> = {
    "Brazil": 92, "Argentina": 93, "France": 91, "Spain": 94, "England": 89,
    "Germany": 88, "Portugal": 90, "Netherlands": 87, "Belgium": 85, "Croatia": 84,
    "Uruguay": 83, "Colombia": 82, "USA": 78, "Mexico": 80, "Japan": 81,
    "Morocco": 82, "Senegal": 79, "South Korea": 79, "Switzerland": 83, "Ecuador": 77,
    "Canada": 76, "Australia": 75, "Iran": 74, "Tunisia": 73, "Ivory Coast": 78,
    "Egypt": 76, "Algeria": 75, "Norway": 77, "Austria": 78, "Scotland": 74,
    "Ghana": 73, "Panama": 68, "Qatar": 72, "Saudi Arabia": 72, "New Zealand": 65,
    "Cape Verde": 62, "Haiti": 58, "Jordan": 67, "Curacao": 55, "Uzbekistan": 70,
    "South Africa": 71, "UEFA playoff A": 72, "UEFA playoff B": 72, "UEFA playoff C": 72,
    "UEFA playoff D": 72, "ICP1": 65, "ICP2": 65,
  };
  const hp = power[match.home] || 70;
  const ap = power[match.away] || 70;
  const diff = hp - ap;

  let homeWin = 40 + diff * 1.2;
  let draw = 28 - Math.abs(diff) * 0.5;
  let awayWin = 100 - homeWin - draw;

  homeWin = Math.max(8, Math.min(82, homeWin));
  draw = Math.max(12, Math.min(32, draw));
  awayWin = Math.max(8, Math.min(82, awayWin));
  const total = homeWin + draw + awayWin;
  homeWin = Math.round(homeWin / total * 100);
  draw = Math.round(draw / total * 100);
  awayWin = 100 - homeWin - draw;

  // Predicted scores
  const homeGoals = diff > 10 ? 2 : diff > 0 ? 1 : diff > -5 ? 1 : 0;
  const awayGoals = diff < -10 ? 2 : diff < 0 ? 1 : diff < 5 ? 1 : 0;
  const predictedScore = `${homeGoals}-${awayGoals}`;
  const confidence = Math.min(92, 55 + Math.abs(diff));

  const analyses: Record<string, string> = {
    // Group A
    "Mexico vs South Africa": "The opening match of the tournament — Mexico will have massive home support at the Estadio Azteca. South Africa are defensively organized but lack firepower against top CONCACAF sides. Expect Mexico to control possession.",
    "South Korea vs UEFA playoff D": "South Korea's technical quality and big-tournament experience should see them through. The playoff qualifier will be an unknown quantity, but Son Heung-min and co. are strong favorites here.",
    "UEFA playoff D vs South Africa": "Two teams looking to upset the group favorites. South Africa's physicality could be a factor, but the European qualifier may have the edge in tactical discipline.",
    "Mexico vs South Korea": "A fascinating clash of styles — Mexico's fluid attacking play vs South Korea's high-pressing system. Both teams have World Cup pedigree. This could be the group decider.",
    "UEFA playoff D vs Mexico": "Mexico should have qualification wrapped up by now. A rotated squad could make this tighter than expected, but the quality gap remains significant.",
    "South Africa vs South Korea": "A must-win for both sides. South Korea's pace and technical ability should edge it, but South Africa will make it physical. High-intensity encounter expected.",
    // Group B
    "Canada vs UEFA playoff A": "Canada will want to make a statement at home in Toronto. With Alphonso Davies leading the charge, they should have too much for the playoff qualifier.",
    "Qatar vs Switzerland": "Switzerland's experience at major tournaments gives them a clear edge. Qatar struggled as hosts in 2022 and face an even tougher task here. Xhaka will dictate the tempo.",
    "Switzerland vs UEFA playoff A": "Switzerland are strong favorites and should control this match comfortably. Their midfield solidity and defensive organization are world-class.",
    "Canada vs Qatar": "Canada at BC Place will be a hostile atmosphere for Qatar. The Canadian attack led by Davies and David should create plenty of chances.",
    "Switzerland vs Canada": "The group decider — Switzerland's tournament nous against Canada's youthful energy. A tight, tactical battle expected with Switzerland's experience likely decisive.",
    "UEFA playoff A vs Qatar": "Both sides fighting to avoid the bottom spot. Qatar need to find their 2022 hosting form, but without home advantage, it's a tough ask.",
    // Group C
    "Brazil vs Morocco": "The rematch of the 2022 quarter-final. Morocco's defensive masterclass shocked Brazil then, but the Seleção have rebuilt with renewed attacking intent. MetLife will be electric.",
    "Haiti vs Scotland": "Scotland should have enough quality to handle Haiti, but the Caribbean side will bring energy and unpredictability. McTominay's all-round game will be key for Scotland.",
    "Scotland vs Morocco": "Morocco's tactical sophistication will test Scotland severely. The Atlas Lions have proven they belong among the elite — Scotland need a disciplined defensive performance.",
    "Brazil vs Haiti": "An expected mismatch on paper. Brazil should rotate but still dominate. Haiti's World Cup appearance is historic — they'll look to compete with pride.",
    "Scotland vs Brazil": "A massive occasion for Scotland. Brazil's individual quality should prevail, but Scotland's physical approach and set-piece threat could cause problems.",
    "Morocco vs Haiti": "Morocco should win comfortably. Their 2022 semi-final run showed they're a top-tier side now. Haiti will struggle to contain their wing play.",
    // Group D
    "USA vs Paraguay": "The USA will want a strong start on home soil at SoFi Stadium. Paraguay are disciplined but the USMNT's young talent — Pulisic, Reyna, McKennie — should be too dynamic.",
    "Australia vs UEFA playoff C": "Australia's Socceroos have deep World Cup experience. They'll be expected to win but playoff qualifiers can be dangerous opponents in opening matches.",
    "USA vs Australia": "Two sides familiar with each other from friendlies. The USA's home advantage and superior squad depth should see them through in Seattle.",
    "UEFA playoff C vs Paraguay": "A tough match to call. Paraguay's South American grit against an unknown European or Asian qualifier. Tactical flexibility will be key.",
    "UEFA playoff C vs USA": "By matchday 3, the USA should have qualification sewn up. The playoff side will need to throw everything forward, opening up counter-attacking opportunities.",
    "Paraguay vs Australia": "Both teams scrapping for the second qualifying spot. Paraguay's compact defensive style vs Australia's more direct approach. Could go either way.",
    // Group E
    "Germany vs Curacao": "Germany should dominate this one comprehensively. Curacao are making history by qualifying but face a massive step up. Expect Musiala and Wirtz to shine.",
    "Ivory Coast vs Ecuador": "AFCON champions vs a resurgent Ecuador. This is a genuine 50/50 match. Ivory Coast's attacking talent against Ecuador's altitude-hardened fitness and organization.",
    "Germany vs Ivory Coast": "A high-quality Group E clash. Germany's tactical precision vs Ivory Coast's flair. Both teams have genuine knockout-stage aspirations.",
    "Ecuador vs Curacao": "Ecuador should handle this comfortably. Their experience at altitude gives them a fitness edge, and their young squad is full of pace and power.",
    "Ecuador vs Germany": "Germany are favorites but Ecuador are no pushovers. Their high-pressing style could cause Germany problems if the Mannschaft aren't sharp.",
    "Curacao vs Ivory Coast": "Ivory Coast's quality should be too much for Curacao. Expect the AFCON champions to attack from the start and control the match.",
    // Group F
    "Netherlands vs Japan": "A mouth-watering clash. Japan's 2022 heroics against Germany and Spain showed they can beat anyone. The Dutch will need to be at their best.",
    "UEFA playoff B vs Tunisia": "Tunisia's AFCON experience makes them dangerous, but the European playoff winner could also be a strong side. A balanced encounter expected.",
    "Netherlands vs UEFA playoff B": "The Netherlands should control this one with their superior technical quality and tactical flexibility under their coaching staff.",
    "Tunisia vs Japan": "Japan's pressing intensity against Tunisia's North African nous. Japan have been improving rapidly and should edge this one, but Tunisia are streetwise.",
    "Japan vs UEFA playoff B": "Japan's blend of technical skill and pressing intensity makes them one of the tournament's most exciting teams. Should win comfortably here.",
    "Tunisia vs Netherlands": "Tunisia will sit deep and look to frustrate. The Dutch need patience and clinical finishing to break through an organized defensive block.",
    // Group G
    "Iran vs New Zealand": "Iran's experience in Asian World Cup qualifying gives them an edge in tournament football. New Zealand will compete but lack the quality to win.",
    "Belgium vs Egypt": "Belgium may be aging but still have quality throughout the squad. Egypt's Salah-led attack can hurt anyone, making this an intriguing contest.",
    "Belgium vs Iran": "Belgium should have enough to win this one. Iran will be compact and disciplined but the Belgian attack should create chances.",
    "New Zealand vs Egypt": "Egypt are strong favorites. Salah's presence alone makes them dangerous, and New Zealand will struggle to contain their attacking movement.",
    "Egypt vs Iran": "Two defensive-minded teams. This could be tight and tactical. Egypt's individual quality, particularly Salah, gives them the slight edge.",
    "New Zealand vs Belgium": "Belgium should win, but New Zealand's physicality and never-say-die attitude could make it uncomfortable. A professional job expected from the Belgians.",
    // Group H
    "Spain vs Cape Verde": "Spain's tiki-taka machine should overwhelm Cape Verde's defense. The island nation are making history but face the tournament's best possession team.",
    "Saudi Arabia vs Uruguay": "Uruguay's South American pedigree vs Saudi Arabia's improving squad. Uruguay should win but Saudi Arabia showed in 2022 they can cause upsets.",
    "Spain vs Saudi Arabia": "Spain are heavy favorites. Saudi Arabia's shock win over Argentina in 2022 will be on everyone's mind, but Spain's squad depth is unmatched.",
    "Uruguay vs Cape Verde": "Uruguay should handle this comfortably. Núñez and the Uruguayan attack will look to boost their goal difference ahead of the group decider.",
    "Cape Verde vs Saudi Arabia": "Both outsiders in this group. Saudi Arabia's greater resources and World Cup experience make them favorites, but Cape Verde have nothing to lose.",
    "Uruguay vs Spain": "The group's marquee match. Spain's technical brilliance against Uruguay's famous defensive resilience. A potential classic that could decide group winners.",
    // Group I
    "France vs Senegal": "France's immense squad depth makes them favorites in almost any match. Senegal are Africa's strongest side but France at a World Cup are a different beast.",
    "ICP2 vs Norway": "Norway's Haaland is the X-factor. The playoff qualifier will try to contain him but it's a near-impossible task. Norway should win comfortably.",
    "France vs ICP2": "France should cruise through this one. Mbappé and company will look to build momentum ahead of the knockout stages.",
    "Norway vs Senegal": "A fascinating clash — Haaland vs Senegal's elite defenders. Senegal's tactical intelligence could neutralize Norway's threat, but Haaland only needs one chance.",
    "Norway vs France": "France are favorites but Norway with Haaland are always dangerous. The Erling effect could cause a shock if France aren't at their best.",
    "Senegal vs ICP2": "Senegal should win this one. Their experience from 2022 and strong squad make them comfortable favorites against the playoff qualifier.",
    // Group J
    "Argentina vs Algeria": "The reigning world champions should be too strong for Algeria. Messi may or may not be involved, but Argentina's squad depth is extraordinary.",
    "Austria vs Jordan": "Austria's European quality should tell. Jordan are a rising force in Asian football but Austria's Bundesliga core gives them the edge.",
    "Argentina vs Austria": "Argentina are heavy favorites. Austria will try to be compact and disciplined but the world champions have the quality to break any defense.",
    "Jordan vs Algeria": "A genuine contest between two sides hoping to cause upsets. Algeria's AFCON experience gives them a slight edge over Jordan's growing squad.",
    "Algeria vs Austria": "Both sides fighting for the second spot. Austria's superior league pedigree faces Algeria's tournament experience. A tight, physical encounter expected.",
    "Jordan vs Argentina": "Argentina should win comfortably regardless of the permutations. Jordan will look to keep the score respectable and show their progress on the world stage.",
    // Group K
    "Portugal vs ICP1": "Portugal's star-studded squad should dominate. Even with Ronaldo's role uncertain, the Portuguese have elite talent throughout.",
    "Uzbekistan vs Colombia": "Colombia's South American flair against Uzbekistan's organized approach. Colombia's quality in the final third should be decisive at the Azteca.",
    "Portugal vs Uzbekistan": "Portugal are heavy favorites. Uzbekistan have improved but face a massive step up against one of Europe's most talented squads.",
    "Colombia vs ICP1": "Colombia should win comfortably. Their attacking talent — James, Díaz, and others — should create plenty of chances.",
    "Colombia vs Portugal": "The group's blockbuster match. Two attacking powerhouses with incredible individual talent. Could be the best group-stage game of the tournament.",
    "ICP1 vs Uzbekistan": "Two underdogs battling it out. Uzbekistan's Central Asian quality against the playoff qualifier. A hard-to-predict but important match for both sides.",
    // Group L
    "England vs Croatia": "A rematch of the 2018 semi-final. Both squads have evolved but England's young talent gives them the edge. A tight, tactical affair expected in Dallas.",
    "Ghana vs Panama": "Ghana's African quality should prevail. Panama are resilient but Ghana have more individual talent and big-tournament experience.",
    "England vs Ghana": "England are strong favorites. Their squad depth and tactical flexibility under their coaching setup should see them through comfortably.",
    "Panama vs Croatia": "Croatia's midfield mastery will be the difference. Panama will compete physically but Croatia's passing quality should unlock the defense.",
    "Panama vs England": "England should have already qualified. Even with rotation, the quality gap is significant. Panama will fight but England have too much depth.",
    "Croatia vs Ghana": "Both teams scrapping for second place. Croatia's tournament pedigree gives them the edge, but Ghana's pace and power will be a test.",
  };

  const key = `${match.home} vs ${match.away}`;
  const analysis = analyses[key] || `An intriguing Group ${match.group} encounter. ${match.home} will look to assert their authority while ${match.away} aim to compete at the highest level. Tactical discipline and set pieces could be decisive.`;

  return {
    ...match,
    homeWin,
    draw,
    awayWin,
    predictedScore,
    analysis,
    confidence,
  };
}

export function getAllPredictions(): MatchPrediction[] {
  return allMatches.map(generatePrediction);
}

export const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
export const matchDates = [...new Set(allMatches.map(m => m.date))].sort();

/**
 * Convert WC match date/time strings to ISO timestamp.
 * e.g. "June 11" + "3:00 PM ET" → "2026-06-11T19:00:00Z"
 * ET = UTC-4 (EDT, June = daylight saving)
 */
export function getKickoffISO(date: string, time: string): string {
  const months: Record<string, string> = {
    "January": "01", "February": "02", "March": "03", "April": "04",
    "May": "05", "June": "06", "July": "07", "August": "08",
    "September": "09", "October": "10", "November": "11", "December": "12"
  };

  const parts = date.split(" ");
  const month = months[parts[0]] || "06";
  const day = parts[1].padStart(2, "0");

  // Parse time like "3:00 PM ET" or "12:00 AM ET"
  const timeClean = time.replace(" ET", "").trim();
  const match = timeClean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return `2026-${month}-${day}T00:00:00Z`;

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  // ET (EDT) = UTC-4, so add 4 hours to get UTC
  hours += 4;
  let dayNum = parseInt(day);
  if (hours >= 24) {
    hours -= 24;
    dayNum += 1;
  }

  const utcDay = String(dayNum).padStart(2, "0");
  const utcHours = String(hours).padStart(2, "0");

  return `2026-${month}-${utcDay}T${utcHours}:${minutes}:00Z`;
}
