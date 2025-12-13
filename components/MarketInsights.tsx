import React, { useState } from 'react';
import { Search, Globe, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { getMarketInsights } from '../services/gemini';
import { InsightResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Card, Button, Input } from './ui/DesignSystem';
import { containerVariants, itemVariants } from '../lib/utils';

const MarketInsights: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await getMarketInsights(query);
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto flex flex-col h-full min-h-[500px]">
      <div className="text-center mb-10 space-y-3">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Market Insights</h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">Get real-time data on salaries, in-demand skills, and hiring trends.</p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-12">
        <div className="relative group">
          <Search className="absolute left-5 top-4 w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Senior Product Designer salary in New York"
            className="w-full bg-white border border-slate-300 text-slate-900 pl-12 pr-32 py-4 rounded-xl shadow-lg shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg placeholder:text-slate-400"
          />
          <div className="absolute right-2 top-2 bottom-2">
            <Button type="submit" disabled={loading || !query.trim()} className="h-full rounded-lg px-6 shadow-md shadow-brand-600/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Research"}
            </Button>
          </div>
        </div>
      </form>

      {result ? (
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="p-8 border-slate-200 bg-white shadow-md">
            <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-slate-600 prose-a:text-brand-600 hover:prose-a:text-brand-700">
              <ReactMarkdown>{result.text}</ReactMarkdown>
            </div>
          </Card>

          {result.sources.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all group"
                >
                  <div className="mt-0.5 w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 group-hover:bg-brand-100 transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">{source.title}</p>
                    <p className="text-xs text-slate-400 truncate">{source.uri}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                </a>
              ))}
            </div>
          )}
        </motion.div>
      ) : !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50 py-12">
          <BookOpen className="w-16 h-16 stroke-1" />
          <p>Enter a query above to start researching.</p>
        </div>
      )}
    </motion.div>
  );
};

export default MarketInsights;