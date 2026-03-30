const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export interface RentCastValueEstimate {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  comparables?: RentCastComparable[];
}

export interface RentCastRentEstimate {
  rent: number;
  rentRangeLow: number;
  rentRangeHigh: number;
}

export interface RentCastComparable {
  formattedAddress: string;
  price?: number;
  rent?: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  propertyType: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  distance?: number;
}

export interface RentCastMarketStats {
  zipCode: string;
  medianPrice?: number;
  averagePrice?: number;
  medianRent?: number;
  averageRent?: number;
  averageDaysOnMarket?: number;
  totalListings?: number;
  saleListings?: number;
  rentalListings?: number;
  priceToRentRatio?: number;
  historicalPrices?: { date: string; value: number }[];
  historicalRents?: { date: string; value: number }[];
}

export interface RentCastData {
  valueEstimate: RentCastValueEstimate | null;
  rentEstimate: RentCastRentEstimate | null;
  marketStats: RentCastMarketStats | null;
  comparableSales: RentCastComparable[];
  lastFetched: string;
  error?: string;
}

async function rentcastFetch(endpoint: string, apiKey: string, params: Record<string, string>) {
  const url = new URL(`${RENTCAST_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RentCast API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function fetchValueEstimate(apiKey: string, address: string): Promise<RentCastValueEstimate> {
  return rentcastFetch('/avm/value', apiKey, { address });
}

export async function fetchRentEstimate(apiKey: string, address: string): Promise<RentCastRentEstimate> {
  return rentcastFetch('/avm/rent/long-term', apiKey, { address });
}

export async function fetchMarketStats(apiKey: string, zipCode: string): Promise<RentCastMarketStats> {
  return rentcastFetch('/markets', apiKey, { zipCode });
}

export async function fetchAllRentCastData(apiKey: string, address: string, zipCode: string): Promise<RentCastData> {
  const [valueEstimate, rentEstimate, marketStats] = await Promise.allSettled([
    fetchValueEstimate(apiKey, address),
    fetchRentEstimate(apiKey, address),
    fetchMarketStats(apiKey, zipCode),
  ]);

  return {
    valueEstimate: valueEstimate.status === 'fulfilled' ? valueEstimate.value : null,
    rentEstimate: rentEstimate.status === 'fulfilled' ? rentEstimate.value : null,
    marketStats: marketStats.status === 'fulfilled' ? marketStats.value : null,
    comparableSales:
      valueEstimate.status === 'fulfilled'
        ? (valueEstimate.value.comparables || []).slice(0, 5)
        : [],
    lastFetched: new Date().toISOString(),
  };
}
