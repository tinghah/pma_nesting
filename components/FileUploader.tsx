import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Database, Trash2, Plus, X, Server, Settings2, CheckSquare, Square } from 'lucide-react';
import { parseExcelFile } from '../utils/excel';
import { ProcessedData, SavedDataset } from '../types';
import { Language, translations } from '../utils/translations';

interface FileUploaderProps {
  onDataSaved: (data: SavedDataset) => void;
  savedDatasets: SavedDataset[];
  activeDatasetId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  lang: Language;
  isDark: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onDataSaved, 
  savedDatasets, 
  activeDatasetId, 
  onSelect,
  onDelete,
  lang,
  isDark
}) => {
  const t = translations[lang];
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showUpload, setShowUpload] = useState(savedDatasets.length === 0);
  
  // New state for Column Configuration
  const [pendingData, setPendingData] = useState<ProcessedData | null>(null);
  const [selectedSizeCols, setSelectedSizeCols] = useState<Set<string>>(new Set());
  const [selectedInfoCols, setSelectedInfoCols] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (e) { }
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    
    if (!file.name.match(/\.xls(x)?$/i)) {
      setError(t.uploadValid);
      return;
    }

    setFileName(file.name);
    setError(null);
    setIsLoading(true);

    try {
      const data: ProcessedData = await parseExcelFile(file);
      
      // Initialize configuration state with heuristics
      setPendingData(data);
      setSelectedSizeCols(new Set(data.sizeColumns));

      // Auto-select Article, Model, and Color columns if detected
      const initialInfoCols = new Set<string>();
      if (data.articleHeader) initialInfoCols.add(data.articleHeader);
      if (data.modelHeader) initialInfoCols.add(data.modelHeader);
      if (data.colorHeader) initialInfoCols.add(data.colorHeader);
      
      setSelectedInfoCols(initialInfoCols);
      
      if (!customName) {
        setCustomName(file.name.replace(/\.xlsx?$/, ''));
      }

    } catch (err) {
      console.error("Excel Parsing Error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to parse: ${errorMessage}`);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadServerFile = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('/data.xlsx');
        if (!response.ok) {
            const fallback = await fetch('./data.xlsx');
            if (!fallback.ok) throw new Error("File 'data.xlsx' not found in project root.");
            const blob = await fallback.blob();
            const file = new File([blob], "data.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            await handleFile(file);
            return;
        }
        const blob = await response.blob();
        const file = new File([blob], "data.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        await handleFile(file);
    } catch (err) {
        console.error(err);
        setError(t.serverFileError);
        setIsLoading(false);
    }
  };

  const confirmDataset = () => {
    if (!pendingData) return;

    // Apply the user's configuration
    const finalData: ProcessedData = {
        ...pendingData,
        sizeColumns: Array.from(selectedSizeCols),
        infoColumns: Array.from(selectedInfoCols)
    };

    let finalName = customName.trim();
    if (!finalName) {
       finalName = `DS-${String(savedDatasets.length + 1).padStart(2, '0')}`;
    }

    const newDataset: SavedDataset = {
      ...finalData,
      id: generateId(),
      name: finalName,
      createdAt: Date.now()
    };

    onDataSaved(newDataset);
    
    // Reset State
    setFileName(null);
    setCustomName('');
    setPendingData(null);
    setShowUpload(false);
  };

  const cancelConfig = () => {
    setPendingData(null);
    setFileName(null);
    setError(null);
  };

  const toggleSizeCol = (col: string) => {
    const next = new Set(selectedSizeCols);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setSelectedSizeCols(next);
  };

  const toggleInfoCol = (col: string) => {
    const next = new Set(selectedInfoCols);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setSelectedInfoCols(next);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  // Render the Column Configuration Mode
  if (pendingData) {
    return (
        <div className={`rounded-lg shadow-sm border overflow-hidden flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/50 border-gray-100'}`}>
                <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    Configure Columns
                </h2>
                <button onClick={cancelConfig} className="text-gray-400 hover:text-gray-500">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="p-3 space-y-4">
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-2 text-xs text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Please review:</p>
                    <p>1. Select columns that contain <b>Sizes</b> (quantities).</p>
                    <p>2. Select extra columns to show (e.g. Color, Article).</p>
                 </div>

                 {/* Size Columns Selection */}
                 <div>
                    <h3 className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Size Columns (Quantities)</h3>
                    <div className="max-h-[150px] overflow-y-auto custom-scrollbar border rounded p-2 grid grid-cols-2 gap-2 bg-gray-50/50 dark:bg-slate-900/50 dark:border-slate-700">
                        {pendingData.headers.filter(h => h !== 'SO_Number').map(h => {
                             const isChecked = selectedSizeCols.has(h);
                             return (
                                 <label key={`size-${h}`} className="flex items-center gap-2 cursor-pointer group">
                                     <div onClick={() => toggleSizeCol(h)} className={`flex-shrink-0 ${isChecked ? 'text-blue-600' : 'text-gray-300 dark:text-slate-600'}`}>
                                         {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                     </div>
                                     <span className={`text-xs truncate select-none ${isChecked ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-slate-500' : 'text-gray-500')}`}>
                                        {h}
                                     </span>
                                 </label>
                             );
                        })}
                    </div>
                 </div>

                 {/* Info Columns Selection */}
                 <div>
                    <h3 className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Additional Info (Display Only)</h3>
                    <div className="max-h-[100px] overflow-y-auto custom-scrollbar border rounded p-2 grid grid-cols-1 gap-2 bg-gray-50/50 dark:bg-slate-900/50 dark:border-slate-700">
                        {pendingData.headers.filter(h => h !== 'SO_Number' && !selectedSizeCols.has(h)).map(h => {
                             const isChecked = selectedInfoCols.has(h);
                             const isAutoDetected = (pendingData.articleHeader === h || pendingData.modelHeader === h || pendingData.colorHeader === h);
                             
                             return (
                                 <label key={`info-${h}`} className="flex items-center gap-2 cursor-pointer group">
                                     <div onClick={() => toggleInfoCol(h)} className={`flex-shrink-0 ${isChecked ? 'text-emerald-600' : 'text-gray-300 dark:text-slate-600'}`}>
                                         {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                     </div>
                                     <div className="flex items-center gap-2 min-w-0">
                                         <span className={`text-xs truncate select-none ${isChecked ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-slate-500' : 'text-gray-500')}`}>
                                            {h}
                                         </span>
                                         {isAutoDetected && (
                                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded dark:bg-blue-900 dark:text-blue-300">Auto</span>
                                         )}
                                     </div>
                                 </label>
                             );
                        })}
                        {pendingData.headers.filter(h => h !== 'SO_Number' && !selectedSizeCols.has(h)).length === 0 && (
                            <span className="text-[10px] text-gray-400 italic text-center">No other columns available</span>
                        )}
                    </div>
                 </div>

                 <button
                    onClick={confirmDataset}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                 >
                    Save Configuration
                 </button>
            </div>
        </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-sm border overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      {/* Compact Header */}
      <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
        <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Database className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
          {t.dataSources}
        </h2>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className={`p-1 rounded-md transition-colors ${
            showUpload 
              ? (isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600') 
              : (isDark ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-900/60' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')
          }`}
          title={showUpload ? t.cancel : t.newSource}
        >
          {showUpload ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-3">
        {showUpload || savedDatasets.length === 0 ? (
          /* Upload View */
          <div className="space-y-3 animate-fadeIn">
            <input 
              type="text" 
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t.nameOptional}
              className={`block w-full rounded text-sm shadow-sm p-2 border focus:ring-1 focus:ring-blue-500 outline-none ${
                isDark 
                  ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded p-4 text-center cursor-pointer transition-all duration-200
                ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                ${!isDragging && isDark ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700' : ''}
                ${!isDragging && !isDark ? 'border-gray-200 hover:border-blue-400 hover:bg-gray-50' : ''}
                ${fileName ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''}
              `}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
              ) : fileName ? (
                <div className={`flex items-center justify-center ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-medium truncate max-w-[150px]">{fileName}</span>
                </div>
              ) : (
                <div className={`flex flex-col items-center ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-xs">{t.clickUpload}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
                <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.or}</span>
                <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
            </div>

            <button
                onClick={handleLoadServerFile}
                disabled={isLoading}
                className={`w-full flex items-center justify-center px-4 py-2 border text-sm font-medium rounded shadow-sm transition-colors
                  ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
            >
                <Server className="w-4 h-4 mr-2 text-blue-500" />
                {t.loadServer}
            </button>
            
            {error && (
              <div className="flex items-start text-xs text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-2 rounded">
                <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
             {savedDatasets.map(ds => {
               const isActive = ds.id === activeDatasetId;
               return (
                 <div 
                   key={ds.id}
                   onClick={() => onSelect(ds.id)}
                   className={`
                     group flex justify-between items-center p-2 rounded-md cursor-pointer transition-all border
                     ${isActive 
                        ? 'bg-blue-600 border-blue-600 shadow-sm' 
                        : (isDark ? 'bg-slate-700 border-transparent hover:bg-slate-600' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200')
                     }
                   `}
                 >
                   <div className="flex flex-col min-w-0">
                     <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : (isDark ? 'text-slate-200' : 'text-gray-900')}`}>
                       {ds.name}
                     </span>
                     <span className={`text-[10px] truncate ${isActive ? 'text-blue-100' : (isDark ? 'text-slate-400' : 'text-gray-400')}`}>
                       {new Date(ds.createdAt).toLocaleDateString()} • {ds.soNumbers.length} Orders
                     </span>
                   </div>
                   
                   <button
                    onClick={(e) => { e.stopPropagation(); onDelete(ds.id); }}
                    className={`
                      p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity
                      ${isActive 
                        ? 'text-blue-100 hover:bg-blue-500 hover:text-white' 
                        : (isDark ? 'text-slate-400 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600')
                      }
                    `}
                    title="Delete"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                 </div>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;