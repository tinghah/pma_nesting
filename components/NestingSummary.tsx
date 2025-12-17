import React from 'react';
import { Download, Layers, PieChart, List } from 'lucide-react';
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

  const hasArticle = !!result.articleHeader;
  const hasModel = !!result.modelHeader;
  const hasColor = !!result.colorHeader;

  const exportToExcel = () => {
    if (!result) return;
    const wb = XLSX.utils.book_new();
    
    // ----------------------------
    // SHEET 1: Nesting Breakdown
    // ----------------------------
    const headers = ["Size", "Total Qty"];
    if (hasArticle) headers.push(result.articleHeader!);
    if (hasModel) headers.push(result.modelHeader!);
    if (hasColor) headers.push(result.colorHeader!);
    headers.push("Order Details");

    const wsData = [
      headers,
      ...result.breakdown.map(item => {
        const row = [item.size, item.qty];
        if (hasArticle) row.push(item.articles.join('/'));
        if (hasModel) row.push(item.models.join('/'));
        if (hasColor) row.push(item.colors.join('/'));

        const details = item.orderBreakdown.map(b => {
            let str = `${b.orderNo}: ${b.qty}`;
            if (b.extraInfo && Object.keys(b.extraInfo).length > 0) {
                const extras = Object.entries(b.extraInfo)
                    .filter(([k]) => k !== result.articleHeader && k !== result.modelHeader && k !== result.colorHeader)
                    .map(([_, v]) => v)
                    .join('/');
                if (extras) str += ` (${extras})`;
            }
            return str;
        }).join(', ');
        row.push(details);
        return row;
      }),
      [
        "Grand Total", 
        result.totalQty, 
        hasArticle ? result.summaryArticles.join('/') : "", 
        hasModel ? result.summaryModels.join('/') : "", 
        hasColor ? result.summaryColors.join('/') : "",
        ""
      ]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-width adjustment approximation
    const wscols = [
        { wch: 10 }, // Size
        { wch: 12 }, // Total Qty
    ];
    if (hasArticle) wscols.push({ wch: 15 });
    if (hasModel) wscols.push({ wch: 15 });
    if (hasColor) wscols.push({ wch: 15 });
    wscols.push({ wch: 100 }); // Order Details

    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Nesting Breakdown");

    // ----------------------------
    // SHEET 2: Order Summary
    // ----------------------------
    const summaryHeaders = ["Order Number", "Total Quantity"];
    const summaryData: (string | number)[][] = [summaryHeaders];
    
    result.orderTotals.forEach(ot => {
        summaryData.push([ot.orderNo, ot.qty]);
    });

    // Spacer
    summaryData.push([]);
    summaryData.push(["Grand Total", result.totalQty]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Order Summary");

    XLSX.writeFile(wb, "PMA_Nesting_Result.xlsx");
  };

  const borderColor = isDark ? 'border-slate-600' : 'border-gray-300';
  const headerBg = isDark ? 'bg-slate-700' : 'bg-gray-100';
  const orderCount = result.orderTotals.length;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Metrics & Action Panel */}
      <div className={`rounded-xl shadow-md border overflow-hidden flex flex-col md:flex-row ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        
        {/* Metric Box: Per Order Breakdown & Grand Total */}
        
        {/* 1. Per Order List Section (Priority: First) */}
        <div className={`flex-1 p-4 flex flex-col border-b md:border-b-0 md:border-r ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
             <div className="flex items-center gap-2 mb-2">
                <List className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                    {t.perOrderQty}
                </span>
             </div>
             {/* Dynamic Height, No Scrollbar limitation as requested */}
             <div className="pr-2">
                <div className="grid grid-cols-1 gap-y-1">
                  {result.orderTotals.map((ot) => (
                      <div key={ot.orderNo} className={`flex justify-between items-center text-xs border-b pb-1 last:border-0 ${isDark ? 'border-slate-700' : 'border-gray-200/60'}`}>
                          <span className={`font-medium truncate mr-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{ot.orderNo}</span>
                          <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-600'}`}>{ot.qty}</span>
                      </div>
                  ))}
                </div>
             </div>
        </div>

        {/* 2. Grand Total Section (Priority: Second) */}
        <div className={`p-4 flex flex-col justify-center min-w-[180px] border-b md:border-b-0 md:border-r ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <PieChart className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t.totalQty}
                </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.totalQty.toLocaleString()}
                </span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{t.pairs}</span>
            </div>
        </div>

        {/* Right: Big Action Button */}
        <div className={`p-3 md:w-auto w-full flex items-center justify-center ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
           <button 
             onClick={exportToExcel}
             className="w-full md:w-auto h-full min-h-[50px] px-6 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow transition-all transform active:scale-95 group"
           >
              <div className="p-1 bg-white/20 rounded group-hover:bg-white/30 transition-colors">
                <Download className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm whitespace-nowrap">{t.exportExcel}</span>
           </button>
        </div>
      </div>

      {/* Table View */}
      <div className={`rounded-xl shadow-sm border flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`px-5 py-3 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50/50'}`}>
          <h3 className={`text-sm font-semibold flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
             {t.summaryTitlePrefix} <span className="text-blue-600 dark:text-blue-400 mx-1">{orderCount}</span> {t.summaryTitleSuffix}
          </h3>
          
          {/* Legend for Extras if they exist */}
          {result.infoColumns.length > 0 && (
             <div className={`flex items-center gap-2 text-[10px] hidden sm:flex ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>Info:</span>
                {result.infoColumns
                  .filter(c => c !== result.articleHeader && c !== result.modelHeader && c !== result.colorHeader)
                  .map(col => (
                    <span key={col} className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{col}</span>
                ))}
             </div>
          )}
        </div>
        
        {/* Table Container with specific max-height for scrolling ~10 rows */}
        <div className="overflow-y-auto custom-scrollbar max-h-[400px]">
          <table className={`min-w-full border-collapse`}>
            <thead className={`sticky top-0 z-10 ${headerBg}`}>
              <tr>
                <th scope="col" className={`px-4 py-2 text-left text-xs font-bold uppercase tracking-wider border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {t.size}
                </th>
                <th scope="col" className={`px-4 py-2 text-right text-xs font-bold uppercase tracking-wider border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {t.qty}
                </th>
                {hasArticle && (
                    <th scope="col" className={`px-4 py-2 text-left text-xs font-bold uppercase tracking-wider border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        Article
                    </th>
                )}
                {hasModel && (
                    <th scope="col" className={`px-4 py-2 text-left text-xs font-bold uppercase tracking-wider border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        Model
                    </th>
                )}
                {hasColor && (
                    <th scope="col" className={`px-4 py-2 text-left text-xs font-bold uppercase tracking-wider border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        Colour
                    </th>
                )}
                <th scope="col" className={`px-4 py-2 text-left text-xs font-bold uppercase tracking-wider w-1/2 border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {t.orderDetails}
                </th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              {result.breakdown.map((item, idx) => {
                // Color Logic
                const articleColor = item.articles.length === 1 
                    ? (isDark ? 'text-green-400' : 'text-green-600') 
                    : (isDark ? 'text-red-400' : 'text-red-600');
                
                const modelColor = item.models.length === 1 
                    ? (isDark ? 'text-green-400' : 'text-green-600') 
                    : (isDark ? 'text-red-400' : 'text-red-600');
                
                const colorColor = item.colors.length === 1 
                    ? (isDark ? 'text-green-400' : 'text-green-600') 
                    : (isDark ? 'text-red-400' : 'text-red-600');

                return (
                  <tr key={item.size} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-1.5 whitespace-nowrap text-sm font-medium border ${borderColor} ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                      {item.size}
                    </td>
                    <td className={`px-4 py-1.5 whitespace-nowrap text-sm text-right font-mono font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {item.qty}
                    </td>
                    
                    {/* Article Column */}
                    {hasArticle && (
                        <td className={`px-4 py-1.5 whitespace-nowrap text-xs font-semibold border ${borderColor} ${articleColor}`}>
                            {item.articles.join('/')}
                        </td>
                    )}

                    {/* Model Column */}
                    {hasModel && (
                        <td className={`px-4 py-1.5 whitespace-nowrap text-xs font-semibold border ${borderColor} ${modelColor}`}>
                            {item.models.join('/')}
                        </td>
                    )}

                    {/* Color Column */}
                    {hasColor && (
                        <td className={`px-4 py-1.5 whitespace-nowrap text-xs font-semibold border ${borderColor} ${colorColor}`}>
                            {item.colors.join('/')}
                        </td>
                    )}

                     <td className={`px-4 py-1.5 text-sm border ${borderColor}`}>
                        <div className="flex flex-wrap gap-2">
                           {item.orderBreakdown.map((detail, dIdx) => (
                               <div 
                                key={dIdx} 
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                               >
                                   <span className="opacity-70 mr-1">{detail.orderNo}:</span>
                                   <span className={`${isDark ? 'text-white' : 'text-black'} font-mono`}>{detail.qty}</span>
                                   
                                   {/* Render Extra Info excluding Article/Model/Color */}
                                   {detail.extraInfo && Object.keys(detail.extraInfo).length > 0 && (
                                       <span className={`ml-2 pl-2 border-l ${isDark ? 'border-slate-500 text-emerald-400' : 'border-gray-300 text-emerald-600'} flex gap-1`}>
                                           {Object.entries(detail.extraInfo)
                                              .filter(([k]) => k !== result.articleHeader && k !== result.modelHeader && k !== result.colorHeader)
                                              .map(([_, val], vIdx) => (
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
            <tfoot className={`sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <tr>
                    <td className={`px-4 py-2 text-sm font-bold border ${borderColor} ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.grandTotal}</td>
                    <td className={`px-4 py-2 text-sm text-right font-mono font-bold border ${borderColor} ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.totalQty}</td>
                    {hasArticle && (
                        <td className={`px-4 py-2 text-xs font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {result.summaryArticles.join(' / ')}
                        </td>
                    )}
                    {hasModel && (
                        <td className={`px-4 py-2 text-xs font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {result.summaryModels.join(' / ')}
                        </td>
                    )}
                    {hasColor && (
                        <td className={`px-4 py-2 text-xs font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {result.summaryColors.join(' / ')}
                        </td>
                    )}
                    <td className={`px-4 py-2 border ${borderColor}`}></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NestingSummary;