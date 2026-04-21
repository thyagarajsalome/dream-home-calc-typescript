import React, { useState, useEffect } from 'react';
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
        setHasMore(pros.length + data.length < (count || 0));
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
      
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-secondary mb-4">Find Verified Professionals</h1>
        <p className="text-gray-600">Connect with the best experts in your city to build your dream home.</p>
      </div>

      {/* Search Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Profession</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-sm focus:border-primary outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <Input 
            label="City (e.g. Bengaluru)" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            className="mb-0"
          />
          <Button type="submit" isLoading={loading} className="w-full">Search</Button>
        </form>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pros.map(pro => <ProCard key={pro.id} pro={pro} />)}
      </div>

      {hasMore && pros.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button onClick={() => fetchPros()} variant="outline" isLoading={loading}>
            Load More
          </Button>
        </div>
      )}

      {!loading && pros.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 font-medium">No professionals found in this category or city yet.</p>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;