export interface RawRow {
  [key: string]: string | number | null | undefined;
}

export interface ProcessedData {
  headers: string[];
  rows: RawRow[];
  sizeColumns: string[]; // Columns treated as numeric quantities
  infoColumns: string[]; // Columns treated as metadata (e.g., Color, Gender)
  soNumbers: string[];
}

export interface SavedDataset extends ProcessedData {
  id: string;
  name: string;
  createdAt: number;
}

export interface OrderBreakdownItem {
  orderNo: string;
  qty: number;
  extraInfo?: Record<string, string | number>; // Stores data from infoColumns
}

export interface SizeSummary {
  size: string;
  qty: number;
  orderBreakdown: OrderBreakdownItem[];
}

export interface NestingResult {
  totalQty: number;
  breakdown: SizeSummary[];
  infoColumns: string[]; // Pass this through to the result for display purposes
}