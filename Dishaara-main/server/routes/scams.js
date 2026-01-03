/**
 * Scam Detection Routes
 * Handles AI-based scam detection for travel destinations
 * Uses web scraping and AI analysis to detect real scams
 */

import express from 'express';
import { detectScams, getMockScams } from '../services/scamDetectionService.js';

const router = express.Router();

/**
 * Mock scam database - realistic scam patterns for Indian states/cities
 * In production, this would be replaced with actual AI scraping from:
 * - News articles
 * - Travel advisory websites
 * - Public scam reports
 * - Tourist complaint databases
 */
const SCAM_DATABASE = {
  // Common scams across major tourist destinations
  common: [
    {
      title: "Fake Tour Guide Scam",
      description: "Unlicensed guides approach tourists at popular attractions, offer services, charge exorbitant fees, and disappear without providing promised services.",
      locations: ["Tourist attractions", "Famous landmarks", "Historical sites"],
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Use only government-verified guides with official ID cards",
        "Avoid cash payments upfront - use verified booking platforms",
        "Check guide credentials and reviews before hiring",
        "Be wary of guides approaching you unsolicited"
      ]
    },
    {
      title: "Overpriced Taxi/Rickshaw Scam",
      description: "Taxi and auto-rickshaw drivers charge inflated prices, claim meter is broken, or take longer routes to increase fare.",
      locations: ["Airports", "Train stations", "Tourist areas"],
      targetAudience: "Tourists",
      riskLevel: "Medium",
      safetyTips: [
        "Use ride-sharing apps (Uber, Ola) with fixed pricing",
        "Insist on using the meter in auto-rickshaws",
        "Agree on fare before starting the journey",
        "Research approximate fare costs in advance"
      ]
    },
    {
      title: "Fake Hotel Booking Scam",
      description: "Scammers create fake hotel websites or booking platforms, collect payment, and provide fake confirmation details.",
      locations: ["Online platforms", "Tourist information centers"],
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Book through verified platforms (Booking.com, MakeMyTrip, etc.)",
        "Verify hotel contact details directly before payment",
        "Avoid deals that seem too good to be true",
        "Check website URLs for authenticity"
      ]
    },
    {
      title: "Currency Exchange Scam",
      description: "Unauthorized money changers give incorrect exchange rates, use fake currency, or short-change customers.",
      locations: ["Markets", "Tourist areas", "Unauthorized exchange counters"],
      targetAudience: "Tourists",
      riskLevel: "Medium",
      safetyTips: [
        "Use authorized currency exchange centers or banks",
        "Check exchange rates before transactions",
        "Count money carefully before leaving",
        "Avoid street-side currency exchangers"
      ]
    },
    {
      title: "Fake Ticket Scam",
      description: "Scalpers sell fake or overpriced tickets to popular attractions, events, or transportation.",
      locations: ["Popular attractions", "Train stations", "Event venues"],
      targetAudience: "Tourists and locals",
      riskLevel: "High",
      safetyTips: [
        "Buy tickets only from official counters or websites",
        "Verify ticket authenticity before payment",
        "Avoid purchasing from unauthorized vendors",
        "Book in advance through official channels"
      ]
    },
    {
      title: "Gemstone/Jewelry Scam",
      description: "Shopkeepers sell fake or overpriced gemstones and jewelry, claiming they are valuable investments with export certificates.",
      locations: ["Jewelry shops", "Markets", "Tourist areas"],
      targetAudience: "Tourists",
      riskLevel: "Medium",
      safetyTips: [
        "Avoid purchasing expensive jewelry without proper certification",
        "Get items appraised by independent gemologists",
        "Be skeptical of 'too good to be true' deals",
        "Research before making expensive purchases"
      ]
    },
    {
      title: "Phony Travel Agency Scam",
      description: "Fake travel agencies offer attractive tour packages, collect advance payments, and disappear without providing services.",
      locations: ["Online", "Tourist areas", "Shopping malls"],
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Verify travel agency license and registration",
        "Check online reviews and ratings",
        "Avoid paying large amounts upfront",
        "Use verified travel booking platforms"
      ]
    }
  ],
  // Location-specific scams
  mumbai: [
    {
      title: "Gateway of India Touts",
      description: "Aggressive touts at Gateway of India offer boat rides, tours, or photos at exorbitant prices with false promises.",
      locations: ["Gateway of India", "Colaba Causeway"],
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Ignore unsolicited offers from touts",
        "Book boat rides through authorized vendors only",
        "Be firm but polite when declining offers",
        "Research prices before visiting"
      ]
    },
    {
      title: "Local Train Ticket Scam",
      description: "Scalpers sell fake or used train tickets to unsuspecting tourists at railway stations.",
      locations: ["CST Station", "Churchgate Station", "Bandra Station"],
      targetAudience: "Tourists",
      riskLevel: "Medium",
      safetyTips: [
        "Purchase tickets only from official ticket counters",
        "Use mobile ticketing apps (UTS, IRCTC)",
        "Verify ticket validity before boarding",
        "Avoid purchasing from unauthorized sellers"
      ]
    }
  ],
  delhi: [
    {
      title: "Red Fort Area Scam",
      description: "Touts in Red Fort area offer guided tours, sell fake artifacts, or charge for unauthorized services.",
      locations: ["Red Fort", "Chandni Chowk", "Jama Masjid"],
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Use only authorized guides with ID cards",
        "Ignore aggressive touts and vendors",
        "Keep valuables secure in crowded areas",
        "Purchase entry tickets from official counters"
      ]
    },
    {
      title: "Airlines Ticket Scam",
      description: "Fake travel agents at airport areas sell fake airline tickets or charge hidden fees.",
      locations: ["Airport areas", "Paharganj", "Connaught Place"],
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Book flights through airline websites or verified platforms",
        "Verify booking confirmation directly with airlines",
        "Avoid last-minute bookings from unknown agents",
        "Check for hidden charges before payment"
      ]
    }
  ],
  goa: [
    {
      title: "Beach Vendor Scam",
      description: "Beach vendors aggressively sell overpriced items, claim items are 'free gifts' then demand payment, or sell fake goods.",
      locations: ["Popular beaches", "Beach shacks"],
      targetAudience: "Tourists",
      riskLevel: "Medium",
      safetyTips: [
        "Politely decline unsolicited items",
        "Negotiate prices before accepting anything",
        "Avoid accepting 'free' items that later require payment",
        "Shop at established stores for better prices"
      ]
    },
    {
      title: "Water Sports Scam",
      description: "Unauthorized water sports operators charge exorbitant prices, provide substandard equipment, or skip safety measures.",
      locations: ["Beach areas", "Water sports zones"],
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Use only licensed water sports operators",
        "Verify operator credentials and safety records",
        "Check equipment condition before activities",
        "Agree on prices and inclusions in writing"
      ]
    }
  ],
  rajasthan: [
    {
      title: "Camel Safari Scam",
      description: "Desert safari operators in Rajasthan charge hidden fees, provide shorter rides than promised, or overcharge for photos.",
      locations: ["Jaisalmer", "Jodhpur", "Pushkar"],
      targetAudience: "Tourists",
      riskLevel: "Medium",
      safetyTips: [
        "Book through verified tour operators",
        "Clarify all costs and inclusions upfront",
        "Get written confirmation of services",
        "Research standard prices before booking"
      ]
    },
    {
      title: "Hotel Booking at Forts",
      description: "Touts near historical forts claim hotels are full and redirect tourists to overpriced or substandard accommodations.",
      locations: ["Jaisalmer Fort", "Mehrangarh Fort", "City Palace areas"],
      targetAudience: "Tourists",
      riskLevel: "Medium",
      safetyTips: [
        "Book accommodations in advance through verified platforms",
        "Ignore claims about hotels being full",
        "Verify hotel details independently",
        "Use reputable booking websites"
      ]
    }
  ]
};

