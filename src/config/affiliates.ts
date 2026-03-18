export const bookmakerLinks: Record<string, { url: string; affiliate: boolean }> = {
  // Default links — will be replaced with affiliate URLs as they're obtained
  "Bet365": { url: "https://www.bet365.com", affiliate: false },
  "William Hill": { url: "https://www.williamhill.com", affiliate: false },
  "Paddy Power": { url: "https://www.paddypower.com", affiliate: false },
  "Pinnacle": { url: "https://www.pinnacle.com", affiliate: false },
  "Betfair": { url: "https://www.betfair.com", affiliate: false },
  "Betway": { url: "https://www.betway.com", affiliate: false },
  "Unibet": { url: "https://www.unibet.com", affiliate: false },
  "Unibet (UK)": { url: "https://www.unibet.co.uk", affiliate: false },
  "Sky Bet": { url: "https://www.skybet.com", affiliate: false },
  "888sport": { url: "https://www.888sport.com", affiliate: false },
  "Ladbrokes": { url: "https://www.ladbrokes.com", affiliate: false },
  "Coral": { url: "https://www.coral.co.uk", affiliate: false },
  "Marathon Bet": { url: "https://www.marathonbet.com", affiliate: false },
  "BetMGM": { url: "https://www.betmgm.com", affiliate: false },
  "FanDuel": { url: "https://www.fanduel.com", affiliate: false },
  "Smarkets": { url: "https://www.smarkets.com", affiliate: false },
  "LeoVegas": { url: "https://www.leovegas.com", affiliate: false },
  "Virgin Bet": { url: "https://www.virginbet.com", affiliate: false },
  "Coolbet": { url: "https://www.coolbet.com", affiliate: false },
  "Casumo": { url: "https://www.casumo.com", affiliate: false },
  "Neds": { url: "https://www.neds.com.au", affiliate: false },
  "PointsBet (AU)": { url: "https://www.pointsbet.com.au", affiliate: false },
  "SportsBet": { url: "https://www.sportsbet.com.au", affiliate: false },
  "TAB": { url: "https://www.tab.com.au", affiliate: false },
  "TABtouch": { url: "https://www.tabtouch.com.au", affiliate: false },
  "Grosvenor": { url: "https://www.grosvenorsport.com", affiliate: false },
  "LiveScore Bet": { url: "https://www.livescorebet.com", affiliate: false },
  "BetOnline.ag": { url: "https://www.betonline.ag", affiliate: false },
  "Everygame": { url: "https://www.everygame.eu", affiliate: false },
  "Unibet (FR)": { url: "https://www.unibet.fr", affiliate: false },
  "Unibet (NL)": { url: "https://www.unibet.nl", affiliate: false },
  "Unibet (SE)": { url: "https://www.unibet.se", affiliate: false },
  "LeoVegas (SE)": { url: "https://www.leovegas.se", affiliate: false },
};

export function getBookmakerUrl(name: string): string {
  return bookmakerLinks[name]?.url || "#";
}

export function isAffiliate(name: string): boolean {
  return bookmakerLinks[name]?.affiliate || false;
}
