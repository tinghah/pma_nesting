export interface RawRow {
  [key: string]: string | number | null | undefined;
}

export interface ProcessedData {
  headers: string[];
  rows: RawRow[];
  sizeColumns: string[];
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
}

export interface SizeSummary {
  size: string;
  qty: number;
  orderBreakdown: OrderBreakdownItem[];
}

export interface NestingResult {
  totalQty: number;
  breakdown: SizeSummary[];
}