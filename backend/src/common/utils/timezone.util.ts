/**
 * Timezone Utility untuk WIB (UTC+7)
 * Semua fungsi tanggal/waktu harus menggunakan WIB
 */

export class TimezoneUtil {
  /**
   * Get current date/time in WIB (Asia/Jakarta timezone)
   */
  static nowWIB(): Date {
    const now = new Date();
    // Convert to WIB by adjusting timezone
    const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return wibTime;
  }

  /**
   * Format date to WIB datetime string
   * Format: YYYY-MM-DDTHH:mm:ss+07:00
   */
  static formatWIB(date: Date): string {
    const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const year = wibDate.getFullYear();
    const month = String(wibDate.getMonth() + 1).padStart(2, '0');
    const day = String(wibDate.getDate()).padStart(2, '0');
    const hours = String(wibDate.getHours()).padStart(2, '0');
    const minutes = String(wibDate.getMinutes()).padStart(2, '0');
    const seconds = String(wibDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
  }

  /**
   * Get month string in YYYY-MM format
   */
  static getMonthString(date: Date = new Date()): string {
    const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const year = wibDate.getFullYear();
    const month = String(wibDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Parse month string (YYYY-MM) to Date
   */
  static parseMonthString(monthStr: string): Date {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  /**
   * Get array of months between two dates
   * Returns array of strings in YYYY-MM format
   */
  static getMonthsBetween(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    const current = new Date(startDate);
    current.setDate(1); // Set to first day of month
    
    const end = new Date(endDate);
    end.setDate(1);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  /**
   * Get current month string
   */
  static getCurrentMonth(): string {
    return this.getMonthString(this.nowWIB());
  }
}
