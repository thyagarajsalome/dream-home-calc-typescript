// src/features/directory/DirectoryPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ProService } from '../../services/proService';
import { Professional } from '../../types/directory';
import { ProCard } from './ProCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';


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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="container mx-auto px-4 py-8">
      
      {/* ADDED: Back to Home Link */}
      <div className="mb-6">
        <Link to="/" className="text-xs font-bold text-gray-400 dark:text-zinc-500 hover:text-primary inline-flex items-center gap-2 transition-colors uppercase tracking-widest">
          <i className="fas fa-arrow-left"></i> Back to Home
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left max-w-2xl">
          <h1 className="text-4xl font-extrabold text-secondary dark:text-zinc-100 mb-2 mt-2">Find Verified Professionals</h1>
          <p className="text-gray-600 dark:text-zinc-400">Connect with the best experts in your city to build your dream home.</p>
        </div>
        <Link 
          to="/register-pro" 
          className="inline-flex items-center gap-2 bg-primary text-white dark:text-zinc-950 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-primary-hover transition-all whitespace-nowrap"
        >
          <i className="fas fa-user-plus"></i>
          Manage My Listing
        </Link>
      </div>

      {/* Search Filters */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 mb-10">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4 relative" ref={dropdownRef}>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-2 uppercase tracking-widest ml-1">Professional Category</label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between p-3.5 border-2 border-gray-100 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-150 text-sm hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 focus:border-primary dark:focus:border-primary outline-none transition-all text-left font-semibold"
            >
              <span className="flex items-center gap-2.5">
                <i className="fas fa-briefcase text-gray-400 dark:text-zinc-500"></i>
                {category || "All Experts"}
              </span>
              <i className={`fas fa-chevron-down text-gray-400 dark:text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`}></i>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-72 overflow-y-auto custom-scrollbar py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between font-bold ${
                      category === '' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-805/50'
                    }`}
                  >
                    <span>All Experts</span>
                    {category === '' && <i className="fas fa-check text-xs text-primary"></i>}
                  </button>
                  
                  {Object.entries(GROUPED_CATEGORIES).map(([group, cats]) => (
                    <div key={group} className="mt-2 border-t border-gray-100/60 dark:border-zinc-800/60 pt-2">
                      <div className="px-4 py-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                        {group}
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {cats.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCategory(c);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-6 py-2 text-sm transition-all flex items-center justify-between ${
                              category === c 
                                ? 'bg-primary/10 text-primary font-bold' 
                                : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-805/50'
                            }`}
                          >
                            <span>{c}</span>
                            {category === c && <i className="fas fa-check text-xs text-primary"></i>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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