// src/features/directory/ProCard.tsx
import React from 'react';
import { Card } from '../../components/ui/Card';
import { Professional } from '../../types/directory';

interface ProCardProps {
  pro: Professional;
}

export const ProCard: React.FC<ProCardProps> = ({ pro }) => {
  return (
    <Card className="h-full flex flex-col group hover:border-primary/40 transition-all duration-300">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-secondary border border-gray-100 group-hover:scale-105 transition-transform">
          {pro.profile_pic_url ? (
            <img src={pro.profile_pic_url} alt={pro.name} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            <i className="fas fa-user-tie text-2xl opacity-40"></i>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-800 truncate flex items-center gap-1">
            {pro.name}
            {pro.is_verified && <i className="fas fa-check-circle text-primary text-[10px]" title="Verified"></i>}
          </h3>
          <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{pro.category}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <i className="fas fa-location-dot text-[10px]"></i> {pro.city}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-6 flex-grow">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded-lg">
          <i className="fas fa-briefcase text-primary"></i>
          <span>{pro.years_of_experience}+ Years Experience</span>
        </div>
        {pro.bio && (
          <p className="text-xs text-gray-500 italic line-clamp-3 px-1 leading-relaxed">"{pro.bio}"</p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-50 flex gap-2">
        <a 
          href={`tel:${pro.contact_number}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          <i className="fas fa-phone"></i> Call
        </a>
        {pro.whatsapp_number && (
          <a 
            href={`https://wa.me/${pro.whatsapp_number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 flex items-center justify-center bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
          >
            <i className="fab fa-whatsapp text-lg"></i>
          </a>
        )}
      </div>
    </Card>
  );
};