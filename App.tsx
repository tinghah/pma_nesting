import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import OrderSelector from './components/OrderSelector';
import NestingSummary from './components/NestingSummary';
import { SavedDataset, NestingResult } from './types';
import { Language } from './utils/translations';
import { logUsage, downloadAuditCSV } from './utils/telemetry';

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

    // Telemetry: Log App Opening
    logUsage('APP_OPEN');

    // Admin Shortcut for CSV Download
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            downloadAuditCSV();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist UI preferences
  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedDataset[] = JSON.parse(stored);
        setSavedDatasets(parsed);
        if (parsed.length > 0) setActiveDatasetId(parsed[0].id);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      if (savedDatasets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDatasets));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
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

    // Filter rows
    const filteredRows = data.rows.filter(row => {
        const rowSO = String(row['SO_Number'] || '').trim();
        return selectedOrders.some(order => order === rowSO);
    });

    // Initialize map structure
    const sizeDataMap = new Map<string, { 
        total: number, 
        orders: Map<string, { qty: number, extras: Record<string, string | number> }>,
        articles: Set<string>,
        models: Set<string>,
        colors: Set<string>
    }>();

    data.sizeColumns.forEach(size => {
        sizeDataMap.set(size, { total: 0, orders: new Map(), articles: new Set(), models: new Set(), colors: new Set() });
    });

    const globalArticles = new Set<string>();
    const globalModels = new Set<string>();
    const globalColors = new Set<string>();
    const orderTotalsMap = new Map<string, number>();

    filteredRows.forEach(row => {
        const soNum = String(row['SO_Number'] || 'Unknown').trim();
        const rowExtras: Record<string, string | number> = {};
        if (data.infoColumns) {
            data.infoColumns.forEach(col => {
                const val = row[col];
                if (val !== undefined && val !== null) rowExtras[col] = String(val);
            });
        }
        
        const rowArticle = data.articleHeader ? String(row[data.articleHeader] || '').trim() : '';
        const rowModel = data.modelHeader ? String(row[data.modelHeader] || '').trim() : '';
        const rowColor = data.colorHeader ? String(row[data.colorHeader] || '').trim() : '';

        if (rowArticle) globalArticles.add(rowArticle);
        if (rowModel) globalModels.add(rowModel);
        if (rowColor) globalColors.add(rowColor);

        data.sizeColumns.forEach(size => {
            const val = row[size];
            let numVal = 0;
            if (typeof val === 'number') numVal = val;
            else if (typeof val === 'string') numVal = parseFloat(val);
            
            if (!isNaN(numVal) && numVal > 0) {
                const entry = sizeDataMap.get(size);
                if (entry) {
                    entry.total += numVal;
                    const currentOrderData = entry.orders.get(soNum) || { qty: 0, extras: {} };
                    currentOrderData.qty += numVal;
                    currentOrderData.extras = { ...currentOrderData.extras, ...rowExtras };
                    entry.orders.set(soNum, currentOrderData);
                    if (rowArticle) entry.articles.add(rowArticle);
                    if (rowModel) entry.models.add(rowModel);
                    if (rowColor) entry.colors.add(rowColor);
                }
                const currentOrderTotal = orderTotalsMap.get(soNum) || 0;
                orderTotalsMap.set(soNum, currentOrderTotal + numVal);
            }
        });
    });

    const breakdown = data.sizeColumns.map(size => {
        const entry = sizeDataMap.get(size)!;
        const orderBreakdown = Array.from(entry.orders.entries()).map(([orderNo, data]) => ({
            orderNo,
            qty: data.qty,
            extraInfo: data.extras
        })).sort((a, b) => b.qty - a.qty);

        return {
            size,
            qty: entry.total,
            orderBreakdown,
            articles: Array.from(entry.articles),
            models: Array.from(entry.models),
            colors: Array.from(entry.colors)
        };
    }).filter(item => item.qty > 0); 

    const totalQty = breakdown.reduce((acc, curr) => acc + curr.qty, 0);

    const orderTotals = Array.from(orderTotalsMap.entries())
        .map(([orderNo, qty]) => ({ orderNo, qty }))
        .sort((a, b) => b.qty - a.qty);

    // Telemetry: Log Generation Event
    logUsage('GENERATE_NESTING', {
        selectedOrders,
        totalQty,
        orderCount: orderTotals.length,
        datasetName: data.name
    });

    setNestingResult({ 
        totalQty,
        orderTotals,
        breakdown,
        infoColumns: data.infoColumns || [],
        articleHeader: data.articleHeader,
        modelHeader: data.modelHeader,
        colorHeader: data.colorHeader,
        summaryArticles: Array.from(globalArticles),
        summaryModels: Array.from(globalModels),
        summaryColors: Array.from(globalColors)
    });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <Header lang={language} setLang={setLanguage} isDark={isDark} setIsDark={setIsDark} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4 lg:sticky lg:top-6">
            <FileUploader onDataSaved={handleDatasetLoaded} savedDatasets={savedDatasets} activeDatasetId={activeDatasetId} onSelect={handleDatasetSelect} onDelete={handleDatasetDelete} lang={language} isDark={isDark} />
            <OrderSelector data={activeDataset} onGenerate={handleGenerate} lang={language} isDark={isDark} />
          </div>
          <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full min-h-[500px]">
            <NestingSummary result={nestingResult} lang={language} isDark={isDark} />
          </div>
        </div>
      </main>
      <footer className={`border-t mt-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
         <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col items-center gap-2">
            <p className={`text-center text-[10px] flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                <span>&copy; {new Date().getFullYear()} Pou Chen Myanmar.</span>
                <span className="text-red-600 font-bold text-sm uppercase">Internal Use Only</span>
            </p>
            <p className={`text-center text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Developed by <span className="font-semibold">Htet Aung Hlaing ( ting )</span> @ PCM PCAG IT Team | v2.4 CSV Logging Enabled
            </p>
         </div>
      </footer>
    </div>
  );
};

export default App;