import React from 'react';
import { Card } from '../../components/ui/Card';
import { Professional } from '../../types/directory';

interface ProCardProps {
  pro: Professional;
}

export const ProCard: React.FC<ProCardProps> = ({ pro }) => {
  return (
    <Card className="h-full flex flex-col hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-secondary">
            {pro.profile_pic_url ? (
              <img src={pro.profile_pic_url} alt={pro.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <i className="fas fa-user-tie text-xl"></i>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 leading-tight">
              {pro.name}
              {pro.is_verified && (
                <i className="fas fa-check-circle text-primary ml-2" title="Verified Professional"></i>
              )}
            </h3>
            <p className="text-xs text-primary font-bold uppercase tracking-wider">{pro.category}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6 flex-grow">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="fas fa-briefcase w-4 text-gray-400"></i>
          <span>{pro.years_of_experience}+ Years Experience</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="fas fa-map-marker-alt w-4 text-gray-400"></i>
          <span>{pro.area ? `${pro.area}, ` : ''}{pro.city}</span>
        </div>
        {pro.bio && (
          <p className="text-xs text-gray-500 mt-3 line-clamp-2 italic">"{pro.bio}"</p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
        <a 
          href={`tel:${pro.contact_number}`}
          className="flex items-center justify-center gap-2 py-2 bg-gray-50 text-secondary text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
        >
          <i className="fas fa-phone"></i> Call
        </a>
        {pro.whatsapp_number && (
          <a 
            href={`https://wa.me/${pro.whatsapp_number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 bg-green-50 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors"
          >
            <i className="fab fa-whatsapp"></i> WhatsApp
          </a>
        )}
      </div>
    </Card>
  );
};