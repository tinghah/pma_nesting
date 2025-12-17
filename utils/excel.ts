import * as XLSX from 'xlsx';
import { ProcessedData, RawRow } from '../types';

export const parseExcelFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        if (!rawJson || rawJson.length === 0) {
          reject(new Error("Sheet is empty"));
          return;
        }

        // Locate the header row.
        let headerRowIndex = 0;
        let headers: string[] = [];
        
        // Simple heuristic: find row containing 'Order NO'
        for (let i = 0; i < Math.min(rawJson.length, 20); i++) {
           const row = rawJson[i];
           if (row && Array.isArray(row) && row.some(cell => cell && String(cell).match(/Order\s*N[oO]/i))) {
             headerRowIndex = i;
             headers = row;
             break;
           }
        }
        
        if (headers.length === 0) {
            headers = rawJson[0] || [];
        }

        // Clean Headers & ensure uniqueness
        const usedHeaders = new Set<string>();
        const cleanHeaders = headers.map(h => {
            let base = h ? String(h).trim() : `Col`;
            
            // Standardize SO Number column
            if (base.match(/Order\s*N[oO]/i)) base = 'SO_Number';

            // Handle duplicates
            let unique = base;
            let counter = 1;
            while (usedHeaders.has(unique)) {
                unique = `${base}_${counter++}`;
            }
            usedHeaders.add(unique);
            return unique;
        });

        const rawRows = rawJson.slice(headerRowIndex + 1);
        const rows: RawRow[] = rawRows.map(row => {
            const obj: RawRow = {};
            cleanHeaders.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        // Heuristic: Identify Size Columns
        const qtyColIndex = cleanHeaders.findIndex(h => h.match(/Qty|指令/i));
        
        const suggestedSizeColumns = cleanHeaders.filter(header => {
            if (!header) return false;
            const h = header;
            const lowerH = h.toLowerCase();

            // Always exclude specific metadata
            if (['total', 'qty', 'order', 'so_number', 'po', 'article'].some(ex => lowerH.includes(ex))) return false;

            // Include if it looks like a size
            const hasChinese = /[\u4e00-\u9fff]/.test(h);
            if (lowerH.includes('uk') || lowerH.includes('us')) return true;
            if (hasChinese) return false; // Usually metadata if Chinese and no "UK"
            
            // Is numeric-ish (3, 3.5, 10, etc)
            if (/^[\d\.]+$/.test(h)) return true;

            return false;
        });

        // Extract unique SO Numbers
        const soNumbers = Array.from(new Set(
            rows
            .map(r => r['SO_Number'])
            .filter(Boolean)
            .map(String)
        ));

        resolve({
            headers: cleanHeaders,
            rows,
            sizeColumns: suggestedSizeColumns, // These are just suggestions now
            infoColumns: [], // Default to none, let user choose
            soNumbers
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};