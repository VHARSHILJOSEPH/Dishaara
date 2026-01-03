// server/index.mjs
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import NotificationService from './services/notificationService.js';
// Initialize Firebase
import './firebase/firebase.js';

// Import routes
import authRoutes from './routes/auth.js';
import guideRoutes from './routes/guides.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import vehicleRoutes from './routes/vehicles.js';
import tripPlanRoutes from './routes/tripplans.js';
import adminRoutes from './routes/admin.js';
import guideDashboardRoutes from './routes/guide-dashboard.js';
import paymentRoutes from './routes/payments.js';
import scamRoutes from './routes/scams.js';

// ensure we load server/.env regardless of working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = createServer(app);

// Initialize notification service
const notificationService = new NotificationService(server);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Firebase initialization happens in firebase/firebase.js
// Database connection is handled by Firebase Admin SDK
console.log('✅ Firebase initialized - using Firestore as database');

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const PORT = process.env.PORT || 4000;
const DEBUG = !!process.env.DEBUG_AI;

/** Helper: inclusive ISO date array */
function daysBetween(start, end){
  const s=new Date(start), e=new Date(end);
  const days=[];
  for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){
    days.push(new Date(d).toISOString().slice(0,10));
  }
  return days;
}

/** Extract first top-level JSON object using balanced braces */
function extractJSONFromText(text){
  if(!text || typeof text !== 'string') return null;
  const first = text.indexOf('{');
  if(first === -1) return null;
  let stack = [];
  let startIdx = -1;
  for(let i = first; i < text.length; i++){
    const ch = text[i];
    if(ch === '{'){
      if(stack.length === 0) startIdx = i;
      stack.push('{');
    } else if(ch === '}'){
      stack.pop();
      if(stack.length === 0 && startIdx !== -1){
        const candidate = text.slice(startIdx, i+1);
        try{
          JSON.parse(candidate);
          return candidate;
        }catch(e){
          // continue searching
        }
      }
    }
  }
  return null;
}

/** Basic schema checks returning array of warnings */
function validateSchema(obj, startDate, endDate){
  const warnings=[];
  if(!obj || typeof obj !== 'object') {
    warnings.push('response not an object');
    return warnings;
  }
  if(!obj.city) warnings.push('missing city');
  if(obj.startDate!==startDate) warnings.push(`startDate mismatch (expected ${startDate} got ${obj.startDate})`);
  if(obj.endDate!==endDate) warnings.push(`endDate mismatch (expected ${endDate} got ${obj.endDate})`);
  if(!Array.isArray(obj.days)) warnings.push('days not array');
  else{
    const expected=daysBetween(startDate,endDate);
    if(obj.days.length !== expected.length) warnings.push(`number of days mismatch (expected ${expected.length}, got ${obj.days.length})`);
    for(const day of obj.days){
      if(!day.date) warnings.push('day missing date');
      if(!Array.isArray(day.activities) || day.activities.length===0) warnings.push(`no activities for ${day.date || 'unknown date'}`);
      else {
        for(const a of day.activities){
          if(!a.time) warnings.push(`activity missing time on ${day.date}`);
          if(!a.title) warnings.push(`activity missing title on ${day.date}`);
          if(typeof a.duration_minutes !== 'number' || a.duration_minutes <= 0) warnings.push(`activity has invalid duration on ${day.date}`);
        }
      }
    }
  }
  return warnings;
}

/** Mock itinerary used when no API key provided (fast UI testing) */
function mockItinerary(city, startDate, endDate, options, iterationsUsed=0){
  const days = daysBetween(startDate,endDate).map((date, idx) => ({
    date,
    summary: `Day ${idx+1} highlights`,
    activities: [
      {
        time: "09:00",
        title: `Morning activity ${idx+1}`,
        duration_minutes: 120,
        description: `Enjoy a morning in ${city}.`,
        location: `${city} center`,
        notes: "Walk, book tickets early"
      },
      {
        time: "14:00",
        title: `Afternoon activity ${idx+1}`,
        duration_minutes: 150,
        description: `Afternoon exploring local sights.`,
        location: `${city} museum area`,
        notes: "Public transport or taxi"
      }
    ]
  }));
  return {
    city,
    startDate,
    endDate,
    days,
    metadata: {
      generatedAt: new Date().toISOString(),
      iterations: iterationsUsed,
      warnings: []
    }
  };
}

