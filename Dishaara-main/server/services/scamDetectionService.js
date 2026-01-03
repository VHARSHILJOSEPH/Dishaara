/**
 * Enhanced Scam Detection Service
 * Performs comprehensive web scraping from verified sources and AI analysis
 * Focuses on tourist places and negative reviews to identify real scams
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

/**
 * Call AI API with improved error handling
 */
async function callAI(messages, maxTokens = 4000) {
  if (!AI_API_KEY) {
    console.warn('AI_API_KEY not configured');
    return null;
  }

  try {
    const response = await axios.post(AI_API_URL, {
      model: AI_MODEL,
      messages: messages,
      temperature: 0.3,
      max_tokens: maxTokens
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      }
    });

    const data = response.data;
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    }
    return null;
  } catch (error) {
    if (error.response) {
      console.error(`AI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error('AI API call failed:', error.message);
    }
    return null;
  }
}

/**
 * Scrape content from a URL with improved parsing
 */
async function scrapeURL(url, userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36') {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, nav, header, footer, aside, .ad, .advertisement').remove();

    // Extract main content with priority selectors
    const contentSelectors = [
      'article',
      '.review-text',
      '.review-content',
      '.user-review',
      '.comment-content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main .content',
      '.main-content',
      '#content',
      '.review-body',
      '[itemprop="reviewBody"]',
      '.review'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 50) {
            content += text + '\n\n';
          }
        });
        if (content.length > 500) break;
      }
    }

    // Fallback to body if no structured content found
    if (content.length < 500) {
      $('script, style').remove();
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();
    return content.length > 100 ? content : null;
  } catch (error) {
    if (error.code !== 'ECONNABORTED' && error.name !== 'AbortError') {
      console.error(`Error scraping ${url}:`, error.message);
    }
    return null;
  }
}

/**
 * Get tourist places for a city using AI
 */
async function getTouristPlaces(city, state) {
  if (!AI_API_KEY) {
    // Fallback to common tourist places if no AI
    return getDefaultTouristPlaces(city);
  }

  try {
    const prompt = `List the top 8-10 most famous tourist attractions, landmarks, and places in ${city}, ${state}, India. Include:
- Historical monuments/temples
- Popular markets/shopping areas
- Beaches/parks if applicable
- Airports/railway stations
- Famous squares/areas

Return ONLY a JSON array of place names, nothing else: ["Place 1", "Place 2", ...]`;

    const messages = [
      {
        role: 'system',
        content: 'You are a travel expert. Output only valid JSON arrays with no additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await callAI(messages, 1000);
    if (response) {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const places = JSON.parse(jsonMatch[0]);
          if (Array.isArray(places) && places.length > 0) {
            return places;
          }
        } catch (e) {
          console.error('Failed to parse tourist places:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error getting tourist places:', error);
  }

  return getDefaultTouristPlaces(city);
}

/**
 * Default tourist places if AI fails
 */
function getDefaultTouristPlaces(city) {
  const cityLower = city.toLowerCase();
  const defaults = {
    'mumbai': ['Gateway of India', 'Marine Drive', 'Juhu Beach', 'Elephanta Caves', 'Colaba Causeway', 'Chhatrapati Shivaji Terminus'],
    'delhi': ['Red Fort', 'India Gate', 'Qutub Minar', 'Lotus Temple', 'Chandni Chowk', 'Jama Masjid', 'Humayun\'s Tomb'],
    'goa': ['Calangute Beach', 'Baga Beach', 'Anjuna Beach', 'Basilica of Bom Jesus', 'Dudhsagar Falls', 'Old Goa'],
    'jaipur': ['Hawa Mahal', 'City Palace', 'Amber Fort', 'Jantar Mantar', 'Nahargarh Fort', 'Birla Temple'],
    'bangalore': ['Lalbagh Botanical Garden', 'Cubbon Park', 'Bangalore Palace', 'ISKCON Temple', 'UB City'],
    'chennai': ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'San Thome Basilica', 'Guindy National Park'],
    'kolkata': ['Victoria Memorial', 'Howrah Bridge', 'Dakshineswar Kali Temple', 'Indian Museum', 'Park Street'],
    'hyderabad': ['Charminar', 'Golconda Fort', 'Hussain Sagar Lake', 'Salar Jung Museum', 'Ramoji Film City'],
    'pune': ['Shaniwar Wada', 'Aga Khan Palace', 'Sinhagad Fort', 'Dagdusheth Halwai Ganapati Temple'],
    'udaipur': ['City Palace', 'Lake Pichola', 'Jag Mandir', 'Saheliyon Ki Bari', 'Monsoon Palace']
  };

  for (const [key, places] of Object.entries(defaults)) {
    if (cityLower.includes(key)) {
      return places;
    }
  }

  return ['City Center', 'Main Market', 'Popular Tourist Area'];
}

/**
 * Search for reviews and scam complaints using DuckDuckGo
 */
async function searchForReviews(queries) {
  const results = [];
  
  for (const query of queries) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
      
      const content = await scrapeURL(searchUrl);
      if (content && content.length > 300) {
        results.push({
          query,
          content: content.substring(0, 5000) // Limit per result
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error searching for "${query}":`, error.message);
    }
  }

  return results;
}

/**
 * Scrape reviews and scam reports for tourist places
 */
async function scrapeTouristPlaceScams(city, state, touristPlaces) {
  const allContent = [];
  
  // Create comprehensive search queries for each tourist place
  // Focus on negative reviews, complaints, and scam reports
  const queries = [];
  
  // Tourist place-specific queries with focus on negative reviews
  for (const place of touristPlaces.slice(0, 5)) { // Limit to 5 places
    // Search for negative reviews and scams at specific places
    queries.push(
      `"${place}" "${city}" bad review OR scam OR fraud site:tripadvisor.com`,
      `"${place}" "${city}" 1 star OR 2 star review complaint`,
      `"${place}" "${city}" fake guide OR overcharge OR cheating`,
      `tourist scam "${place}" "${city}" "${state}"`,
      `"${place}" "${city}" pickpocket OR theft OR warning`,
      `avoid "${place}" "${city}" tourist scam OR fraud`
    );
  }

  // General city-level queries targeting verified sources
  queries.push(
    `tourist scams "${city}" "${state}" India site:tripadvisor.com reviews`,
    `"${city}" travel fraud OR cheating tourists site:google.com reviews`,
    `common scams "${city}" "${state}" tourists avoid reviews`,
    `"${city}" tourist safety warnings complaints site:reddit.com`,
    `"${city}" "${state}" tourist complaints scams reviews`,
    `travel advisory "${city}" "${state}" scams warnings`
  );

  console.log(`Searching ${queries.length} queries for scams and negative reviews...`);
  const searchResults = await searchForReviews(queries.slice(0, 20)); // Limit to 20 queries
  
  // Combine all content with source indicators
  for (const result of searchResults) {
    allContent.push(`=== Search Query: ${result.query} ===\n${result.content}`);
  }

  const combined = allContent.join('\n\n---RESULT BREAK---\n\n');
  console.log(`📄 Total scraped content: ${combined.length} characters`);
  
  return combined;
}

/**
 * Advanced AI analysis to extract scams from reviews and complaints
 */
async function analyzeScamsWithAI(scrapedContent, city, state, touristPlaces) {
  if (!AI_API_KEY) {
    return [];
  }

  try {
    const systemPrompt = `You are an expert in travel safety and scam detection. You analyze reviews, complaints, and reports to identify real scams happening to tourists.

Your task:
1. Read negative reviews and complaints carefully
2. Identify scam patterns (overcharging, fake services, theft, fraud, misleading information)
3. Group similar complaints into common scam types
4. Ignore irrelevant complaints (cleanliness, weather, crowd size, personal preferences)
5. Extract specific tourist locations where scams occur
6. Provide actionable safety tips

Focus on:
- Financial scams (overcharging, fake pricing, hidden fees)
- Service scams (fake guides, fake tickets, fake bookings)
- Theft/pickpocketing
- Fraudulent services
- Misleading information
`;

    const userPrompt = `You are analyzing scraped content containing reviews, complaints, and reports about scams in ${city}, ${state}, India.

Tourist Places Analyzed: ${touristPlaces.join(', ')}

INSTRUCTIONS:
1. Focus on negative reviews (1-2 star ratings), complaints, and scam reports
2. Extract real scams mentioned by actual tourists
3. Ignore general complaints about cleanliness, weather, crowds, or personal preferences
4. Look for: overcharging, fake services, theft, fraud, misleading information, pickpocketing
5. Group similar scam reports together
6. Identify the specific tourist location where each scam occurs

Scraped Content (reviews, complaints, scam reports from verified sources):
${scrapedContent.substring(0, 15000)}

Analyze this content and extract ONLY real scams with evidence. For each unique scam:

Output ONLY a valid JSON array in this exact format:
[
  {
    "title": "Clear scam name",
    "touristLocation": "Specific place/area where scam occurs",
    "scamType": "Type (e.g., 'Tour Guide Scam', 'Pricing Fraud', 'Theft', 'Fake Service')",
    "description": "Detailed description based on actual complaints/reviews",
    "commonPattern": ["Pattern 1", "Pattern 2", "Pattern 3"],
    "riskLevel": "High/Medium/Low",
    "targetAudience": "Tourists/Locals/Both",
    "safetyTips": ["Specific tip 1", "Specific tip 2", "Specific tip 3", "Specific tip 4"]
  }
]

CRITICAL RULES:
- ONLY include scams with clear evidence from the scraped reviews/complaints
- If no scams are mentioned in the content, return empty array []
- touristLocation MUST be the specific place/area mentioned (e.g., "Gateway of India", "Charminar area", "Airport taxi stand")
- description MUST reference actual complaints/reviews from the content
- commonPattern should list the exact way the scam happens based on reviews
- safetyTips must be actionable, specific, and based on what reviewers suggest
- IGNORE: complaints about cleanliness, food quality, weather, crowds (unless scam-related)
- FOCUS ON: financial fraud, fake services, theft, overcharging, misleading information
- Group similar complaints into one scam entry
- Prioritize high-frequency scams mentioned multiple times

Output ONLY the JSON array, no explanatory text.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await callAI(messages, 4000);
    if (!response) {
      return [];
    }

    // Extract JSON array
    let jsonStr = response.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const scams = JSON.parse(jsonStr);
      if (Array.isArray(scams)) {
        // Deduplicate similar scams
        return deduplicateScams(scams);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Response preview:', response.substring(0, 500));
    }

    return [];
  } catch (error) {
    console.error('AI analysis error:', error);
    return [];
  }
}

/**
 * Deduplicate similar scams
 */
function deduplicateScams(scams) {
  const seen = new Map();
  const unique = [];

  for (const scam of scams) {
    const key = scam.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(scam);
    } else {
      // Merge with existing if very similar
      const existing = unique.find(s => 
        s.title.toLowerCase().replace(/[^a-z0-9]/g, '') === key
      );
      if (existing) {
        // Merge patterns and tips
        existing.commonPattern = [...new Set([...existing.commonPattern, ...scam.commonPattern])];
        existing.safetyTips = [...new Set([...existing.safetyTips, ...scam.safetyTips])];
      }
    }
  }

  // Sort by risk level (High first)
  const riskOrder = { High: 3, Medium: 2, Low: 1 };
  unique.sort((a, b) => (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0));

  return unique;
}

/**
 * Main function to detect scams with comprehensive scraping
 */
export async function detectScams(state, city) {
  const location = { state, city };

  try {
    console.log(`🔍 Starting comprehensive scam detection for ${city}, ${state}`);

    // Step 1: Get tourist places
    console.log('📍 Identifying tourist places...');
    const touristPlaces = await getTouristPlaces(city, state);
    console.log(`Found ${touristPlaces.length} tourist places:`, touristPlaces.join(', '));

    // Step 2: Scrape reviews and scam reports for tourist places
    console.log('🌐 Scraping reviews and scam reports...');
    const scrapedContent = await scrapeTouristPlaceScams(city, state, touristPlaces);

    if (!scrapedContent || scrapedContent.length < 500) {
      console.log('⚠️ Insufficient scraped content');
      return [];
    }

    console.log(`📊 Scraped ${scrapedContent.length} characters of content`);

    // Step 3: Analyze with AI
    console.log('🤖 Analyzing content with AI...');
    const scams = await analyzeScamsWithAI(scrapedContent, city, state, touristPlaces);

    if (scams && scams.length > 0) {
      // Format and add IDs
      const formattedScams = scams.map((scam, index) => ({
        id: `scam-${city.toLowerCase().replace(/\s+/g, '-')}-${index}-${Date.now()}`,
        title: scam.title || 'Unknown Scam',
        description: scam.description || '',
        location: scam.touristLocation || `${city}, ${state}`,
        targetAudience: scam.targetAudience || 'Tourists',
        riskLevel: scam.riskLevel || 'Medium',
        safetyTips: Array.isArray(scam.safetyTips) ? scam.safetyTips : [],
        commonPattern: Array.isArray(scam.commonPattern) ? scam.commonPattern : [],
        scamType: scam.scamType || 'General Scam'
      }));

      console.log(`✅ Successfully detected ${formattedScams.length} unique scams`);
      return formattedScams.slice(0, 12); // Limit to 12 scams
    }

    console.log('⚠️ No scams detected after analysis');
    return [];

  } catch (error) {
    console.error('❌ Error in detectScams:', error);
    throw error;
  }
}

/**
 * Fallback mock data (only used if AI is completely unavailable)
 */
export function getMockScams(state, city) {
  return [
    {
      id: `fallback-${city.toLowerCase()}-1`,
      title: "Fake Tour Guide Scam",
      description: "Unlicensed guides approach tourists at popular attractions, offer services, charge exorbitant fees, and disappear without providing promised services.",
      location: `${city}, ${state}`,
      targetAudience: "Tourists",
      riskLevel: "High",
      safetyTips: [
        "Use only government-verified guides with official ID cards",
        "Avoid cash payments upfront - use verified booking platforms",
        "Check guide credentials and reviews before hiring",
        "Be wary of guides approaching you unsolicited"
      ],
      commonPattern: [],
      scamType: "Tour Guide Scam"
    }
  ];
}
