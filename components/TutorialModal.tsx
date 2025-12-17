import React from 'react';
import { X, BookOpen, Upload, Settings2, Search, Download } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isDark: boolean;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, lang, isDark }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
               <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">{t.tutorialTitle}</h2>
          </div>
          <button onClick={onClose} className={`p-1 rounded-full hover:bg-opacity-80 transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* What is Section */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-blue-50/50'}`}>
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                {t.whatIsTitle}
            </h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t.whatIsDesc}
            </p>
          </div>

          {/* Steps */}
          <div>
             <h3 className="text-base font-bold mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">{t.howToTitle}</h3>
             
             <div className="grid gap-4">
                {/* Step 1 */}
                <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>1</div>
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step1} <Upload className="w-3 h-3 opacity-50"/></h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step1Desc}</p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>2</div>
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step2} <Settings2 className="w-3 h-3 opacity-50"/></h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step2Desc}</p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>3</div>
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step3} <Search className="w-3 h-3 opacity-50"/></h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step3Desc}</p>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>4</div>
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step4} <Download className="w-3 h-3 opacity-50"/></h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step4Desc}</p>
                    </div>
                </div>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end sticky bottom-0 z-10 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <button 
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'}`}
            >
                {t.close}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;