// New scoring rules component
import React from 'react';

const ScoringRules = () => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span>🎯</span> New Scoring Rules
      </h3>

      {/* Main Rules */}
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">📋 How to Play</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong className="text-white">1X2 Result pick is required:</strong> Home / Draw / Away</li>
            <li>• <strong className="text-white">Correct Score (CS) is optional</strong> - enter exact score or skip</li>
            <li>• <strong className="text-white">1 Booster per match day</strong> - doubles 1X2 points only</li>
            <li>• <strong className="text-white">Predictions lock 5 minutes before kickoff</strong></li>
          </ul>
        </div>

        {/* 1X2 Scoring */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">⚽ 1X2 Result Scoring</h4>
          <div className="text-sm text-gray-300 mb-3">
            Points awarded based on locked average odds for your pick:
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">1.01 – 1.24:</span>
              <span className="text-green-400 font-semibold">1 pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">1.25 – 1.59:</span>
              <span className="text-green-400 font-semibold">2 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">1.60 – 1.99:</span>
              <span className="text-green-400 font-semibold">3 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">2.00 – 2.49:</span>
              <span className="text-blue-400 font-semibold">4 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">2.50 – 3.24:</span>
              <span className="text-blue-400 font-semibold">5 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">3.25 – 4.49:</span>
              <span className="text-purple-400 font-semibold">6 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">4.50+:</span>
              <span className="text-yellow-400 font-semibold">7 pts</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1">
              <span className="text-red-400">Wrong 1X2:</span>
              <span className="text-red-400 font-semibold">-1 pt</span>
            </div>
          </div>
        </div>

        {/* CS Bonus */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">🎯 Correct Score Bonus</h4>
          <div className="text-sm text-gray-300 mb-3">
            Optional exact score prediction (bonus based on total goals):
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">0 goals (0-0):</span>
                <span className="text-yellow-400 font-semibold">+4 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">1-3 goals:</span>
                <span className="text-green-400 font-semibold">+3 pts</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">4-6 goals:</span>
                <span className="text-blue-400 font-semibold">+5 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">7+ goals:</span>
                <span className="text-purple-400 font-semibold">+7 pts</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-400 space-y-1">
            <div>• Correct exact score = bonus points</div>
            <div>• Wrong exact score = <span className="text-red-400">-1 point</span></div>
            <div>• Skip exact score = <span className="text-gray-300">0 points (no penalty)</span></div>
          </div>
        </div>

        {/* Booster */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">⚡ Match Day Booster</h4>
          <div className="text-sm text-gray-300 space-y-2">
            <div>• <strong>1 booster per match day</strong> (tied to the fixture date, not the day you submit)</div>
            <div>• <strong>Doubles 1X2 points only</strong> (not CS bonus or penalties)</div>
            <div>• You can move it to another match on the same day by removing it first</div>
            <div>• Use wisely on high-odds picks for maximum benefit</div>
          </div>
        </div>

        {/* Starting Points */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">🏁 Starting Points</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <div>• New players start with <strong className="text-green-400">20 points</strong></div>
            <div>• Points can go negative</div>
            <div>• Build your score through smart predictions!</div>
          </div>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-3">📊 Examples</h4>
        <div className="text-sm space-y-3">
          <div>
            <div className="text-white font-medium">Scenario 1: Safe Pick + Booster</div>
            <div className="text-gray-300 text-xs mt-1">
              Predict Home @ 1.60 odds with booster + Skip CS → 
              <span className="text-green-400 font-semibold ml-1">6 points</span> (3 pts × 2)
            </div>
          </div>
          
          <div>
            <div className="text-white font-medium">Scenario 2: Risky Pick + Correct Score</div>
            <div className="text-gray-300 text-xs mt-1">
              Predict Away @ 4.20 odds + Correct 2-1 score → 
              <span className="text-blue-400 font-semibold ml-1">9 points</span> (6 pts + 3 pts CS bonus)
            </div>
          </div>
          
          <div>
            <div className="text-white font-medium">Scenario 3: Wrong Pick</div>
            <div className="text-gray-300 text-xs mt-1">
              Wrong 1X2 + Wrong CS → 
              <span className="text-red-400 font-semibold ml-1">-2 points</span> (-1 + -1)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoringRules;