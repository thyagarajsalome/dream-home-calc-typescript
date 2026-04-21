// src/features/directory/DirectoryPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProService } from '../../services/proService';
import { Professional, ProCategory } from '../../types/directory';
import { ProCard } from './ProCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import SEO from '../../components/layout/SEO';

const CATEGORIES: ProCategory[] = [
  'House Contractor', 'Architect', 'Plumber', 'Electrician', 
  'Floor Layman', 'Painter', 'Interior Designer', 'Draftsman'
];

const DirectoryPage = () => {
  const [pros, setPros] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPros = async (isNewSearch = false) => {
    try {
      setLoading(true);
      const currentPage = isNewSearch ? 0 : page;
      const { data, count } = await ProService.getProfessionals(category, city, currentPage);
      
      if (data) {
        setPros(prev => isNewSearch ? data : [...prev, ...data]);
        setHasMore((isNewSearch ? 0 : pros.length) + data.length < (count || 0));
        if (!isNewSearch) setPage(currentPage + 1);
      }
    } catch (err) {
      console.error("Failed to fetch professionals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPros(true); }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPros(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <SEO title="Verified Professionals - HDE" description="Find verified architects, contractors, and plumbers for your home construction." />
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left max-w-2xl">
          <h1 className="text-4xl font-extrabold text-secondary mb-2">Find Verified Professionals</h1>
          <p className="text-gray-600">Connect with the best experts in your city to build your dream home.</p>
        </div>
        <Link 
          to="/register-pro" 
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-yellow-600 transition-all whitespace-nowrap"
        >
          <i className="fas fa-user-plus"></i>
          Join as a Professional
        </Link>
      </div>

      {/* Search Filters - Enhanced Alignment */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest ml-1">Professional Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-sm focus:border-primary focus:bg-white outline-none transition-all"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="md:col-span-5">
            <Input 
              label="City (e.g. Bengaluru)" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
              className="mb-0" 
              icon="fas fa-location-dot"
            />
          </div>
          <div className="md:col-span-3">
            <Button type="submit" isLoading={loading} className="w-full py-4 shadow-lg shadow-primary/20">
              <i className="fas fa-search mr-2"></i> Search
            </Button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pros.map(pro => <ProCard key={pro.id} pro={pro} />)}
      </div>

      {hasMore && pros.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button onClick={() => fetchPros()} variant="outline" isLoading={loading}>
            Load More Professionals
          </Button>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;