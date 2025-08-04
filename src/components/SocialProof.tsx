import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar?: string;
  metrics?: string; // e.g., "Saved $1,200 • 3 days turnaround"
}

export interface CommunityStat {
  id: string;
  value: string;
  label: string;
  color: 'indigo' | 'green' | 'purple' | 'orange';
}

interface SocialProofProps {
  testimonials: Testimonial[];
  communityStats: CommunityStat[];
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaAction?: () => void;
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
}

const SocialProof: React.FC<SocialProofProps> = ({
  testimonials,
  communityStats,
  title = "Join Thousands of Successful Users",
  subtitle = "Real results from real customers",
  ctaText = "Get Started",
  ctaAction,
  userType
}) => {
  // Don't render if no testimonials and no community stats
  if ((!testimonials || testimonials.length === 0) && (!communityStats || communityStats.length === 0)) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="text-yellow-500 mb-2 flex gap-1">
        {[...Array(5)].map((_, index) => (
          <FontAwesomeIcon 
            key={index} 
            icon={faStar} 
            className={index < rating ? 'text-yellow-500' : 'text-gray-300'} 
          />
        ))}
      </div>
    );
  };

  const getStatColor = (color: CommunityStat['color']) => {
    switch (color) {
      case 'indigo':
        return 'text-indigo-600';
      case 'green':
        return 'text-green-600';
      case 'purple':
        return 'text-purple-600';
      case 'orange':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBorderColors = () => {
    const colors = ['border-indigo-200', 'border-purple-200', 'border-pink-200'];
    return colors;
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">{subtitle}</p>
      </div>
      
      {testimonials && testimonials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testimonials.slice(0, 3).map((testimonial, index) => {
            const borderColors = getBorderColors();
            return (
              <div key={testimonial.id} className={`bg-white rounded-lg p-6 border ${borderColors[index % borderColors.length]} shadow-sm`}>
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.avatar || "/images/user.png"} 
                    alt="Customer" 
                    className="w-12 h-12 rounded-full mr-3" 
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.location}</p>
                  </div>
                </div>
                {renderStars(testimonial.rating)}
                <p className="text-gray-700 text-sm italic">"{testimonial.text}"</p>
                {testimonial.metrics && (
                  <div className="mt-3 text-xs text-green-600 font-medium">
                    {testimonial.metrics}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {communityStats && communityStats.length > 0 && (
        <div className="bg-white rounded-lg p-6 border-2 border-dashed border-indigo-300">
          <div className="text-center">
            <div className="flex justify-center items-center gap-8 mb-4">
              {communityStats.map((stat) => (
                <div key={stat.id} className="text-center">
                  <div className={`text-2xl font-bold ${getStatColor(stat.color)}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mb-4">Ready to join our community?</p>
            {ctaAction && ctaText && (
              <button 
                onClick={ctaAction}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-bold hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition transform hover:scale-105 shadow-lg"
              >
                {ctaText}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialProof;