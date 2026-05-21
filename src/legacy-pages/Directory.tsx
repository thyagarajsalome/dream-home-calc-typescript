import React, { useEffect, useState, useCallback } from "react";
import { ProService } from "../services/proService";
import { Professional, ProCategory } from "../types/directory";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";

const CATEGORIES: ProCategory[] = [
  "House Contractor", "Architect", "Plumber", "Electrician", 
  "Floor Layman", "Painter", "Interior Designer", "Draftsman"
];

const Directory = () => {
  const [pros, setPros] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ProCategory | "">("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { showToast } = useToast();

  const fetchPros = useCallback(async (pageNum: number, currentCat: string, currentCity: string) => {
    setLoading(true);
    try {
      const { data, count } = await ProService.getProfessionals(currentCat, currentCity, pageNum);
      if (data) {
        setPros(prev => pageNum === 0 ? data : [...prev, ...data]);
        setHasMore(pros.length + data.length < (count || 0));
      }
    } catch (err: any) {
      showToast("Error loading directory: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, pros.length]);

  useEffect(() => {
    fetchPros(0, category, city);
  }, [category, city]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPros(nextPage, category, city);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-extrabold text-secondary mb-4">Find Verified Professionals</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">Connecting you with the best local experts for your construction and renovation needs.</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
          <select 
            value={category} 
            onChange={(e) => { setCategory(e.target.value as ProCategory); setPage(0); }}
            className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-primary transition-all"
          >
            <option value="">All Professions</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">City</label>
          <input 
            type="text" 
            placeholder="e.g. Bengaluru" 
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(0); }}
            className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pros.map((pro) => (
          <Card key={pro.id} className="group hover:border-primary/40 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden border border-gray-50">
                {pro.profile_pic_url ? (
                  <img src={pro.profile_pic_url} alt={pro.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-secondary/5">
                    <i className="fas fa-user text-2xl"></i>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800 truncate">{pro.name}</h3>
                  {pro.is_verified && <i className="fas fa-check-circle text-primary text-xs" title="Verified Professional"></i>}
                </div>
                <p className="text-primary text-xs font-bold uppercase tracking-wider">{pro.category}</p>
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  <i className="fas fa-location-dot text-[10px]"></i> {pro.city}{pro.area ? `, ${pro.area}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
              <div className="text-center bg-gray-50 p-2 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Experience</p>
                <p className="font-bold text-gray-800 text-sm">{pro.years_of_experience}+ Yrs</p>
              </div>
              <a 
                href={`https://wa.me/${pro.whatsapp_number || pro.contact_number}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
              >
                <i className="fab fa-whatsapp text-sm"></i> WhatsApp
              </a>
            </div>
            
            {pro.bio && <p className="text-xs text-gray-500 mt-4 line-clamp-2 italic">"{pro.bio}"</p>}
          </Card>
        ))}
      </div>

      {pros.length === 0 && !loading && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
           <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
           <p className="text-gray-400 font-medium">No professionals found in this category or city.</p>
        </div>
      )}

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Button onClick={loadMore} variant="outline" isLoading={loading}>
            Load More Professionals
          </Button>
        </div>
      )}
    </div>
  );
};

export default Directory;