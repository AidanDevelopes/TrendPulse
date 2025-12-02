import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Topic, ViewState } from './types';
import { 
  fetchNewsAndPolitics, 
  fetchMemeTrends, 
  fetchGamingTrends, 
  fetchMusicTrends, 
  fetchHipHopTrends,
  fetchBillboardTrends,
  fetchTechTrends,
  fetchLandscapeTrends,
  fetchWildlifeTrends
} from './services/geminiService';
import TopicCard from './components/TopicCard';
import DetailView from './components/DetailView';
import ChatBot from './components/ChatBot';
import { 
  RefreshCw, Zap, Sparkles, AlertCircle, 
  Gamepad2, Ghost, Globe, Music, Cpu, 
  ChevronLeft, ChevronRight, Clock,
  Mic2, PawPrint, Mountain, BarChart3,
  Settings, X, CheckCircle2, Circle, Filter, Bookmark
} from 'lucide-react';

// Cache configuration
const STORAGE_KEY = 'trendpulse_cache_v5';
const SAVED_STORAGE_KEY = 'trendpulse_saved_v1';
const PREFS_KEY = 'trendpulse_preferences';
const REFRESH_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

interface CachedData {
  timestamp: number;
  data: {
    news: Topic[];
    tech: Topic[];
    music: Topic[];
    billboard: Topic[];
    hiphop: Topic[];
    memes: Topic[];
    gaming: Topic[];
    landscapes: Topic[];
    wildlife: Topic[];
  };
}

// Section Configuration
const SECTIONS_CONFIG = [
  { id: 'news', label: "Global News & Politics", icon: Globe, color: "text-blue-400", desc: "World events and politics" },
  { id: 'tech', label: "A.I. & Software Innovation", icon: Cpu, color: "text-cyan-400", desc: "Tech, AI, and code" },
  { id: 'music', label: "Mainstream Music", icon: Music, color: "text-rose-400", desc: "Pop, Rock, and Country" },
  { id: 'billboard', label: "Billboard Charts", icon: BarChart3, color: "text-pink-400", desc: "Chart toppers and records" },
  { id: 'hiphop', label: "Hip-Hop Culture", icon: Mic2, color: "text-amber-400", desc: "Rap, R&B, and trends" },
  { id: 'memes', label: "Gen Alpha & Z Culture", icon: Ghost, color: "text-purple-400", desc: "Memes, slang, and viral trends" },
  { id: 'gaming', label: "Gaming & Entertainment", icon: Gamepad2, color: "text-emerald-400", desc: "Esports, releases, and rumors" },
  { id: 'landscapes', label: "Landscapes & Travel", icon: Mountain, color: "text-teal-400", desc: "Nature and scenery" },
  { id: 'wildlife', label: "Wildlife & Animals", icon: PawPrint, color: "text-orange-400", desc: "Animals and conservation" },
] as const;

