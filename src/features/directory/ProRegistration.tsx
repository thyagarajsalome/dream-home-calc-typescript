// src/features/directory/ProRegistration.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const CATEGORIES = ["House Contractor", "Architect", "Plumber", "Electrician", "Floor Layman", "Painter", "Interior Designer", "Draftsman"];

const INDIAN_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad", "Mysore", "Gurgaon", "Aligarh", "Jalandhar", "Bhubaneswar", "Noida", "Kochi"].sort();

export const ProRegistration = () => {
  const { user, loading: authLoading } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", category: "House Contractor", years_of_experience: 0, 
    city: "", area: "", contact_number: "", whatsapp_number: "", bio: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setFormData(data);
        setIsExisting(true);
      }
    };
    if (!authLoading) loadProfile();
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast("Session expired. Please sign in again.", "error");
    
    setLoading(true);
    try {
      const payload = { ...formData, user_id: user.id };
      const { error } = isExisting 
        ? await supabase.from('professionals').update(payload).eq('user_id', user.id)
        : await supabase.from('professionals').insert(payload);

      if (error) throw error;
      showToast(isExisting ? "Profile updated!" : "Profile submitted for verification!", "success");
      setIsExisting(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm("Are you sure you want to delete your professional profile? This action cannot be undone.");
    if (!isConfirmed || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('professionals').delete().eq('user_id', user.id);
      if (error) throw error;
      
      showToast("Listing deleted successfully.", "success");
      navigate("/directory");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="p-20 text-center font-bold text-gray-400">Verifying session...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-10">
      <Link to="/" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-2 transition-colors uppercase tracking-widest">
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>

      <Card title={isExisting ? "Manage Your Listing" : "Register as a Professional"}>
        {isExisting && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-red-800 uppercase tracking-tight">Close Public Listing</p>
              <p className="text-[10px] text-red-600 mt-0.5">This will permanently remove your profile from the directory.</p>
            </div>
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={loading}
              className="px-4 py-2 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              {loading ? "Removing..." : "Delete Profile"}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Full Name / Business Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase ml-1">Professional Category</label>
              <select className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/30 text-sm focus:border-primary outline-none focus:bg-white transition-all" 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Years of Experience" type="number" value={formData.years_of_experience} onChange={e => setFormData({...formData, years_of_experience: parseInt(e.target.value) || 0})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase ml-1">City</label>
              <select className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/30 text-sm focus:border-primary outline-none focus:bg-white transition-all" 
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required>
                <option value="">Select City</option>
                {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <Input label="Area (Locality)" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="e.g. Whitefield" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Contact Number" icon="fas fa-phone" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} required />
            <Input label="WhatsApp Number" icon="fab fa-whatsapp" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase ml-1">Professional Bio & Services</label>
            <textarea className="w-full p-4 border-2 border-gray-100 rounded-xl h-32 text-sm focus:border-primary outline-none resize-none bg-gray-50/30 focus:bg-white transition-all" 
              placeholder="Describe your specializations and major projects..." 
              value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>

          <Button type="submit" isLoading={loading} className="w-full py-4 text-lg shadow-xl shadow-primary/20">
            {isExisting ? "Update Profile Details" : "Submit Profile for Verification"}
          </Button>
          
          <p className="text-[10px] text-center text-gray-400">
            * Verified badge is awarded after our team validates your contact details and experience.
          </p>
        </form>
      </Card>
    </div>
  );
};

export default ProRegistration;