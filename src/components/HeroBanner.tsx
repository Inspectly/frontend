import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface HeroBadge {
  icon: IconDefinition;
  label: string;
}

export interface HeroData {
  backgroundImage: string;
  socialProofText?: string;
  title: string;
  subtitle: string;
  badges: HeroBadge[];
  userInitials?: string[]; // For social proof avatars
}

interface HeroBannerProps {
  heroData: HeroData;
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
}

const HeroBanner: React.FC<HeroBannerProps> = ({ heroData, userType }) => {
  if (!heroData) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl overflow-hidden mb-6">
      <img
        src={heroData.backgroundImage}
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
        alt="Hero background"
      />
      <div className="flex 3xl:gap-[80px] xl:gap-[32px] lg:gap-6 gap-4 items-center relative z-[1] 3xl:px-[60px] xl:px-[48px] lg:px-6 px-4 py-1">
        <div className="sm:block hidden w-full">
          <img
            src="/images/ai_image.webp"
            alt="AI-powered management"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow-1">
          {heroData.socialProofText && heroData.userInitials && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {heroData.userInitials.map((initial, index) => (
                  <div 
                    key={index}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <span className="text-blue-100 text-sm font-medium">
                {heroData.socialProofText}
              </span>
            </div>
          )}
          <h4 className="mb-3 font-bold text-3xl text-white">
            {heroData.title}
          </h4>
          <p className="text-blue-100 text-base mb-4">
            {heroData.subtitle}
          </p>
          {heroData.badges.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              {heroData.badges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                  <FontAwesomeIcon icon={badge.icon} className="text-white" />
                  <span className="text-white font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;