/** Normalize options from frontend into canonical {theme,style,pace,budget,travelers} */
function normalizeOptions(options = {}) {
  const theme = (options.theme || options.travelMode || options.style || 'city').toString();
  const style =
    options.style ||
    (theme === "beaches" ? "relaxed" :
     theme === "mountains" ? "adventure" :
     theme === "nature" ? "adventure" :
     theme === "cultural" ? "sightseeing" :
     theme === "city" ? "sightseeing" :
     "sightseeing");

  const paceRaw = (options.pace || 'moderate').toString();
  const pace = paceRaw === "active" ? "fast" : (["relaxed","moderate","fast"].includes(paceRaw) ? paceRaw : "moderate");

  const budgetRaw = (options.budget || 'mid').toString();
  const budget =
    budgetRaw === "budget" ? "low" :
    budgetRaw === "luxury" ? "high" :
    (["low","mid","high","moderate"].includes(budgetRaw) ? (budgetRaw === 'moderate' ? 'mid' : budgetRaw) : "mid");

  const travelers = Number.isFinite(options.travelers) ? options.travelers : parseInt(options.travelers || "1", 10);

  return { theme, style, pace, budget, travelers };
}

/** Call AI endpoint (returns { content, raw }) */
async function callAI(prompt){
  if(!AI_API_KEY){
    return { content: null, raw: null };
  }

  let data = null;
  try {
    const res = await axios.post(AI_API_URL, {
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages:[{role:'system', content:'You are an expert travel planner that outputs strict JSON with no commentary.'},{role:'user',content:prompt}],
      temperature:0.2,
      max_tokens: 4000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      }
    });

    data = res.data;
  } catch (e) {
    if(DEBUG) console.error('callAI: failed to parse JSON response from provider', e);
    return { content: null, raw: null };
  }

  if(DEBUG){
    console.log('=== AI RAW RESPONSE ===');
    try{
      console.log(JSON.stringify(data, null, 2).slice(0, 20000));
    }catch(e){
      console.log(String(data).slice(0,20000));
    }
    console.log('=== END AI RAW ===');
  }

  let content = '';
  if(data){
    if(data.choices && data.choices[0] && data.choices[0].message) content = data.choices[0].message.content;
    else if(data.choices && data.choices[0] && data.choices[0].text) content = data.choices[0].text;
  }
  return { content, raw: data };
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trip-plans', tripPlanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guide-dashboard', guideDashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/scams', scamRoutes);

/** Test route */
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: `Server is running on port ${PORT}` });
});

/** Debug route (safe: no key printed) */
app.get('/api/debug', (req, res) => {
  res.json({
    hasApiKey: !!AI_API_KEY,
    aiApiUrl: AI_API_URL || null,
    debugEnabled: DEBUG,
    database: 'Firebase Firestore (connected)'
  });
});

