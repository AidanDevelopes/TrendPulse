import { GoogleGenAI } from "@google/genai";
import { Topic, DetailedInfo, SourceLink } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate content with retry logic for 429 errors
const generateContentWithRetry = async (model: string, params: any, retries = 3): Promise<any> => {
  try {
    return await ai.models.generateContent({
      model,
      ...params
    });
  } catch (error: any) {
    // Check for 429 (Resource Exhausted) or 503 (Service Unavailable)
    if (retries > 0 && (error.status === 429 || error.code === 429 || error.status === 503)) {
      const waitTime = 2000 * (4 - retries); // 2s, 4s, 6s backoff
      console.warn(`Rate limit hit. Retrying in ${waitTime}ms... (${retries} retries left)`);
      await delay(waitTime);
      return generateContentWithRetry(model, params, retries - 1);
    }
    throw error;
  }
};

// Helper function to fetch and parse topics based on a specific prompt
const fetchTopicsByCategory = async (prompt: string, categoryPrefix: string, fallbackData: Topic[]): Promise<Topic[]> => {
  try {
    const response = await generateContentWithRetry(
      "gemini-2.5-flash", 
      {
        contents: prompt + " Return them in a strict format where each line represents one topic using this pattern: 'TOPIC_START|Title|Category|Short engaging tagline|TOPIC_END'. Do not add any other text.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      }
    );

    const text = response.text || "";
    const topics: Topic[] = [];
    
    // Parse the strict text format
    const lines = text.split('\n');
    const regex = /TOPIC_START\|(.*?)\|(.*?)\|(.*?)\|TOPIC_END/;

    lines.forEach((line, index) => {
      const match = line.match(regex);
      if (match) {
        topics.push({
          id: `${categoryPrefix}-${index}-${Date.now()}`,
          title: match[1].trim(),
          category: match[2].trim(),
          description: match[3].trim(),
          imageUrl: `https://picsum.photos/seed/${match[1].replace(/\s/g, '') + categoryPrefix}/600/400` // Deterministic random image
        });
      }
    });

    // If API returned structured data but empty (rare), use fallback
    if (topics.length === 0) return fallbackData;
    
    // Return up to 10 topics for the horizontal scroll
    return topics.slice(0, 10);

  } catch (error) {
    console.error(`Error fetching ${categoryPrefix} topics:`, error);
    // Return fallback data silently if all retries fail
    return fallbackData;
  }
};

// 1. News & Politics (General News, US Politics)
export const fetchNewsAndPolitics = () => fetchTopicsByCategory(
  "Identify 8-10 major trending topics in General News and US Politics today. Focus on headlines, legislation, or major global events.",
  "news",
  [
    { id: 'f-news-1', title: 'Global Summit 2024', category: 'Politics', description: 'World leaders gather to discuss climate and trade.', imageUrl: 'https://picsum.photos/seed/Summit/600/400' },
    { id: 'f-news-2', title: 'Economic Shift', category: 'Economy', description: 'New inflation data impacts global markets.', imageUrl: 'https://picsum.photos/seed/Economy/600/400' },
    { id: 'f-news-3', title: 'Tech Regulation', category: 'Policy', description: 'Congress discusses new bills for AI safety.', imageUrl: 'https://picsum.photos/seed/Congress/600/400' },
    { id: 'f-news-4', title: 'Space Mission', category: 'Science', description: 'Historic landing on the lunar south pole.', imageUrl: 'https://picsum.photos/seed/Moon/600/400' },
    { id: 'f-news-5', title: 'Election Update', category: 'Politics', description: 'Latest polling numbers show a tight race.', imageUrl: 'https://picsum.photos/seed/Vote/600/400' },
    { id: 'f-news-6', title: 'Urban Renewal', category: 'Infrastructure', description: 'Major cities announce green energy plans.', imageUrl: 'https://picsum.photos/seed/City/600/400' },
  ]
);

// 2. Mainstream Music (Pop, Rock - General)
export const fetchMusicTrends = () => fetchTopicsByCategory(
  "Identify 8-10 trending topics in Mainstream Pop, Rock, and Country music today. Focus on artist news, tours, gossip, and new album announcements. Exclude Hip-Hop.",
  "music",
  [
    { id: 'f-music-1', title: 'Pop Star Return', category: 'Mainstream', description: 'Legendary artist announces surprise tour.', imageUrl: 'https://picsum.photos/seed/Microphone/600/400' },
    { id: 'f-music-2', title: 'Indie Breakout', category: 'Alternative', description: 'Underground band hits mainstream success.', imageUrl: 'https://picsum.photos/seed/Guitar/600/400' },
    { id: 'f-music-3', title: 'Award Snubs', category: 'Awards', description: 'Fans outrage over recent nominations.', imageUrl: 'https://picsum.photos/seed/Trophy/600/400' },
    { id: 'f-music-4', title: 'Festival Lineup', category: 'Live', description: 'Summer festival headliners revealed.', imageUrl: 'https://picsum.photos/seed/Festival/600/400' },
    { id: 'f-music-5', title: 'Country Crossover', category: 'Country', description: 'Country hit goes viral globally.', imageUrl: 'https://picsum.photos/seed/Banjo/600/400' },
    { id: 'f-music-6', title: 'Supergroup Formed', category: 'Rock', description: 'Famous rockers unite for new project.', imageUrl: 'https://picsum.photos/seed/Drum/600/400' },
  ]
);

// 3. Billboard Charts
export const fetchBillboardTrends = () => fetchTopicsByCategory(
  "Identify 8-10 trending topics specifically related to Billboard Charts (Hot 100, 200), Chart Toppers, Number 1 hits, and broken records today.",
  "billboard",
  [
    { id: 'f-bb-1', title: 'New #1 Hit', category: 'Hot 100', description: 'The song that just dethroned the reigning champion.', imageUrl: 'https://picsum.photos/seed/Chart1/600/400' },
    { id: 'f-bb-2', title: 'Record Breaker', category: 'History', description: 'Artist breaks record for most weeks at top.', imageUrl: 'https://picsum.photos/seed/Record/600/400' },
    { id: 'f-bb-3', title: 'Album Debut', category: 'Billboard 200', description: 'Massive first-week sales numbers released.', imageUrl: 'https://picsum.photos/seed/Album/600/400' },
    { id: 'f-bb-4', title: 'Sleeper Hit', category: 'Rising', description: 'Song from last year suddenly enters Top 10.', imageUrl: 'https://picsum.photos/seed/ArrowUp/600/400' },
    { id: 'f-bb-5', title: 'Global 200', category: 'World', description: 'K-Pop group dominates global streaming charts.', imageUrl: 'https://picsum.photos/seed/GlobeMusic/600/400' },
    { id: 'f-bb-6', title: 'Longest Running', category: 'Legacy', description: 'Track spends 52 weeks on the chart.', imageUrl: 'https://picsum.photos/seed/Calendar/600/400' },
  ]
);

// 4. Hip-Hop (Rap, R&B, Culture)
export const fetchHipHopTrends = () => fetchTopicsByCategory(
  "Identify 8-10 trending topics in Hip-Hop, Rap, and R&B today. Focus on new album releases, artist news, viral tracks, and culture.",
  "hiphop",
  [
    { id: 'f-hh-1', title: 'Viral Rap Beef', category: 'Hip-Hop', description: 'Diss tracks exchange heats up between titans.', imageUrl: 'https://picsum.photos/seed/Rap/600/400' },
    { id: 'f-hh-2', title: 'New Album Drop', category: 'Release', description: 'Highly anticipated album dominates streaming.', imageUrl: 'https://picsum.photos/seed/Vinyl/600/400' },
    { id: 'f-hh-3', title: 'Producer Tag', category: 'Production', description: 'The producer tag everyone is hearing right now.', imageUrl: 'https://picsum.photos/seed/Beat/600/400' },
    { id: 'f-hh-4', title: 'Fashion Week', category: 'Culture', description: 'Rappers taking over the runway in Paris.', imageUrl: 'https://picsum.photos/seed/Fashion/600/400' },
    { id: 'f-hh-5', title: 'Underground King', category: 'Rising', description: 'SoundCloud rapper breaks into mainstream.', imageUrl: 'https://picsum.photos/seed/Mic/600/400' },
    { id: 'f-hh-6', title: 'Classic Sample', category: 'History', description: '90s hit sampled in top charting song.', imageUrl: 'https://picsum.photos/seed/Boombox/600/400' },
  ]
);

// 5. Tech & AI (Software, Development, AI)
export const fetchTechTrends = () => fetchTopicsByCategory(
  "Identify 8-10 trending topics in AI Software Development, LLM improvements, and general Tech innovation. Focus on new tools, breakthroughs, or major releases.",
  "tech",
  [
    { id: 'f-tech-1', title: 'Next-Gen Models', category: 'AI', description: 'The latest LLM benchmarks shatter expectations.', imageUrl: 'https://picsum.photos/seed/Robot/600/400' },
    { id: 'f-tech-2', title: 'Dev Tools 2.0', category: 'Software', description: 'How coding assistants are changing development.', imageUrl: 'https://picsum.photos/seed/Code/600/400' },
    { id: 'f-tech-3', title: 'Quantum Leap', category: 'Innovation', description: 'New breakthrough in quantum computing stability.', imageUrl: 'https://picsum.photos/seed/Quantum/600/400' },
    { id: 'f-tech-4', title: 'VR Headset War', category: 'Hardware', description: 'Competitors launch affordable mixed reality gear.', imageUrl: 'https://picsum.photos/seed/VR/600/400' },
    { id: 'f-tech-5', title: 'Open Source Wins', category: 'Community', description: 'Major corporation open sources key library.', imageUrl: 'https://picsum.photos/seed/Linux/600/400' },
    { id: 'f-tech-6', title: 'Cybersecurity Alert', category: 'Security', description: 'New zero-day vulnerability affects millions.', imageUrl: 'https://picsum.photos/seed/Lock/600/400' },
  ]
);

// 6. Gen Alpha / Gen Z Memes
export const fetchMemeTrends = () => fetchTopicsByCategory(
  "Identify 8-10 currently trending Gen Alpha and Gen Z memes, slang, or viral TikTok trends active today. Focus on 'brainrot', viral sounds, or new formats.",
  "meme",
  [
    { id: 'f-meme-1', title: 'Skibidi Variants', category: 'Viral', description: 'The endless evolution of the toilet head phenomenon.', imageUrl: 'https://picsum.photos/seed/Toilet/600/400' },
    { id: 'f-meme-2', title: 'Fanum Tax', category: 'Slang', description: 'The internet culture of food sharing and theft.', imageUrl: 'https://picsum.photos/seed/Food/600/400' },
    { id: 'f-meme-3', title: 'Corecore', category: 'Aesthetic', description: 'Nihilistic video collages taking over TikTok.', imageUrl: 'https://picsum.photos/seed/Mood/600/400' },
    { id: 'f-meme-4', title: 'NPC Streaming', category: 'Live', description: 'Creators acting like video game characters.', imageUrl: 'https://picsum.photos/seed/NPC/600/400' },
    { id: 'f-meme-5', title: 'Grimace Shake', category: 'Throwback', description: 'The purple drink horror trend returns.', imageUrl: 'https://picsum.photos/seed/Shake/600/400' },
    { id: 'f-meme-6', title: 'Roman Empire', category: 'Discussion', description: 'How often do men think about the Roman Empire?', imageUrl: 'https://picsum.photos/seed/Roman/600/400' },
  ]
);

// 7. Gaming
export const fetchGamingTrends = () => fetchTopicsByCategory(
  "Identify 8-10 currently trending topics in Gaming, Esports, Twitch/YouTube streaming, or game releases.",
  "gaming",
  [
    { id: 'f-game-1', title: 'GTA VI Leaks', category: 'Rumor', description: 'Analyzing the latest frame-by-frame details.', imageUrl: 'https://picsum.photos/seed/GTA/600/400' },
    { id: 'f-game-2', title: 'Esports Finals', category: 'Esports', description: 'Record-breaking viewership at the latest major.', imageUrl: 'https://picsum.photos/seed/Esports/600/400' },
    { id: 'f-game-3', title: 'Indie Gems', category: 'Release', description: 'The steam hit everyone is playing this week.', imageUrl: 'https://picsum.photos/seed/Indie/600/400' },
    { id: 'f-game-4', title: 'Console Refresh', category: 'Hardware', description: 'Rumors of a "Pro" console upgrade swirl.', imageUrl: 'https://picsum.photos/seed/Console/600/400' },
    { id: 'f-game-5', title: 'Speedrun Record', category: 'Community', description: 'Classic game beaten in under 5 minutes.', imageUrl: 'https://picsum.photos/seed/Timer/600/400' },
    { id: 'f-game-6', title: 'RPG Expansion', category: 'DLC', description: 'Massive update drops for popular RPG.', imageUrl: 'https://picsum.photos/seed/Dragon/600/400' },
  ]
);

// 8. Landscapes (Nature, Travel, Scenery)
export const fetchLandscapeTrends = () => fetchTopicsByCategory(
  "Identify 8-10 trending topics related to Landscapes, Nature Photography, Travel Destinations, and Natural Phenomena (like Auroras). Exclude specific animal stories.",
  "landscape",
  [
    { id: 'f-land-1', title: 'Northern Lights', category: 'Phenomenon', description: 'Solar storms create spectacular views globally.', imageUrl: 'https://picsum.photos/seed/Aurora/600/400' },
    { id: 'f-land-2', title: 'Hidden Beaches', category: 'Travel', description: 'The secret summer destinations trending now.', imageUrl: 'https://picsum.photos/seed/Beach/600/400' },
    { id: 'f-land-3', title: 'Volcanic Eruption', category: 'News', description: 'Live streams of lava flows captivate millions.', imageUrl: 'https://picsum.photos/seed/Volcano/600/400' },
    { id: 'f-land-4', title: 'Autumn Foliage', category: 'Season', description: 'Best spots to see the leaves change color.', imageUrl: 'https://picsum.photos/seed/Forest/600/400' },
    { id: 'f-land-5', title: 'Desert Bloom', category: 'Rare', description: 'Rare rainfall creates flowers in the desert.', imageUrl: 'https://picsum.photos/seed/Desert/600/400' },
    { id: 'f-land-6', title: 'Mountain Pass', category: 'Adventure', description: 'Dangerous but beautiful road opens for season.', imageUrl: 'https://picsum.photos/seed/Mountain/600/400' },
  ]
);

// 9. Wildlife (Animals, Conservation)
export const fetchWildlifeTrends = () => fetchTopicsByCategory(
  "Identify 8-10 trending topics related to Wildlife, Animals, Zoos, and Pets. Focus on viral animal moments (like Moo Deng), conservation news, or new species.",
  "wildlife",
  [
    { id: 'f-wild-1', title: 'Viral Pygmy Hippo', category: 'Zoo', description: 'The internet falls in love with a new zoo icon.', imageUrl: 'https://picsum.photos/seed/Hippo/600/400' },
    { id: 'f-wild-2', title: 'Rare Bird Sighting', category: 'Discovery', description: 'Extinct bird possibly spotted in rainforest.', imageUrl: 'https://picsum.photos/seed/Bird/600/400' },
    { id: 'f-wild-3', title: 'Panda Return', category: 'Conservation', description: 'Pandas arriving at new sanctuary.', imageUrl: 'https://picsum.photos/seed/Panda/600/400' },
    { id: 'f-wild-4', title: 'Cat Distribution', category: 'Viral', description: 'How stray cats choose their owners.', imageUrl: 'https://picsum.photos/seed/Cat/600/400' },
    { id: 'f-wild-5', title: 'Whale Migration', category: 'Ocean', description: 'Massive pod sighted near coast.', imageUrl: 'https://picsum.photos/seed/Whale/600/400' },
    { id: 'f-wild-6', title: 'Dog Hero', category: 'News', description: 'Local dog saves family from fire.', imageUrl: 'https://picsum.photos/seed/Dog/600/400' },
  ]
);

export const fetchTopicDetails = async (topicTitle: string): Promise<DetailedInfo> => {
  try {
    const response = await generateContentWithRetry(
      "gemini-2.5-flash",
      {
        contents: `Provide a comprehensive "Know Your Meme" / Encyclopedia style summary for the trending topic: "${topicTitle}". 
      
      Structure the response in Markdown with these sections:
      # ${topicTitle}
      ## Origin
      (Where and when did this start? Who started it? Link to original video descriptions if possible.)
      ## Meaning & Context
      (What does it mean? Why is it trending now?)
      ## Impact/Reception
      (How are people reacting? Is there controversy?)
      
      Make it engaging and informative.
      `,
        config: {
          tools: [{ googleSearch: {} }],
        },
      }
    );

    const text = response.text || "No details available.";
    
    // Extract grounding chunks for links
    const sourceLinks: SourceLink[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sourceLinks.push({
            title: chunk.web.title || "Web Source",
            uri: chunk.web.uri,
          });
        }
      });
    }

    return {
      markdown: text,
      sourceLinks: sourceLinks.slice(0, 6), // Limit to top 6 links
    };

  } catch (error) {
    console.error("Error fetching topic details:", error);
    return {
      markdown: "## Error\nUnable to fetch details at this time. Please try again later.",
      sourceLinks: []
    };
  }
};

// Chatbot response fetcher
export const fetchChatResponse = async (message: string): Promise<string> => {
  try {
    const response = await generateContentWithRetry(
      "gemini-2.5-flash",
      {
        contents: [
          {
            role: "user",
            parts: [{ text: `You are a helpful TrendPulse AI assistant. Users use this app to see trending topics.
            The user is asking a question about a topic that might not be in the pre-loaded lists.
            Answer their query using Google Search grounding to get the absolute latest info.
            Keep the answer concise (under 100 words) and engaging.
            
            User Query: ${message}` }]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }],
        },
      }
    );
    return response.text || "I couldn't find anything on that right now.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I'm having trouble connecting to the network right now.";
  }
};
