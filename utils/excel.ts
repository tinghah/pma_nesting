import * as XLSX from 'xlsx';
import { ProcessedData, RawRow } from '../types';

export const parseExcelFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse JSON with header: 1 to get raw array of arrays first to analyze headers
        const rawJson = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        if (!rawJson || rawJson.length === 0) {
          reject(new Error("Sheet is empty"));
          return;
        }

        // Locate the header row.
        let headerRowIndex = 0;
        let headers: string[] = [];
        
        // Simple heuristic: find row containing the complex headers
        for (let i = 0; i < Math.min(rawJson.length, 20); i++) {
           const row = rawJson[i];
           if (row.some(cell => typeof cell === 'string' && (cell.includes('Order NO') || cell.includes('Order No')))) {
             headerRowIndex = i;
             headers = row;
             break;
           }
        }
        
        if (headers.length === 0) {
            // Fallback: Use first row
            headers = rawJson[0];
        }

        // Map headers to clean names
        const cleanHeaders = headers.map(h => {
            if (!h) return `Col_${Math.random()}`; // Handle empty headers
            if (h.toString().includes('Order NO') || h.toString().includes('Order No')) return 'SO_Number';
            return h.toString();
        });

        const rawRows = rawJson.slice(headerRowIndex + 1);
        const rows: RawRow[] = rawRows.map(row => {
            const obj: RawRow = {};
            cleanHeaders.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        // Identify Size Columns
        const qtyColIndex = cleanHeaders.findIndex(h => h.includes('Qty') || h.includes('指令'));
        
        let potentialSizeCols: string[] = [];
        
        // Get candidates either after Qty column or assume all numeric-like columns
        if (qtyColIndex !== -1 && qtyColIndex < cleanHeaders.length - 1) {
            potentialSizeCols = cleanHeaders.slice(qtyColIndex + 1);
        } else {
            potentialSizeCols = cleanHeaders; 
        }

        const sizeColumns = potentialSizeCols.filter(header => {
            if (!header) return false;
            const h = String(header).trim();
            const lowerH = h.toLowerCase();

            // Explicit Exclusions
            if (['total', 'qty', 'order', 'so_number'].some(ex => lowerH.includes(ex))) return false;

            // Check for Chinese characters (CJK Unified Ideographs)
            const hasChinese = /[\u4e00-\u9fff]/.test(h);

            // Logic:
            // 1. If it contains "UK" (case insensitive), it is likely a size (e.g., "4 UK").
            // 2. If it is purely numeric (with optional decimals), it is a size (e.g., "3.5", "10").
            // 3. If it has Chinese characters and NO "UK", it is likely a metadata column (e.g., "備註").
            
            if (lowerH.includes('uk')) return true;

            if (hasChinese) {
                // Contains Chinese but no UK -> Reject
                return false;
            }

            // Check if it looks like a number (e.g. "3", "3.5", "11")
            // Allow digits and dots.
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
            sizeColumns,
            soNumbers
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};