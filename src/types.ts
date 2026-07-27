export interface GasPriceData {
  todaysDate: string;
  priceToday: number;
  dateTomorrow: string;
  priceTomorrow: number;
  delta: number;
}

export interface DashboardResponse {
  data: GasPriceData | null;
  lastScrapeTime: string | null;
  error: string | null;
}