/**
 * Generate location-specific scams based on city and state
 * Simulates AI-based detection by matching location with known scam patterns
 */
function generateScamResults(state, city) {
  const results = [];
  const cityLower = city.toLowerCase().trim();
  const stateLower = state.toLowerCase().trim();
  
  // Check for city-specific scams
  const cityScams = SCAM_DATABASE[cityLower] || [];
  cityScams.forEach(scam => {
    results.push({
      id: `city-${cityLower}-${scam.title.toLowerCase().replace(/\s+/g, '-')}`,
      ...scam,
      location: `${scam.locations[0] || city}, ${state}`
    });
  });
  
  // Add common scams (most destinations have these)
  const commonScams = SCAM_DATABASE.common || [];
  commonScams.forEach((scam, index) => {
    // Include 3-5 common scams randomly
    if (Math.random() > 0.3) {
      results.push({
        id: `common-${cityLower}-${index}`,
        ...scam,
        location: `${city}, ${state}`
      });
    }
  });
  
  // Add location-specific variations based on state
  if (stateLower.includes('maharashtra') || cityLower.includes('mumbai') || cityLower.includes('pune')) {
    const mumbaiScams = SCAM_DATABASE.mumbai || [];
    mumbaiScams.forEach(scam => {
      if (!results.find(r => r.title === scam.title)) {
        results.push({
          id: `maharashtra-${cityLower}-${scam.title.toLowerCase().replace(/\s+/g, '-')}`,
          ...scam,
          location: `${city}, ${state}`
        });
      }
    });
  }
  
  if (stateLower.includes('delhi') || cityLower.includes('delhi') || cityLower.includes('new delhi')) {
    const delhiScams = SCAM_DATABASE.delhi || [];
    delhiScams.forEach(scam => {
      if (!results.find(r => r.title === scam.title)) {
        results.push({
          id: `delhi-${cityLower}-${scam.title.toLowerCase().replace(/\s+/g, '-')}`,
          ...scam,
          location: `${city}, ${state}`
        });
      }
    });
  }
  
  if (stateLower.includes('goa')) {
    const goaScams = SCAM_DATABASE.goa || [];
    goaScams.forEach(scam => {
      if (!results.find(r => r.title === scam.title)) {
        results.push({
          id: `goa-${cityLower}-${scam.title.toLowerCase().replace(/\s+/g, '-')}`,
          ...scam,
          location: `${city}, ${state}`
        });
      }
    });
  }
  
  if (stateLower.includes('rajasthan') || cityLower.includes('jaipur') || cityLower.includes('udaipur') || cityLower.includes('jaisalmer')) {
    const rajasthanScams = SCAM_DATABASE.rajasthan || [];
    rajasthanScams.forEach(scam => {
      if (!results.find(r => r.title === scam.title)) {
        results.push({
          id: `rajasthan-${cityLower}-${scam.title.toLowerCase().replace(/\s+/g, '-')}`,
          ...scam,
          location: `${city}, ${state}`
        });
      }
    });
  }
  
  // Limit results to 5-8 scams for better UX
  return results.slice(0, Math.min(8, results.length));
}

