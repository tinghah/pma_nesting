import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Database, Trash2, Plus, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError(t.uploadValid);
      return;
    }

    setFileName(file.name);
    setError(null);
    setIsLoading(true);

    try {
      const data: ProcessedData = await parseExcelFile(file);
      
      let finalName = customName.trim();
      if (!finalName) {
        const count = savedDatasets.length;
        finalName = `DS-${String(count + 1).padStart(2, '0')}`;
      }

      const newDataset: SavedDataset = {
        ...data,
        id: crypto.randomUUID(),
        name: finalName,
        createdAt: Date.now()
      };

      onDataSaved(newDataset);
      setFileName(null);
      setCustomName('');
      setShowUpload(false); 

    } catch (err) {
      console.error(err);
      setError('Failed to parse file.');
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

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