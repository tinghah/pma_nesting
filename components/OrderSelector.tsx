import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Minus, Search, Trash2, ArrowRight, AlertTriangle, AlertCircle } from 'lucide-react';
import { ProcessedData } from '../types';
import { Language, translations } from '../utils/translations';

interface OrderSelectorProps {
  data: ProcessedData | null;
  onGenerate: (selectedOrders: string[]) => void;
  lang: Language;
  isDark: boolean;
}

const OrderSelector: React.FC<OrderSelectorProps> = ({ data, onGenerate, lang, isDark }) => {
  const t = translations[lang];
  const [inputs, setInputs] = useState<string[]>(Array(3).fill(''));
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevLengthRef = useRef(inputs.length);

  // Focus the new input when a field is added
  useEffect(() => {
    if (inputs.length > prevLengthRef.current) {
      const lastIndex = inputs.length - 1;
      inputRefs.current[lastIndex]?.focus();
    }
    prevLengthRef.current = inputs.length;
  }, [inputs.length]);
  
  // Validation Logic
  const validOrdersSet = useMemo(() => {
    return data ? new Set(data.soNumbers.map(s => String(s).trim())) : new Set();
  }, [data]);

  const trimmedInputs = inputs.map(val => val.trim());
  const filledInputs = trimmedInputs.filter(val => val !== '');

  // Check validity against dataset
  const invalidValues = filledInputs.filter(val => !validOrdersSet.has(val));
  const uniqueInvalidValues = Array.from(new Set(invalidValues));
  const hasInvalidErrors = uniqueInvalidValues.length > 0;

  // Check duplicates
  const duplicateValues = filledInputs.filter((item, index) => filledInputs.indexOf(item) !== index);
  const uniqueDuplicateValues = Array.from(new Set(duplicateValues));
  const hasDuplicateErrors = uniqueDuplicateValues.length > 0;

  const hasErrors = hasInvalidErrors || hasDuplicateErrors;
  const hasEmptySelection = inputs.every(i => i.trim() === '');
  
  const addInput = () => setInputs([...inputs, '']);
  const removeInput = () => {
    if (inputs.length > 1) {
      setInputs(inputs.slice(0, -1));
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const clearAll = () => setInputs(Array(3).fill(''));

  const handleGenerate = () => {
    if (hasErrors) return;
    const validOrders = inputs.map(i => i.trim()).filter(Boolean);
    onGenerate(validOrders);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Only navigate if the current input is valid or empty (allow moving past empty, but logic usually implies filling it)
      if (index < inputs.length - 1) {
        // Move to next existing input
        inputRefs.current[index + 1]?.focus();
      } else {
        // Add new input
        addInput();
      }
    }
  };

  const totalOrders = data?.soNumbers.length || 0;

  return (
    <div className={`rounded-lg shadow-sm border flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50/50'}`}>
        <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Search className={`w-3.5 h-3.5 mr-1.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
          {t.selectOrders}
        </h2>
        {data && (
           <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
             {totalOrders} {t.avail}
           </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {inputs.map((value, index) => {
                const valTrim = value.trim();
                const isInvalid = data && valTrim !== '' && !validOrdersSet.has(valTrim);
                
                // Count occurrences of this value in inputs to detect duplicate
                const count = inputs.filter(v => v.trim() === valTrim && valTrim !== '').length;
                const isDuplicate = count > 1;

                const isError = isInvalid || isDuplicate;

                return (
                    <div key={index} className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono w-4 text-right flex-shrink-0 ${isError ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                            {index + 1}
                        </span>
                        <input
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        value={value}
                        disabled={!data}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder={data ? "SO Number..." : "-"}
                        className={`
                            block w-full rounded shadow-sm text-sm py-1.5 px-2.5 border outline-none
                            transition-colors
                            ${isError 
                                ? (isDark ? 'bg-red-900/20 border-red-500 text-red-200 placeholder-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'bg-red-50 border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500')
                                : isDark 
                                    ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-600 focus:border-blue-500' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-300 focus:border-blue-500'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        list="so-options"
                        />
                    </div>
                );
            })}
            {data && (
                <datalist id="so-options">
                    {data.soNumbers.map(so => <option key={so} value={so} />)}
                </datalist>
            )}
        </div>

        <div className={`flex space-x-2 pt-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
          <button
            onClick={addInput}
            disabled={!data}
            className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 border shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50
                ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }
            `}
          >
            <Plus className="w-3 h-3 mr-1" /> {t.add}
          </button>
          <button
            onClick={removeInput}
            disabled={!data || inputs.length <= 1}
            className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 border shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50
                ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }
            `}
          >
            <Minus className="w-3 h-3 mr-1" /> {t.remove}
          </button>
          <button
             onClick={clearAll}
             disabled={!data}
             className={`inline-flex items-center justify-center px-2 py-1.5 border shadow-sm text-xs font-medium rounded disabled:opacity-50
                ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-slate-400 hover:text-red-400 hover:bg-slate-600' 
                    : 'bg-white border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50'
                }
             `}
             title="Clear All"
          >
              <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasInvalidErrors && (
          <div className={`mt-2 p-3 rounded-md text-xs flex gap-2 items-start border ${isDark ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-100 text-red-700'} animate-fadeIn`}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">{t.invalidOrderTitle}</p>
              <div className="opacity-90 leading-relaxed mt-0.5">
                <p>
                  {t.invalidOrderDesc} <span className="font-mono font-semibold underline decoration-red-400/50">{uniqueInvalidValues.join(', ')}</span>.
                </p>
                <p className="mt-1.5 font-medium border-t border-red-200 dark:border-red-800/50 pt-1.5">
                  {t.invalidOrderTip}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasDuplicateErrors && (
          <div className={`mt-2 p-3 rounded-md text-xs flex gap-2 items-start border ${isDark ? 'bg-orange-900/20 border-orange-800 text-orange-200' : 'bg-orange-50 border-orange-100 text-orange-700'} animate-fadeIn`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">{t.duplicateOrderTitle}</p>
              <div className="opacity-90 leading-relaxed mt-0.5">
                 <p>
                   {t.duplicateOrderDesc} <span className="font-mono font-semibold underline decoration-orange-400/50">{uniqueDuplicateValues.join(', ')}</span>.
                 </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!data || hasErrors || hasEmptySelection}
          className={`
            w-full flex items-center justify-center px-4 py-2.5 border border-transparent 
            text-sm font-medium rounded-md text-white shadow-sm
            transition-all duration-200 mt-1
            ${(!data || hasErrors || hasEmptySelection)
              ? (isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:translate-y-0.5'}
          `}
        >
          {t.generate}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      </div>
    </div>
  );
};

export default OrderSelector;