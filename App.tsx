import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import OrderSelector from './components/OrderSelector';
import NestingSummary from './components/NestingSummary';
import { SavedDataset, NestingResult } from './types';
import { Language } from './utils/translations';

const STORAGE_KEY = 'pma_nesting_datasets_v1';
const LANG_KEY = 'pma_lang_pref';
const THEME_KEY = 'pma_theme_dark';

const App: React.FC = () => {
  const [savedDatasets, setSavedDatasets] = useState<SavedDataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);
  
  // UI State
  const [language, setLanguage] = useState<Language>('en');
  const [isDark, setIsDark] = useState(false);

  // Initialize UI preferences
  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Language;
    if (savedLang) setLanguage(savedLang);

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) setIsDark(savedTheme === 'true');
  }, []);

  // Persist UI preferences
  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, String(isDark));
  }, [isDark]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedDataset[] = JSON.parse(stored);
        setSavedDatasets(parsed);
        if (parsed.length > 0) {
          setActiveDatasetId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load datasets from storage", e);
    }
  }, []);

  // Save to localStorage whenever datasets change
  useEffect(() => {
    try {
      if (savedDatasets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDatasets));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save datasets to storage (likely quota exceeded)", e);
    }
  }, [savedDatasets]);

  const activeDataset = savedDatasets.find(d => d.id === activeDatasetId) || null;

  const handleDatasetLoaded = (dataset: SavedDataset) => {
    setSavedDatasets(prev => [dataset, ...prev]);
    setActiveDatasetId(dataset.id);
    setNestingResult(null);
  };

  const handleDatasetSelect = (id: string) => {
    setActiveDatasetId(id);
    setNestingResult(null);
  };

  const handleDatasetDelete = (id: string) => {
    const newDatasets = savedDatasets.filter(d => d.id !== id);
    setSavedDatasets(newDatasets);
    if (activeDatasetId === id) {
      setActiveDatasetId(newDatasets.length > 0 ? newDatasets[0].id : null);
      setNestingResult(null);
    }
  };

  const handleGenerate = (selectedOrders: string[]) => {
    if (!activeDataset) return;
    const data = activeDataset;

    const filteredRows = data.rows.filter(row => {
        const rowSO = String(row['SO_Number'] || '').trim();
        return selectedOrders.some(order => order === rowSO);
    });

    const sizeSums: { [key: string]: number } = {};
    data.sizeColumns.forEach(size => sizeSums[size] = 0);

    filteredRows.forEach(row => {
        data.sizeColumns.forEach(size => {
            const val = row[size];
            let numVal = 0;
            if (typeof val === 'number') {
                numVal = val;
            } else if (typeof val === 'string') {
                numVal = parseFloat(val);
            }
            if (!isNaN(numVal)) {
                sizeSums[size] += numVal;
            }
        });
    });

    const breakdown = data.sizeColumns.map(size => ({
        size,
        qty: sizeSums[size]
    })).filter(item => item.qty > 0); 

    const totalQty = breakdown.reduce((acc, curr) => acc + curr.qty, 0);

    setNestingResult({ totalQty, breakdown });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <Header 
        lang={language} 
        setLang={setLanguage} 
        isDark={isDark} 
        setIsDark={setIsDark} 
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Controls */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4 lg:sticky lg:top-6">
            <FileUploader 
              onDataSaved={handleDatasetLoaded}
              savedDatasets={savedDatasets}
              activeDatasetId={activeDatasetId}
              onSelect={handleDatasetSelect}
              onDelete={handleDatasetDelete}
              lang={language}
              isDark={isDark}
            />
            <OrderSelector 
              data={activeDataset} 
              onGenerate={handleGenerate} 
              lang={language}
              isDark={isDark}
            />
          </div>

          {/* Right Column: Output */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full min-h-[500px]">
            <NestingSummary 
              result={nestingResult} 
              lang={language}
              isDark={isDark}
            />
          </div>

        </div>
      </main>

      <footer className={`border-t mt-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
         <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <p className={`text-center text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                &copy; {new Date().getFullYear()} Pou Chen Myanmar. Internal Use Only.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default App;