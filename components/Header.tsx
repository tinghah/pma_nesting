import React from 'react';
import { Layers, Moon, Sun, Globe } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ lang, setLang, isDark, setIsDark }) => {
  const t = translations[lang];

  return (
    <header className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm border-b transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`${isDark ? 'bg-blue-500/20' : 'bg-adidas-blue/10'} p-2 rounded-lg`}>
            <Layers className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.appTitle}</h1>
            <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.appSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          
          {/* Language Switcher */}
          <div className={`flex items-center rounded-lg p-1 border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <Globe className={`w-4 h-4 ml-1.5 mr-1 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Language)}
              className={`bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer ${isDark ? 'text-slate-200' : 'text-gray-700'}`}
            >
              <option value="en">English</option>
              <option value="my">Burmese</option>
              <option value="tw">Chinese</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;