/**
 * POST /api/scams/detect
 * Detects scams in a given location using web scraping and AI analysis
 * 
 * Body: { state: string, city: string }
 * Response: { scams: ScamResult[], source: 'real' | 'mock' }
 */
router.post('/detect', async (req, res) => {
  try {
    const { state, city } = req.body;
    
    // Validate input
    if (!state || !city) {
      return res.status(400).json({
        error: 'State and city are required',
        scams: []
      });
    }
    
    let scams = [];
    let source = 'mock';
    
    try {
      // Try real web scraping and AI analysis
      console.log(`Attempting real scam detection for ${city}, ${state}`);
      scams = await detectScams(state, city);
      
      if (scams && scams.length > 0) {
        source = 'real';
        console.log(`Successfully detected ${scams.length} scams via web scraping`);
      } else {
        // Fall back to mock data if no scams found
        console.log('No scams found via scraping, using mock data as fallback');
        scams = getMockScams(state, city);
        source = 'mock';
      }
    } catch (scrapingError) {
      console.error('Web scraping failed, using mock data:', scrapingError.message);
      // Fall back to mock data on error
      scams = getMockScams(state, city);
      source = 'mock';
    }
    
    res.json({
      success: true,
      scams: scams,
      location: {
        state,
        city
      },
      source: source, // Indicates whether data came from real scraping or mock
      detectedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scam detection error:', error);
    
    // Final fallback to mock data even on unexpected errors
    try {
      const { state, city } = req.body;
      const fallbackScams = getMockScams(state || 'Unknown', city || 'Unknown');
      
      res.json({
        success: true,
        scams: fallbackScams,
        location: {
          state: state || 'Unknown',
          city: city || 'Unknown'
        },
        source: 'mock',
        detectedAt: new Date().toISOString(),
        warning: 'Using fallback data due to an error'
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: 'Failed to detect scams. Please try again.',
        scams: []
      });
    }
  }
});

export default router;