/** Main endpoint */
app.post('/api/ai/trip-planner', async (req,res)=>{
  try{
    const { city, startDate, endDate, options } = req.body;
    if(!city || typeof city!=='string' || city.trim()==='') return res.status(400).json({error:'city is required'});
    if(!startDate || !endDate) return res.status(400).json({error:'startDate and endDate required'});
    const sd=new Date(startDate), ed=new Date(endDate);
    if(isNaN(sd)||isNaN(ed)) return res.status(400).json({error:'invalid date format'});
    if(sd>ed) return res.status(400).json({error:'startDate must be <= endDate'});

    // Mock mode shortcut
    if(!AI_API_KEY){
      return res.json(mockItinerary(city, startDate, endDate, options, 0));
    }

    const daysArr = daysBetween(startDate, endDate);
    const schema = `{
  "city":"City Name",
  "startDate":"YYYY-MM-DD",
  "endDate":"YYYY-MM-DD",
  "days":[
    {
      "date":"YYYY-MM-DD",
      "summary":"Short summary",
      "activities":[
        {
          "time":"HH:MM",
          "title":"Activity title",
          "duration_minutes":90,
          "description":"Short description",
          "location":"Place name / area",
          "notes":"transport, tickets, tips"
        }
      ]
    }
  ],
  "metadata":{
    "generatedAt":"ISO timestamp",
    "iterations": 0,
    "warnings":[]
  }
}`;

    let iterations = 0;
    let final = null;
    let lastWarnings = [];
    let lastRawAI = null;

    // normalize user options for prompt
    const normalized = normalizeOptions(options || {});

    while(iterations < 10){
      iterations++;
      // enhanced prompt: explicitly instruct how to use theme/style/pace/budget/travelers
      const prompt = `You are an expert travel planner. Produce ONE JSON object and NOTHING ELSE that strictly matches this schema:\n${schema}\nCity: ${city}\nDates: ${startDate} to ${endDate}\n\nUser options (normalized):\n- theme: ${normalized.theme}\n- style: ${normalized.style}\n- pace: ${normalized.pace}\n- budget: ${normalized.budget}\n- travelers: ${normalized.travelers}\n\nInterpretation rules (MUST follow):\n1) style (relaxed | sightseeing | adventure):\n   - relaxed -> fewer activities, downtime, low-intensity experiences (beaches, cafes, scenic drives).\n   - sightseeing -> iconic attractions and efficient routing.\n   - adventure -> active/outdoor experiences; include safety notes.\n2) pace (relaxed | moderate | fast):\n   - relaxed -> 1-2 substantive activities/day (longer durations).\n   - moderate -> 2-3 activities/day.\n   - fast -> 3-5 items/day, shorter durations.\n3) budget (low | mid | high):\n   - low -> free/low-cost activities, public transport; include cost tips.\n   - mid -> mix of paid attractions and mid-range dining.\n   - high -> premium options, private transfers or guided experiences.\n4) theme (beaches | mountains | city | nature | cultural): bias activities to fit theme.\n5) Use ISO dates (YYYY-MM-DD) and 24-hour times (HH:MM). duration_minutes must be integer minutes.\n6) Include concise transport notes when travel between sites is needed.\n7) Keep activity titles short (<=6 words) and descriptions 1–2 sentences.\n8) If you cannot fill a day, include a clear warning in metadata.warnings.\n\nReturn only the single JSON object with no explanatory text.`;

      const aiResult = await callAI(prompt);
      const aiResp = aiResult.content;
      lastRawAI = aiResult.raw;

      if(DEBUG) console.log(`Iteration ${iterations} — received content length: ${String(aiResp||'').length}`);

      let parsed = null;
      if(!aiResp){
        lastWarnings.push('ai returned empty response');
      } else {
        const candidate = extractJSONFromText(aiResp);
        if(candidate){
          try{
            parsed = JSON.parse(candidate);
          }catch(e){
            if(DEBUG) {
              console.error('parse error after extract:', e);
            }
            parsed = null;
          }
        } else {
          parsed = null;
        }
      }

      if(parsed){
        const warnings = validateSchema(parsed, startDate, endDate);
        if(warnings.length === 0){
          parsed.metadata = parsed.metadata || {};
          parsed.metadata.generatedAt = new Date().toISOString();
          parsed.metadata.iterations = iterations;
          parsed.metadata.warnings = [];
          final = parsed;
          break;
        }else{
          lastWarnings = warnings;
          // ask for correction
          const correctionPrompt = `The generated JSON has these issues: ${JSON.stringify(warnings)}. Please output corrected JSON strictly matching the schema and fixing these issues. City: ${city}, startDate: ${startDate}, endDate: ${endDate}.`;
          const ai2 = await callAI(correctionPrompt);
          const aiResp2 = ai2.content;
          lastRawAI = ai2.raw;
          if(!aiResp2){
            lastWarnings.push('ai correction returned empty response');
          } else {
            const candidate2 = extractJSONFromText(aiResp2);
            if(candidate2){
              try{
                parsed = JSON.parse(candidate2);
                const w2 = validateSchema(parsed, startDate, endDate);
                if(w2.length === 0){
                  parsed.metadata = parsed.metadata || {};
                  parsed.metadata.generatedAt = new Date().toISOString();
                  parsed.metadata.iterations = iterations;
                  parsed.metadata.warnings = [];
                  final = parsed;
                  break;
                } else {
                  lastWarnings = w2;
                }
              }catch(e){
                if(DEBUG) console.error('parse error on correction:', e);
                lastWarnings.push('correction response not json');
              }
            } else {
              lastWarnings.push('correction response contained no JSON object');
            }
          }
        }
      } else {
        if(DEBUG) {
          console.error('No JSON parsed this iteration. aiResp preview:', String(aiResp||'').slice(0,2000));
        }
        lastWarnings.push('ai returned non-json response');
      }
    } // end loop

    if(!final){
      const rawStr = lastRawAI ? (typeof lastRawAI === 'string' ? lastRawAI : JSON.stringify(lastRawAI).slice(0,5000)) : null;
      return res.status(500).json({
        error: 'Could not generate valid itinerary',
        warnings: lastWarnings,
        iterations,
        lastRawAI: rawStr
      });
    }

    return res.json(final);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

if(process.env.NODE_ENV !== 'test'){
  server.listen(PORT, '0.0.0.0', ()=> {
    console.log('AI Trip Planner server running on',PORT);
    console.log(`🔔 Socket.io notifications enabled`);
  });
}

export default app;
