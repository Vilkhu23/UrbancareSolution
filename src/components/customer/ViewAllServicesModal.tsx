import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SERVICE_CATEGORIES } from '../../data/initialData';
import {
  X,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Sparkles,
  ShieldAlert,
  Heart,
  Scissors,
  Home,
  PlusCircle,
  ArrowRight,
  Check
} from 'lucide-react';

interface ViewAllServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryName: string, subcategoryName?: string) => void;
}

export const ViewAllServicesModal: React.FC<ViewAllServicesModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory
}) => {
  const { services, setSelectedDetailServiceId } = useApp();
  const [selectedCatId, setSelectedCatId] = useState<string>('ac-appliances');

  if (!isOpen) return null;

  const currentCategory = SERVICE_CATEGORIES.find((c) => c.id === selectedCatId) || SERVICE_CATEGORIES[0];
  const catServices = services.filter((s) => s.category.toLowerCase() === currentCategory.name.toLowerCase());

  // Group by subcategory
  const subcategoryMap = currentCategory.subcategories.reduce((acc, sub) => {
    acc[sub] = catServices.filter((s) => s.subcategory === sub);
    return acc;
  }, {} as Record<string, typeof catServices>);

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'ac-appliances': return <Wrench className="w-4 h-4 text-[#003523]" />;
      case 'electrical': return <Zap className="w-4 h-4 text-[#904d00]" />;
      case 'plumbing': return <Droplets className="w-4 h-4 text-[#003523]" />;
      case 'carpentry': return <Hammer className="w-4 h-4 text-[#404943]" />;
      case 'fabrication': return <Hammer className="w-4 h-4 text-[#904d00]" />;
      case 'painting': return <Paintbrush className="w-4 h-4 text-[#904d00]" />;
      case 'cleaning': return <Sparkles className="w-4 h-4 text-[#003523]" />;
      case 'pest-control': return <ShieldAlert className="w-4 h-4 text-[#ba1a1a]" />;
      case 'salon-women': return <Heart className="w-4 h-4 text-[#ba1a1a]" />;
      case 'grooming-men': return <Scissors className="w-4 h-4 text-[#404943]" />;
      case 'home-projects': return <Home className="w-4 h-4 text-[#003523]" />;
      default: return <PlusCircle className="w-4 h-4 text-[#003523]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#131b2e]">
              All Verified Home Services
            </h2>
            <p className="text-xs text-[#707973]">
              Browse complete Category → Subcategory hierarchy for Kharar and Mohali
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#707973] hover:text-[#131b2e] hover:bg-[#eaedff]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Pane Body on Desktop, Stacked on Mobile */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Left Navigation: Categories List */}
          <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-[#c0c9c2]/40 bg-[#faf8ff] overflow-y-auto max-h-48 sm:max-h-none p-2 sm:p-3 space-y-1">
            {SERVICE_CATEGORIES.map((cat) => {
              const isSelected = cat.id === selectedCatId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all text-left ${
                    isSelected
                      ? 'bg-[#003523] text-white shadow-xs'
                      : 'text-[#404943] hover:bg-[#eaedff] hover:text-[#131b2e]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={isSelected ? 'text-white' : ''}>
                      {getCategoryIcon(cat.id)}
                    </span>
                    <span>{cat.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#e2e7ff] text-[#003523]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Content: Subcategories & Services Matrix */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white">
            <div className="border-b border-[#c0c9c2]/30 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#131b2e]">
                    {currentCategory.name}
                  </h3>
                  <p className="text-xs text-[#707973] mt-0.5">
                    {currentCategory.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onSelectCategory(currentCategory.name);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] shrink-0"
                >
                  View Category Page
                </button>
              </div>
            </div>

            {/* Subcategories Breakdown */}
            <div className="space-y-5">
              {currentCategory.subcategories.map((subName) => {
                const itemsInSub = subcategoryMap[subName] || [];
                return (
                  <div key={subName} className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#c0c9c2]/20 pb-1">
                      <span className="text-xs font-black text-[#003523] uppercase tracking-wider">
                        {subName}
                      </span>
                      <span className="text-[11px] text-[#707973]">
                        {itemsInSub.length} options
                      </span>
                    </div>

                    {itemsInSub.length === 0 ? (
                      <div className="p-3 bg-[#faf8ff] rounded-lg text-[11px] text-[#707973] italic">
                        Custom artisan quote available upon request.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {itemsInSub.map((srv) => (
                          <div
                            key={srv.id}
                            onClick={() => {
                              setSelectedDetailServiceId(srv.id);
                              onClose();
                            }}
                            className="p-3 rounded-xl border border-[#c0c9c2]/40 bg-[#faf8ff] hover:border-[#003523] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="pr-2">
                              <div className="font-bold text-xs text-[#131b2e] group-hover:text-[#003523]">
                                {srv.name}
                              </div>
                              <div className="text-[10px] text-[#707973]">
                                {srv.estimatedDuration} · {srv.warranty}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black text-[#003523]">
                                ₹{srv.basePrice}
                              </div>
                              <span className="text-[10px] text-[#003523] font-semibold group-hover:underline">
                                Details →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
