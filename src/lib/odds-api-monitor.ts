// Odds API monitoring utility
export function checkOddsApiRateLimit(response: Response) {
  const remaining = response.headers.get('x-requests-remaining');
  
  if (remaining) {
    const remainingCount = parseInt(remaining, 10);
    
    // Log warning when requests drop below 100
    if (remainingCount < 100) {
      console.warn(`⚠️ Odds API rate limit warning: ${remainingCount} requests remaining`);
      
      // If critically low (< 25), log as error
      if (remainingCount < 25) {
        console.error(`🚨 Odds API rate limit critical: Only ${remainingCount} requests remaining!`);
      }
    }
    
    // Always log the count for monitoring
    console.log(`📊 Odds API requests remaining: ${remainingCount}`);
    
    return remainingCount;
  }
  
  return null;
}

export function logOddsApiUsage(endpoint: string, remainingRequests: number | null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    endpoint,
    remaining_requests: remainingRequests,
    warning: remainingRequests !== null && remainingRequests < 100,
    critical: remainingRequests !== null && remainingRequests < 25,
  };
  
  console.log('Odds API Usage:', JSON.stringify(logEntry));
  
  return logEntry;
}