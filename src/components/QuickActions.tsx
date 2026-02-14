import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, faBolt } from '@fortawesome/free-solid-svg-icons';

export interface QuickAction {
  id: string;
  type: 'upload' | 'preview' | 'action';
  title: string;
  subtitle?: string;
  description?: string;
  ctaText: string;
  ctaAction: () => void;
  isLimitedTime?: boolean;
  icon?: IconDefinition;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  borderColor?: string;
  features?: Array<{
    icon: IconDefinition;
    text: string;
    color: string;
  }>;
  stats?: string; // e.g., "Join 847 who uploaded this week"
  image?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
  fileInputRef?: React.RefObject<HTMLInputElement>;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  fileInputRef,
  onFileChange,
  onDrop
}) => {
  // Don't render if no actions
  if (!actions || actions.length === 0) {
    return null;
  }

  const renderUploadAction = (action: QuickAction) => (
    <div className={`bg-gradient-to-br ${action.gradientFrom || 'from-green-50'} ${action.gradientTo || 'to-blue-50'} rounded-xl border-2 ${action.borderColor || 'border-green-200'} p-6 relative overflow-hidden`}>
      {action.isLimitedTime && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          LIMITED TIME
        </div>
      )}
      <h4 className="text-lg font-bold mb-2 flex items-center gap-2 text-gray-800">
        {action.icon && <FontAwesomeIcon icon={action.icon} className={action.iconColor || 'text-green-600'} />}
        {action.title}
      </h4>
      {action.subtitle && (
        <p className="text-sm text-gray-600 mb-4">
          <strong>{action.subtitle}</strong>
        </p>
      )}
      <div
        className="border-2 border-dashed border-green-400 p-6 rounded-lg flex flex-col items-center justify-center text-center gap-3 cursor-pointer bg-white/80 hover:bg-white transition min-h-[180px] relative"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef?.current?.click();
        }}
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 relative">
          {action.icon && <FontAwesomeIcon icon={action.icon} className="text-green-600 text-2xl" />}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            <FontAwesomeIcon icon={faBolt} />
          </div>
        </div>
        <p className="text-gray-800 font-bold">{action.description}</p>
        {action.stats && <p className="text-gray-600 text-sm">{action.stats}</p>}
        <button
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition font-bold shadow-lg transform hover:scale-105"
          onClick={(e) => {
            e.stopPropagation();
            action.ctaAction();
          }}
        >
          {action.ctaText}
        </button>
        {action.features && (
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            {action.features.map((feature, index) => (
              <span key={index} className="flex items-center gap-1">
                <FontAwesomeIcon icon={feature.icon} className={feature.color} />
                {feature.text}
              </span>
            ))}
          </div>
        )}
        {fileInputRef && onFileChange && (
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="application/pdf"
            multiple
            onChange={onFileChange}
          />
        )}
      </div>
    </div>
  );

  const renderPreviewAction = (action: QuickAction) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h4 className="text-lg font-bold mb-4 text-gray-800">{action.title}</h4>
      {action.image ? (
        <div className="relative rounded-lg overflow-hidden mb-4">
          <img 
            src={action.image} 
            alt="Preview" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <button 
              onClick={action.ctaAction}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              {action.ctaText} →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center mb-4">
          <p className="text-gray-600">{action.description}</p>
          <button 
            onClick={action.ctaAction}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            {action.ctaText} →
          </button>
        </div>
      )}
    </div>
  );

  const renderActionCard = (action: QuickAction) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        {action.icon && (
          <div className={`w-12 h-12 ${action.iconColor || 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
            <FontAwesomeIcon icon={action.icon} className="text-blue-600" />
          </div>
        )}
        <div>
          <h4 className="font-bold text-gray-800">{action.title}</h4>
          {action.subtitle && <p className="text-sm text-gray-600">{action.subtitle}</p>}
        </div>
      </div>
      {action.description && (
        <p className="text-gray-600 text-sm mb-4">{action.description}</p>
      )}
      <button 
        onClick={action.ctaAction}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
      >
        {action.ctaText}
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {actions.map((action) => {
        switch (action.type) {
          case 'upload':
            return <div key={action.id}>{renderUploadAction(action)}</div>;
          case 'preview':
            return <div key={action.id}>{renderPreviewAction(action)}</div>;
          case 'action':
            return <div key={action.id}>{renderActionCard(action)}</div>;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default QuickActions;