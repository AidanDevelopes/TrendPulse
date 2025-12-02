import React from 'react';
import { Topic } from '../types';
import { ArrowRight, TrendingUp } from 'lucide-react';

interface TopicCardProps {
  topic: Topic;
  onClick: (topic: Topic) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onClick }) => {
  return (
    <div 
      onClick={() => onClick(topic)}
      className="group relative h-64 w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20"
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <img 
          src={topic.imageUrl} 
          alt={topic.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-300 backdrop-blur-sm border border-indigo-500/30">
            {topic.category}
          </span>
          <span className="flex items-center text-xs text-slate-400">
            <TrendingUp className="mr-1 h-3 w-3" /> Trending
          </span>
        </div>
        
        <h3 className="mb-2 font-bold text-xl text-white leading-tight group-hover:text-indigo-200 transition-colors">
          {topic.title}
        </h3>
        
        <p className="line-clamp-2 text-sm text-slate-300 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          {topic.description}
        </p>

        <div className="mt-4 flex items-center text-xs font-semibold text-indigo-400 opacity-0 -translate-x-4 transition-all duration-300 delay-75 group-hover:opacity-100 group-hover:translate-x-0">
          DECODE TREND <ArrowRight className="ml-1 h-3 w-3" />
        </div>
      </div>
    </div>
  );
};

export default TopicCard;