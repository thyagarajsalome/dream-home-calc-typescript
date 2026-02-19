import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords = "house construction cost calculator india, building estimate calculator, home interior cost, plumbing cost estimator, electrical wiring cost calculator, civil engineering estimating tool", 
  image 
}) => {
  const { pathname } = useLocation();
  const baseUrl = "https://www.homedesignenglish.com";
  const canonicalUrl = `${baseUrl}${pathname}`;
  const ogImage = image || `${baseUrl}/icon-512x512.png`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      {/* ... keeping the rest of your social graph meta tags ... */}
    </Helmet>
  );
};

export default SEO;