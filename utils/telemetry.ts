/**
 * Telemetry Service for PMA Nesting v2.4
 * Stores logs locally in browser storage and provides CSV export.
 */

const LOG_STORAGE_KEY = 'pma_usage_audit_v24';

export interface TelemetryLog {
  timestamp: string;
  ip: string;
  event: 'APP_OPEN' | 'GENERATE_NESTING' | 'EXPORT_EXCEL';
  so_list: string;
  total_pairs: number;
  order_count: number;
  user_agent: string;
}

/**
 * Fetches the public IP address of the client.
 */
const getClientIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Main Logging function
 */
export const logUsage = async (event: TelemetryLog['event'], details: Record<string, any> = {}) => {
  try {
    const ip = await getClientIp();
    
    // Create flat log entry for CSV
    const logEntry: TelemetryLog = {
      timestamp: new Date().toLocaleString(),
      ip,
      event,
      so_list: details.selectedOrders ? details.selectedOrders.join(';') : (details.datasetName || ''),
      total_pairs: details.totalQty || 0,
      order_count: details.orderCount || 0,
      user_agent: navigator.userAgent.replace(/,/g, '') // Remove commas for CSV safety
    };

    // 1. Store in LocalStorage (The "Local Month" Buffer)
    const existingLogsRaw = localStorage.getItem(LOG_STORAGE_KEY);
    const logs: TelemetryLog[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    
    // Keep only last 1000 logs to prevent storage bloat
    logs.unshift(logEntry);
    if (logs.length > 1000) logs.pop();
    
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));

    // 2. Attempt to send to local Python Logger (Optional fallback)
    fetch('http://localhost:8000/log-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    }).catch(() => {
        /* Silently fail if local python server is not running */
    });

  } catch (err) {
    console.warn("Logging error:", err);
  }
};

/**
 * Helper to export browser-stored logs as CSV
 */
export const downloadAuditCSV = () => {
    const existingLogsRaw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!existingLogsRaw) {
        alert("No logs found in this browser.");
        return;
    }

    const logs: TelemetryLog[] = JSON.parse(existingLogsRaw);
    
    // CSV Header
    const headers = ["Timestamp", "IP", "Event", "SO_List", "Total_Pairs", "Order_Count", "User_Agent"];
    
    // Rows
    const rows = logs.map(l => [
        l.timestamp,
        l.ip,
        l.event,
        `"${l.so_list}"`, // Quote for potential semicolons
        l.total_pairs,
        l.order_count,
        `"${l.user_agent}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `PMA_Usage_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};