type SectionId = typeof SECTIONS_CONFIG[number]['id'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.GRID);
  
  // State for different categories
  const [newsTopics, setNewsTopics] = useState<Topic[]>([]);
  const [techTopics, setTechTopics] = useState<Topic[]>([]);
  const [musicTopics, setMusicTopics] = useState<Topic[]>([]);
  const [billboardTopics, setBillboardTopics] = useState<Topic[]>([]);
  const [hipHopTopics, setHipHopTopics] = useState<Topic[]>([]);
  const [memeTopics, setMemeTopics] = useState<Topic[]>([]);
  const [gamingTopics, setGamingTopics] = useState<Topic[]>([]);
  const [landscapeTopics, setLandscapeTopics] = useState<Topic[]>([]);
  const [wildlifeTopics, setWildlifeTopics] = useState<Topic[]>([]);

  // Saved Topics State
  const [savedTopics, setSavedTopics] = useState<Topic[]>(() => {
    const saved = localStorage.getItem(SAVED_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Preferences State
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(PREFS_KEY);
    const defaults = SECTIONS_CONFIG.reduce((acc, curr) => ({ ...acc, [curr.id]: true }), {} as Record<string, boolean>);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed }; // Merge to ensure new keys exist
      } catch (e) { console.error("Error parsing prefs", e); }
    }
    return defaults;
  });
  const [showSettings, setShowSettings] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Map state to ID for easy rendering
  const sectionDataMap: Record<SectionId, Topic[]> = {
    news: newsTopics,
    tech: techTopics,
    music: musicTopics,
    billboard: billboardTopics,
    hiphop: hipHopTopics,
    memes: memeTopics,
    gaming: gamingTopics,
    landscapes: landscapeTopics,
    wildlife: wildlifeTopics
  };

  // Save preferences when changed
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(visibleSections));
  }, [visibleSections]);

  // Save topics when changed
  useEffect(() => {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedTopics));
  }, [savedTopics]);

  const toggleSection = (id: string) => {
    setVisibleSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSaveTopic = (topic: Topic) => {
    setSavedTopics(prev => {
      const exists = prev.some(t => t.title === topic.title);
      if (exists) {
        return prev.filter(t => t.title !== topic.title);
      } else {
        return [topic, ...prev];
      }
    });
  };

  const isTopicSaved = (topic: Topic) => {
    return savedTopics.some(t => t.title === topic.title);
  };

  const loadTopics = useCallback(async (forceRefresh = false) => {
    setError(null);
    
    // 1. Try loading from cache first (if not forced)
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed: CachedData = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          
          // If cache is valid (less than 8 hours old)
          if (age < REFRESH_INTERVAL) {
            console.log(`Restoring from cache (${Math.round(age / 1000 / 60)} mins old)`);
            setNewsTopics(parsed.data.news || []);
            setTechTopics(parsed.data.tech || []);
            setMusicTopics(parsed.data.music || []);
            setBillboardTopics(parsed.data.billboard || []);
            setHipHopTopics(parsed.data.hiphop || []);
            setMemeTopics(parsed.data.memes || []);
            setGamingTopics(parsed.data.gaming || []);
            setLandscapeTopics(parsed.data.landscapes || []);
            setWildlifeTopics(parsed.data.wildlife || []);
            setLastUpdated(parsed.timestamp);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to parse cache, falling back to fetch", e);
      }
    }

    // 2. Fetch fresh data in batches
    if (!forceRefresh) setLoading(true); 
    
    try {
      // Helper for delay to avoid rate limits
      const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

      // Batch 1: News, Tech (2)
      const [news, tech] = await Promise.all([
        fetchNewsAndPolitics(),
        fetchTechTrends(),
      ]);
      setNewsTopics(news); setTechTopics(tech);

      // Wait 1.5s to let rate limit cool down
      await wait(1500);

      // Batch 2: Music, Billboard, HipHop (3)
      const [music, billboard, hiphop] = await Promise.all([
        fetchMusicTrends(),
        fetchBillboardTrends(),
        fetchHipHopTrends(),
      ]);
      setMusicTopics(music); setBillboardTopics(billboard); setHipHopTopics(hiphop);

      // Wait 1.5s to let rate limit cool down
      await wait(1500);

      // Batch 3: Memes, Gaming (2)
      const [memes, gaming] = await Promise.all([
        fetchMemeTrends(),
        fetchGamingTrends(),
      ]);
      setMemeTopics(memes); setGamingTopics(gaming);

      // Wait 1.5s
      await wait(1500);

      // Batch 4: Landscapes, Wildlife (2)
      const [landscapes, wildlife] = await Promise.all([
        fetchLandscapeTrends(),
        fetchWildlifeTrends()
      ]);
      setLandscapeTopics(landscapes); setWildlifeTopics(wildlife);
      
      const now = Date.now();
      setLastUpdated(now);

      // 3. Save to cache
      const cacheData: CachedData = {
        timestamp: now,
        data: { news, tech, music, billboard, hiphop, memes, gaming, landscapes, wildlife }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

    } catch (e) {
      setError("Failed to load trending topics. Please check your connection.");
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTopics(); 
  }, [loadTopics]);

  // Auto-refresh interval check
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (lastUpdated) {
        const age = Date.now() - lastUpdated;
        if (age >= REFRESH_INTERVAL) {
          console.log("Auto-refreshing topics: 8 hours passed.");
          loadTopics(true);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [lastUpdated, loadTopics]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTopics(true);
  };

  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setView(ViewState.DETAIL);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView(ViewState.GRID);
    setTimeout(() => setSelectedTopic(null), 300);
  };

  // Helper to format "Last updated"
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return "";
    const minutes = Math.floor((Date.now() - lastUpdated) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  if (view === ViewState.DETAIL && selectedTopic) {
    return (
      <DetailView 
        topic={selectedTopic} 
        onBack={handleBack} 
        isSaved={isTopicSaved(selectedTopic)}
        onToggleSave={() => toggleSaveTopic(selectedTopic)}
      />
    );
  }

  const SectionHeader = ({ title, icon: Icon, colorClass }: { title: string, icon: any, colorClass: string }) => (
    <div className="flex items-center gap-3 mb-4 mt-12 px-4 sm:px-0">
      <div className={`p-2 rounded-lg bg-slate-800 ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-white font-display">
        {title}
      </h2>
    </div>
  );

  const TopicCarousel = ({ data, loading }: { data: Topic[], loading: boolean }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeft(scrollLeft > 0);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    useEffect(() => {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, [data]);

    const scroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
        const scrollAmount = 350; // Width of card + gap
        scrollContainerRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    if (loading) {
      return (
        <div className="flex gap-4 overflow-hidden px-4 sm:px-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 min-w-[300px] w-[300px] animate-pulse rounded-2xl bg-slate-800/50 border border-slate-700" />
          ))}
        </div>
      );
    }

    return (
      <div className="relative group">
        {/* Left Scroll Button */}
        {showLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -ml-4 hidden h-12 w-12 items-center justify-center rounded-full bg-slate-800/90 shadow-lg border border-slate-600 text-white hover:bg-slate-700 md:flex transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Scroll Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth hide-scrollbar px-4 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {data.map((topic) => (
            <div key={topic.id} className="min-w-[300px] w-[300px] snap-start flex-shrink-0">
              <TopicCard topic={topic} onClick={handleTopicClick} />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        {showRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 -mr-4 hidden h-12 w-12 items-center justify-center rounded-full bg-slate-800/90 shadow-lg border border-slate-600 text-white hover:bg-slate-700 md:flex transition-opacity opacity-0 group-hover:opacity-100"
             aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    );
  };

  const RenderSection = ({ title, icon, color, data }: { title: string, icon: any, color: string, data: Topic[] }) => (
    <div className="border-b border-white/5 pb-8 last:border-0">
      <SectionHeader title={title} icon={icon} colorClass={color} />
      <TopicCarousel data={data} loading={loading} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[20%] h-[300px] w-[300px] rounded-full bg-cyan-600/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Zap className="h-6 w-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                TrendPulse
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 font-mono">AI-DECODED DAILY</p>
                {lastUpdated && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center text-xs text-indigo-400">
                      <Clock className="mr-1 h-3 w-3" />
                      Updated {getTimeSinceUpdate()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="group flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
              aria-label="Customize Feed"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Customize</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className={`group flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50 ${refreshing ? 'cursor-wait' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden sm:inline">{refreshing ? 'Syncing' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-indigo-400" />
                <h3 className="text-xl font-bold text-white">Customize Your Feed</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="rounded-full p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="mb-4 text-sm text-slate-400">
              Select which topics you want to see on your homepage. Preferences are saved automatically.
            </p>

            <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {SECTIONS_CONFIG.map(section => (
                <button 
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-200 ${
                    visibleSections[section.id] 
                      ? 'border-indigo-500/50 bg-indigo-500/10' 
                      : 'border-slate-700 bg-slate-800/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-lg p-2 transition-colors ${visibleSections[section.id] ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-400'}`}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${visibleSections[section.id] ? 'text-white' : 'text-slate-400'}`}>
                        {section.label}
                      </p>
                      <p className="text-xs text-slate-500">{section.desc}</p>
                    </div>
                  </div>
                  {visibleSections[section.id] 
                    ? <CheckCircle2 className="h-6 w-6 text-indigo-400" />
                    : <Circle className="h-6 w-6 text-slate-600" />
                  }
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="rounded-full bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative mx-auto max-w-[1400px] px-0 sm:px-6 lg:px-8 pb-20">
        <div className="mb-12 mt-8 text-center px-4">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-sm">
            What's dominating the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">internet today?</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Click on a topic to generate an instant AI summary with origin stories, context, and media.
            <br/>
            <span className="text-sm opacity-60 mt-2 block">Topics auto-refresh every 8 hours.</span>
          </p>
        </div>

        {error ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center mx-4">
            <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
            <p className="text-red-200">{error}</p>
            <button 
              onClick={() => loadTopics(true)}
              className="mt-4 text-sm font-bold text-red-400 hover:text-red-300 underline"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* My Stuff Section */}
            {savedTopics.length > 0 && (
              <RenderSection 
                title="My Stuff" 
                icon={Bookmark} 
                color="text-yellow-400" 
                data={savedTopics} 
              />
            )}

            {SECTIONS_CONFIG.map(section => {
              if (!visibleSections[section.id]) return null;
              
              return (
                <RenderSection 
                  key={section.id}
                  title={section.label} 
                  icon={section.icon} 
                  color={section.color} 
                  data={sectionDataMap[section.id]} 
                />
              );
            })}

            {Object.values(visibleSections).every(v => !v) && savedTopics.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Filter className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">No sections selected.</p>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="mt-4 text-indigo-400 hover:text-indigo-300 underline"
                >
                  Customize your feed
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Chatbot Section */}
        {!loading && !error && (
          <ChatBot />
        )}

        {!loading && (
          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-slate-800/50 px-5 py-3 text-sm text-slate-400 border border-slate-700/50 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Powered by Gemini 2.5 Flash & Google Search Grounding</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;