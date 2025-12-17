import React from 'react';
import { Download, Layers, PieChart } from 'lucide-react';
import { NestingResult } from '../types';
import { Language, translations } from '../utils/translations';
import * as XLSX from 'xlsx';

interface NestingSummaryProps {
  result: NestingResult | null;
  lang: Language;
  isDark: boolean;
}

const NestingSummary: React.FC<NestingSummaryProps> = ({ result, lang, isDark }) => {
  const t = translations[lang];

  if (!result) {
    return (
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} p-12 rounded-xl shadow-sm border text-center h-full flex flex-col items-center justify-center min-h-[400px] transition-colors duration-300`}>
        <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} p-4 rounded-full mb-4`}>
          <Layers className={`w-10 h-10 ${isDark ? 'text-slate-500' : 'text-gray-300'}`} />
        </div>
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.ready}</h3>
        <p className={`mt-2 max-w-sm text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {t.readyDesc}
        </p>
      </div>
    );
  }

  const exportToExcel = () => {
    if (!result) return;
    const wb = XLSX.utils.book_new();
    
    // Header Row
    const headers = ["Size", "Total Qty", "Order Details"];

    const wsData = [
      headers,
      ...result.breakdown.map(item => {
        const details = item.orderBreakdown.map(b => {
            let str = `${b.orderNo}:${b.qty}`;
            if (b.extraInfo && Object.keys(b.extraInfo).length > 0) {
                const extras = Object.values(b.extraInfo).join('/');
                str += ` (${extras})`;
            }
            return str;
        }).join(', ');
        return [item.size, item.qty, details];
      }),
      ["Total", result.totalQty, ""]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-width adjustment approximation
    const wscols = [
        { wch: 10 }, // Size
        { wch: 12 }, // Total Qty
        { wch: 100 } // Details
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Nesting Summary");
    XLSX.writeFile(wb, "PMA_Nesting_Summary.xlsx");
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Compact & Attractive Header Panel */}
      <div className={`rounded-xl shadow-md border overflow-hidden flex flex-col sm:flex-row ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        
        {/* Left: Total Quantity Metric */}
        <div className="flex-1 px-6 py-4 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-slate-700">
           <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-100 rounded text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <PieChart className="w-4 h-4" />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t.totalQty}
              </span>
           </div>
           <div className="flex items-baseline gap-2">
             <span className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
               {result.totalQty.toLocaleString()}
             </span>
             <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{t.pairs}</span>
           </div>
        </div>

        {/* Right: Big Action Button */}
        <div className="p-3 sm:w-auto w-full flex items-center bg-gray-50 dark:bg-slate-800/50">
           <button 
             onClick={exportToExcel}
             className="w-full sm:w-auto h-full min-h-[50px] px-8 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow transition-all transform active:scale-95 group"
           >
              <div className="p-1 bg-white/20 rounded group-hover:bg-white/30 transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg whitespace-nowrap">{t.exportExcel}</span>
           </button>
        </div>
      </div>

      {/* Table View */}
      <div className={`rounded-xl shadow-sm border flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`px-5 py-3 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50/50'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.sizeBreakdown}</h3>
          
          {/* Legend for Extras if they exist */}
          {result.infoColumns.length > 0 && (
             <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400">
                <span>Showing:</span>
                {result.infoColumns.map(col => (
                    <span key={col} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 dark:text-slate-300">{col}</span>
                ))}
             </div>
          )}
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className={`min-w-full divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
            <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <tr>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                  {t.size}
                </th>
                <th scope="col" className={`px-6 py-3 text-right text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                  {t.qty}
                </th>
                {/* Replaced % Share with Order Details */}
                <th scope="col" className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider w-1/2 ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                  {t.orderDetails}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700 bg-slate-800' : 'divide-gray-100 bg-white'}`}>
              {result.breakdown.map((item, idx) => {
                return (
                  <tr key={item.size} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-3 whitespace-nowrap text-sm font-medium border-r border-transparent ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                      {item.size}
                    </td>
                    <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {item.qty}
                    </td>
                     <td className="px-6 py-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                           {item.orderBreakdown.map((detail, dIdx) => (
                               <div 
                                key={dIdx} 
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                               >
                                   <span className="opacity-70 mr-1">{detail.orderNo}:</span>
                                   <span className={`${isDark ? 'text-white' : 'text-black'} font-mono`}>{detail.qty}</span>
                                   
                                   {/* Render Extra Info */}
                                   {detail.extraInfo && Object.keys(detail.extraInfo).length > 0 && (
                                       <span className={`ml-2 pl-2 border-l ${isDark ? 'border-slate-500 text-emerald-400' : 'border-gray-300 text-emerald-600'} flex gap-1`}>
                                           {Object.values(detail.extraInfo).map((val, vIdx) => (
                                               <span key={vIdx} className="max-w-[100px] truncate">{val}</span>
                                           ))}
                                       </span>
                                   )}
                               </div>
                           ))}
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className={`sticky bottom-0 z-10 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <tr>
                    <td className={`px-6 py-3 text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.grandTotal}</td>
                    <td className={`px-6 py-3 text-sm text-right font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.totalQty}</td>
                    <td className="px-6 py-3"></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NestingSummary;