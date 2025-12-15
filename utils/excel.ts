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

        // Locate the header row. It might not be the first row.
        // We look for specific keywords mentioned in requirements.
        // "訂單編號\nOrder NO" or "指令\nQty"
        
        let headerRowIndex = 0;
        let headers: string[] = [];
        
        const targetOrderCol = "訂單編號\nOrder NO";
        const targetQtyCol = "指令\nQty";

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

        // Now re-parse or slice the data using these headers
        // We manually construct the objects to handle the offset
        const rawRows = rawJson.slice(headerRowIndex + 1);
        const rows: RawRow[] = rawRows.map(row => {
            const obj: RawRow = {};
            cleanHeaders.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        // Identify Size Columns
        // Logic: Size columns start AFTER the column containing 'Qty' (originally '指令\nQty')
        // We need to find the index of the column that *was* '指令\nQty'.
        // In our cleanHeaders, we kept the original name if it wasn't the Order NO one.
        // So we look for a header containing 'Qty'.
        
        const qtyColIndex = cleanHeaders.findIndex(h => h.includes('Qty') || h.includes('指令'));
        
        let sizeColumns: string[] = [];
        if (qtyColIndex !== -1 && qtyColIndex < cleanHeaders.length - 1) {
            sizeColumns = cleanHeaders.slice(qtyColIndex + 1);
            // Filter out obviously non-size columns if any (e.g., empty strings or 'Total')
            sizeColumns = sizeColumns.filter(s => s && !s.toLowerCase().includes('total'));
        } else {
            // Fallback: Look for short numeric-like headers (3K, 4, 5, etc.)
            sizeColumns = cleanHeaders.filter(h => /^[0-9]/.test(h));
        }

        // Extract unique SO Numbers for autocomplete/validation
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
