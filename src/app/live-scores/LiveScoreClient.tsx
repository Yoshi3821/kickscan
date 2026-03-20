"use client";

import { useState, useEffect } from 'react';
import { LiveMatch, MatchEvent, groupMatchesByLeague, sortLeaguesByPriority, PRIORITY_LEAGUES } from '@/lib/livescore-api';
import { getUserTimezone, formatTimeOnly, getTimezoneLabel, setUserTimezone, TIMEZONE_OPTIONS } from '@/lib/timezone';
import Link from 'next/link';

interface LiveScoreData {
  matches: LiveMatch[];
  liveCount: number;
  totalCount: number;
  lastUpdated: string;
}

interface LiveScoreClientProps {
  initialData: LiveScoreData;
}

type FilterTab = 'live' | 'today' | 'priority' | 'all';

export default function LiveScoreClient({ initialData }: LiveScoreClientProps) {
  const [data, setData] = useState<LiveScoreData>(initialData);
  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    return initialData.liveCount > 0 ? 'live' : 'today';
  });
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(initialData.lastUpdated));
  const [countdown, setCountdown] = useState<number>(10);
  const [userTz, setUserTz] = useState<string>("America/New_York");
  const [showTzPicker, setShowTzPicker] = useState(false);

  // Initialize timezone
  useEffect(() => {
    setUserTz(getUserTimezone());
    const handleTzChange = () => setUserTz(getUserTimezone());
    window.addEventListener("kickscan_tz_change", handleTzChange);
    return () => window.removeEventListener("kickscan_tz_change", handleTzChange);
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/livescores', { cache: 'no-store' });
        const newData = await response.json();
        setData(newData);
        setLastUpdated(new Date(newData.lastUpdated));
        setCountdown(10); // Reset countdown
        
        // Switch to live tab if live matches become available
        if (newData.liveCount > 0 && activeTab !== 'live') {
          setActiveTab('live');
        }
      } catch (error) {
        console.error('Failed to refresh live scores:', error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 10;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter matches based on active tab
  const getFilteredMatches = (): LiveMatch[] => {
    switch (activeTab) {
      case 'live':
        return data.matches.filter(match => match.isLive);
      case 'today':
        return data.matches;
      case 'priority':
        return data.matches.filter(match => PRIORITY_LEAGUES.includes(match.leagueId));
      case 'all':
        return data.matches;
      default:
        return data.matches;
    }
  };

  const filteredMatches = getFilteredMatches();
  const groupedMatches = groupMatchesByLeague(filteredMatches);
  const sortedLeagues = sortLeaguesByPriority(groupedMatches);

  const toggleLeague = (leagueId: string) => {
    const newCollapsed = new Set(collapsedLeagues);
    if (newCollapsed.has(leagueId)) {
      newCollapsed.delete(leagueId);
    } else {
      newCollapsed.add(leagueId);
    }
    setCollapsedLeagues(newCollapsed);
  };

  const toggleMatchExpanded = (fixtureId: number) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(fixtureId)) {
      newExpanded.delete(fixtureId);
    } else {
      newExpanded.add(fixtureId);
    }
    setExpandedMatches(newExpanded);
  };

  const getStatusDisplay = (match: LiveMatch) => {
    const isLive = ['1H', '2H', 'ET'].includes(match.status);
    const isHalfTime = match.status === 'HT';
    const isFinished = ['FT', 'AET', 'PEN'].includes(match.status);
    const isNotStarted = ['NS', 'TBD'].includes(match.status);
    const isStopped = ['PST', 'SUSP', 'INT', 'CANC'].includes(match.status);

    if (isLive) {
      return (
        <div className="flex items-center gap-2 min-w-[60px]">
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-green-400 font-bold text-sm">{match.minute}'</span>
          </div>
        </div>
      );
    }

    if (isHalfTime) {
      return (
        <div className="flex items-center gap-2 min-w-[60px]">
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-amber-400 font-bold text-sm">HT</span>
          </div>
        </div>
      );
    }

    if (isFinished) {
      return (
        <div className="flex items-center gap-2 min-w-[60px]">
          <span className="text-gray-400 font-medium text-sm">FT</span>
        </div>
      );
    }

    if (isNotStarted) {
      const kickoffTime = formatTimeOnly(match.date, userTz);
      return (
        <div className="flex items-center gap-2 min-w-[60px]">
          <span className="text-gray-400 font-medium text-sm">{kickoffTime}</span>
        </div>
      );
    }

    if (isStopped) {
      return (
        <div className="flex items-center gap-2 min-w-[60px]">
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-red-400 font-bold text-sm">{match.status}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 min-w-[60px]">
        <span className="text-gray-400 font-medium text-sm">{match.status}</span>
      </div>
    );
  };

  const getScoreDisplay = (match: LiveMatch) => {
    if (match.status === 'NS' || match.status === 'TBD') {
      return <span className="text-gray-500 font-bold text-xl">- : -</span>;
    }
    
    return (
      <span className="text-white font-black text-xl">
        {match.homeGoals ?? 0} - {match.awayGoals ?? 0}
      </span>
    );
  };

  const getGoalScorers = (match: LiveMatch, isHome: boolean) => {
    const teamEvents = match.events.filter(event => 
      event.type === "Goal" && 
      (isHome ? event.teamName === match.homeTeam : event.teamName === match.awayTeam)
    );

    if (teamEvents.length === 0) return null;

    return teamEvents.map(event => {
      let detail = '';
      if (event.detail === 'Own Goal') detail = 'OG';
      else if (event.detail === 'Penalty') detail = 'PEN';
      
      const playerName = event.playerName || 'Unknown';
      return `${event.minute}' ${playerName}${detail ? ` (${detail})` : ''}`;
    }).join(', ');
  };

  const hasRecentGoal = (match: LiveMatch, teamName: string) => {
    if (!match.minute) return false;
    
    const recentGoals = match.events.filter(event => 
      event.type === "Goal" && 
      event.teamName === teamName && 
      match.minute! - event.minute <= 5
    );
    
    return recentGoals.length > 0;
  };

  const getMatchRowBorder = (match: LiveMatch) => {
    const isLive = ['1H', '2H', 'ET'].includes(match.status);
    const isHalfTime = match.status === 'HT';
    const isStopped = ['PST', 'SUSP', 'INT', 'CANC'].includes(match.status);

    if (isLive) return 'border-l-2 border-green-500';
    if (isHalfTime) return 'border-l-2 border-amber-500';
    if (isStopped) return 'border-l-2 border-red-500';
    return '';
  };

  const getMatchRowLink = (match: LiveMatch) => {
    // Only major leagues get clickable links to full analysis
    const MAJOR_LEAGUES = [39, 2, 140, 135, 78, 3, 48, 61, 88, 94, 253, 1]; // EPL, UCL, La Liga, Serie A, Bundesliga, Europa, Ligue 1, WC etc
    if (MAJOR_LEAGUES.includes(match.leagueId)) {
      return `/leagues/${match.fixtureId}`;
    }
    return null;
  };

  const renderEventTimeline = (match: LiveMatch) => {
    const homeEvents = match.events.filter(e => e.teamName === match.homeTeam);
    const awayEvents = match.events.filter(e => e.teamName === match.awayTeam);
    
    const allEvents = [...match.events].sort((a, b) => a.minute - b.minute);

    return (
      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 space-y-3">
        <h4 className="text-white font-semibold text-sm mb-3">Match Events</h4>
        
        {allEvents.length === 0 ? (
          <p className="text-gray-400 text-sm">No events recorded yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allEvents.map((event, index) => {
              const isHome = event.teamName === match.homeTeam;
              let icon = '';
              let iconColor = '';
              
              if (event.type === 'Goal') {
                icon = '⚽';
                iconColor = 'text-green-400';
              } else if (event.type === 'Card') {
                if (event.detail === 'Yellow Card') {
                  icon = '🟨';
                  iconColor = 'text-yellow-400';
                } else if (event.detail === 'Red Card') {
                  icon = '🟥';
                  iconColor = 'text-red-400';
                }
              } else if (event.type === 'subst') {
                icon = '🔄';
                iconColor = 'text-blue-400';
              }
              
              return (
                <div key={index} className={`flex items-center gap-3 text-sm ${!isHome ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 text-center">
                    <span className="text-gray-400 font-medium">{event.minute}'</span>
                  </div>
                  <div className={`flex items-center gap-2 ${iconColor}`}>
                    <span className="text-base">{icon}</span>
                  </div>
                  <div className={`flex-1 ${!isHome ? 'text-right' : ''}`}>
                    <span className="text-white font-medium">{event.playerName || 'Unknown'}</span>
                    {(event.assistName || '') && event.type === 'subst' && (
                      <span className="text-gray-400 text-xs ml-1">
                        → {event.assistName || ''}
                      </span>
                    )}
                    {(event.assistName || '') && event.type === 'Goal' && (
                      <span className="text-gray-400 text-xs ml-1">
                        (assist: {event.assistName || ''})
                      </span>
                    )}
                    {event.detail && event.type === 'Goal' && (
                      <span className="text-gray-400 text-xs ml-1">
                        ({event.detail})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {getMatchRowLink(match) && (
          <div className="pt-3 border-t border-white/5">
            <Link 
              href={getMatchRowLink(match)!} 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              View Full Analysis →
            </Link>
          </div>
        )}
      </div>
    );
  };

  if (sortedLeagues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">
          {activeTab === 'live' 
            ? "No live matches right now." 
            : "No matches scheduled today."
          }
        </div>
        <p className="text-gray-500 text-sm">Check back later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with live count */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          ⚡ Live Scores
          {data.liveCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              {data.liveCount} live
            </span>
          )}
        </h1>
        <p className="text-gray-400 text-sm">
          Refreshes in {countdown}s • {data.totalCount} matches total
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500">
          <span>🕐 {getTimezoneLabel(userTz)}</span>
          <button
            onClick={() => setShowTzPicker(!showTzPicker)}
            className="text-purple-400 hover:text-purple-300 transition underline"
          >
            Change
          </button>
        </div>
        {showTzPicker && (
          <div className="max-w-xs mx-auto mt-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <select
              value={userTz}
              onChange={(e) => {
                setUserTimezone(e.target.value);
                setUserTz(e.target.value);
                setShowTzPicker(false);
              }}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-gray-900 text-white">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === 'live'
              ? "bg-red-500/20 backdrop-blur-xl border border-red-500/30 text-red-400 shadow-lg shadow-red-500/10"
              : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          🔴 LIVE {data.liveCount > 0 && `(${data.liveCount})`}
        </button>
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === 'today'
              ? "bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg shadow-purple-500/10"
              : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          📅 Today
        </button>
        <button
          onClick={() => setActiveTab('priority')}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === 'priority'
              ? "bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg shadow-purple-500/10"
              : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          ⭐ Top Leagues
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === 'all'
              ? "bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg shadow-purple-500/10"
              : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          🌍 All
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {sortedLeagues.map(([leagueId, matches]) => {
          const league = matches[0]; // Get league info from first match
          const isCollapsed = collapsedLeagues.has(leagueId);

          return (
            <div key={leagueId} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              {/* League Header */}
              <button
                onClick={() => toggleLeague(leagueId)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/[0.08] transition-colors"
              >
                <img 
                  src={league.leagueLogo} 
                  alt={league.leagueName}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <img 
                  src={league.countryFlag} 
                  alt={league.leagueCountry}
                  className="w-5 h-4 rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="font-semibold text-white text-left flex-1">
                  {league.leagueName}
                </span>
                <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                  {matches.length} {matches.length !== 1 ? 'matches' : 'match'}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Matches */}
              {!isCollapsed && (
                <div className="border-t border-white/5">
                  {matches.map((match, index) => {
                    const isExpanded = expandedMatches.has(match.fixtureId);
                    const homeScorers = getGoalScorers(match, true);
                    const awayScorers = getGoalScorers(match, false);
                    const hasGoalScorers = homeScorers || awayScorers;
                    const homeRecentGoal = hasRecentGoal(match, match.homeTeam);
                    const awayRecentGoal = hasRecentGoal(match, match.awayTeam);
                    const totalCards = match.yellowCards.home + match.yellowCards.away + match.redCards.home + match.redCards.away;

                    return (
                      <div 
                        key={match.fixtureId}
                        className={`${getMatchRowBorder(match)} ${
                          index < matches.length - 1 ? 'border-b border-white/5' : ''
                        }`}
                      >
                        {/* Main Match Row — Redesigned */}
                        <div 
                          className="px-4 sm:px-6 py-4 hover:bg-white/[0.05] transition-colors cursor-pointer"
                          onClick={() => toggleMatchExpanded(match.fixtureId)}
                        >
                          {/* Status + Time row */}
                          <div className="flex items-center justify-between mb-3">
                            {getStatusDisplay(match)}
                            <div className="flex items-center gap-2">
                              {/* Cards */}
                              {totalCards > 0 && (
                                <div className="text-xs flex items-center gap-1">
                                  {(match.yellowCards.home + match.yellowCards.away) > 0 && (
                                    <span className="text-yellow-400">🟨{match.yellowCards.home + match.yellowCards.away}</span>
                                  )}
                                  {(match.redCards.home + match.redCards.away) > 0 && (
                                    <span className="text-red-400">🟥{match.redCards.home + match.redCards.away}</span>
                                  )}
                                </div>
                              )}
                              {/* HT Score */}
                              {(match.halftimeHome !== null && match.halftimeAway !== null) && (
                                <span className="text-gray-500 text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                                  HT {match.halftimeHome}-{match.halftimeAway}
                                </span>
                              )}
                              {/* Expand indicator */}
                              <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedMatches.has(match.fixtureId) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>

                          {/* Teams + Score — main row */}
                          <div className="flex items-center gap-3">
                            {/* Home Team */}
                            <div className={`flex items-center gap-2 flex-1 min-w-0 ${homeRecentGoal ? 'goal-flash' : ''}`}>
                              <img 
                                src={match.homeLogo} 
                                alt={match.homeTeam}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex-shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span className="font-semibold text-white text-sm sm:text-base leading-tight">
                                {match.homeTeam}
                              </span>
                            </div>

                            {/* Score — large and prominent */}
                            <div className="flex-shrink-0 min-w-[72px] text-center">
                              {match.status === 'NS' || match.status === 'TBD' ? (
                                <span className="text-gray-500 font-bold text-lg">- : -</span>
                              ) : (
                                <span className="text-white font-black text-2xl sm:text-3xl tabular-nums">
                                  {match.homeGoals ?? 0} <span className="text-gray-500">-</span> {match.awayGoals ?? 0}
                                </span>
                              )}
                            </div>

                            {/* Away Team */}
                            <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${awayRecentGoal ? 'goal-flash' : ''}`}>
                              <span className="font-semibold text-white text-sm sm:text-base leading-tight text-right">
                                {match.awayTeam}
                              </span>
                              <img 
                                src={match.awayLogo} 
                                alt={match.awayTeam}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex-shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          </div>

                          {/* Goal Scorers Row */}
                          {hasGoalScorers && (
                            <div className="flex items-start justify-between gap-3 mt-2 text-[10px] sm:text-xs text-gray-400">
                              <div className="flex-1 text-left leading-relaxed">
                                {homeScorers && <span>⚽ {homeScorers}</span>}
                              </div>
                              <div className="flex-shrink-0 min-w-[72px]"></div>
                              <div className="flex-1 text-right leading-relaxed">
                                {awayScorers && <span>⚽ {awayScorers}</span>}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expanded Event Timeline */}
                        {isExpanded && renderEventTimeline(match)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}