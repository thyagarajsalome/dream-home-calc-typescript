import React, { useState } from "react";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const CATEGORIES = ["House Contractor", "Architect", "Plumber", "Electrician", "Floor Layman", "Painter", "Interior Designer", "Draftsman"];

export const ProRegistration = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", category: "House Contractor", experience: 0, city: "", area: "", contact: "", whatsapp: "", bio: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast("Please sign in first", "error");
    
    setLoading(true);
    try {
      const { error } = await supabase.from('professionals').insert({
        user_id: user.id, // Links the profile to the registered user
        name: formData.name,
        category: formData.category,
        years_of_experience: formData.experience,
        city: formData.city,
        area: formData.area,
        contact_number: formData.contact,
        whatsapp_number: formData.whatsapp,
        bio: formData.bio,
        is_verified: false // Defaults to unverified until admin review
      });

      if (error) throw error;
      showToast("Profile submitted! It will appear in the directory after verification.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Register as a Professional">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Category</label>
            <select className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Years of Experience" type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: parseInt(e.target.value)})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
          <Input label="Area (Locality)" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
        </div>
        <Input label="Contact Number" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} required />
        <textarea className="w-full p-3 border-2 border-gray-200 rounded-xl h-24" placeholder="Brief Bio / Specializations" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
        <Button type="submit" isLoading={loading} className="w-full">Submit Profile</Button>
      </form>
    </Card>
  );
};