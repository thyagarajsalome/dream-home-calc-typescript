// src/features/directory/DirectoryPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProService } from '../../services/proService';
import { Professional } from '../../types/directory';
import { ProCard } from './ProCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import SEO from '../../components/layout/SEO';

const GROUPED_CATEGORIES: Record<string, string[]> = {
  "Design & Planning": ["3D Designer / Visualizer", "Architect", "Draftsman", "Structural Engineer"],
  "Construction & Structure": ["Borewell Contractor", "Fabricator (Grill/Gate)", "House Contractor", "Material Vendor", "Waterproofing Specialist"],
  "Essential Services": ["Electrician", "Plumber", "Solar / UPS Vendor"],
  "Finishing & Interiors": ["Carpenter", "Floor Layman", "Interior Designer", "Painter", "Windows & Door Contractor"]
};

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
      <SEO title="Verified Professionals - HDE" description="Find verified architects, contractors, and experts for your home construction." />
      
      {/* ADDED: Back to Home Link */}
      <div className="mb-6">
        <Link to="/" className="text-xs font-bold text-gray-400 hover:text-primary inline-flex items-center gap-2 transition-colors uppercase tracking-widest">
          <i className="fas fa-arrow-left"></i> Back to Home
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left max-w-2xl">
          <h1 className="text-4xl font-extrabold text-secondary mb-2 mt-2">Find Verified Professionals</h1>
          <p className="text-gray-600">Connect with the best experts in your city to build your dream home.</p>
        </div>
        <Link 
          to="/register-pro" 
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-yellow-600 transition-all whitespace-nowrap"
        >
          <i className="fas fa-user-plus"></i>
          Manage My Listing
        </Link>
      </div>

      {/* Search Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest ml-1">Professional Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/50 text-sm focus:border-primary focus:bg-white outline-none transition-all"
            >
              <option value="">All Experts</option>
              {Object.entries(GROUPED_CATEGORIES).map(([group, cats]) => (
                <optgroup label={group} key={group}>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              ))}
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
            <Button type="submit" isLoading={loading} className="w-full py-4 shadow-xl shadow-primary/20">
              <i className="fas fa-search mr-2"></i> Search
            </Button>
          </div>
        </form>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pros.length > 0 ? (
          pros.map(pro => <ProCard key={pro.id} pro={pro} />)
        ) : !loading && (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-3xl">
            <i className="fas fa-search text-3xl mb-3 opacity-20"></i>
            <p>No professionals found matching your criteria.</p>
          </div>
        )}
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