import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Topic, DetailedInfo } from '../types';
import { fetchTopicDetails } from '../services/geminiService';
import { ArrowLeft, ExternalLink, Loader2, PlayCircle, Image as ImageIcon, Share2, Check } from 'lucide-react';

interface DetailViewProps {
  topic: Topic;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

const DetailView: React.FC<DetailViewProps> = ({ topic, onBack, isSaved, onToggleSave }) => {
  const [info, setInfo] = useState<DetailedInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadDetails = async () => {
      setLoading(true);
      const data = await fetchTopicDetails(topic.title);
      if (mounted) {
        setInfo(data);
        setLoading(false);
      }
    };
    loadDetails();
    return () => { mounted = false; };
  }, [topic]);

  return (
    <div className="min-h-screen w-full bg-slate-900 pb-20 animate-fade-in">
      {/* Hero Header */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0">
           <img 
            src={topic.imageUrl} 
            alt={topic.title}
            className="h-full w-full object-cover blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/80 to-slate-900" />
        </div>
        
        <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-start">
            <button 
              onClick={onBack}
              className="w-fit flex items-center gap-2 rounded-full bg-slate-800/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Trends
            </button>

            {/* Save to My Stuff Checkbox */}
            <div 
              onClick={onToggleSave}
              className="flex items-center gap-2 cursor-pointer group bg-slate-800/40 backdrop-blur-md px-3 py-2 rounded-xl hover:bg-slate-800/60 transition-colors border border-white/5"
            >
              <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSaved ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 group-hover:border-white'}`}>
                {isSaved && <Check size={14} className="text-white" />}
              </div>
              <span className={`text-sm font-medium transition-colors ${isSaved ? 'text-indigo-200' : 'text-slate-200 group-hover:text-white'}`}>
                Save to My Stuff
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
              {topic.category.toUpperCase()}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight drop-shadow-xl">
              {topic.title}
            </h1>
            <p className="max-w-2xl text-lg text-slate-200 drop-shadow-md">
              {topic.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 -mt-10 relative z-10">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl bg-slate-800/50 backdrop-blur-sm border border-slate-700">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-400 animate-pulse">Consulting the digital oracle...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* AI Summary Card */}
            <div className="rounded-3xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-md">
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <span className="hidden" {...props} />, // Hide H1 as it is in hero
                    h2: ({node, ...props}) => <h2 className="text-indigo-400 mt-8 mb-4 flex items-center gap-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-4" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-indigo-200 font-bold" {...props} />,
                  }}
                >
                  {info?.markdown || ''}
                </ReactMarkdown>
              </div>
            </div>

            {/* Sources / Media Grid */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-indigo-400" />
                Verified Sources & Media
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {info?.sourceLinks.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-750 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                      {idx % 2 === 0 ? <PlayCircle className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                        {link.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {new URL(link.uri).hostname}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
                
                {(!info?.sourceLinks || info.sourceLinks.length === 0) && (
                   <div className="col-span-full p-4 text-center text-slate-500 italic">
                     No direct media links found for this topic.
                   </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center pt-8">
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                    <Share2 className="w-4 h-4" /> Share this summary
                </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default DetailView;