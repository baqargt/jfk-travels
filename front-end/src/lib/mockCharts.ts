export interface MonthPoint {
  month: string;
  sales: number;
  expenses: number;
}

export const salesExpenses: MonthPoint[] = [
  { month: "Sep", sales: 312_400, expenses: 214_800 },
  { month: "Oct", sales: 358_200, expenses: 231_500 },
  { month: "Nov", sales: 402_900, expenses: 258_300 },
  { month: "Dec", sales: 521_700, expenses: 302_600 },
  { month: "Jan", sales: 366_100, expenses: 244_900 },
  { month: "Feb", sales: 389_500, expenses: 239_400 },
  { month: "Mar", sales: 441_300, expenses: 267_200 },
  { month: "Apr", sales: 473_800, expenses: 281_700 },
  { month: "May", sales: 458_600, expenses: 276_100 },
  { month: "Jun", sales: 509_200, expenses: 298_400 },
  { month: "Jul", sales: 562_500, expenses: 321_800 },
  { month: "Aug", sales: 486_320, expenses: 288_900 },
];

export interface QueryPoint {
  month: string;
  queries: number;
}

export const queriesFlow: QueryPoint[] = [
  { month: "Sep", queries: 96 },
  { month: "Oct", queries: 112 },
  { month: "Nov", queries: 128 },
  { month: "Dec", queries: 187 },
  { month: "Jan", queries: 104 },
  { month: "Feb", queries: 118 },
  { month: "Mar", queries: 142 },
  { month: "Apr", queries: 156 },
  { month: "May", queries: 149 },
  { month: "Jun", queries: 171 },
  { month: "Jul", queries: 204 },
  { month: "Aug", queries: 178 },
];

export interface DestinationPoint {
  name: string;
  covered: number;
  uncovered: number;
}

export const topDestinations: DestinationPoint[] = [
  { name: "Dubai", covered: 186, uncovered: 42 },
  { name: "Jeddah", covered: 154, uncovered: 31 },
  { name: "London", covered: 121, uncovered: 38 },
  { name: "Istanbul", covered: 98, uncovered: 27 },
  { name: "Toronto", covered: 87, uncovered: 34 },
  { name: "Bangkok", covered: 76, uncovered: 22 },
  { name: "Kuala Lumpur", covered: 64, uncovered: 18 },
  { name: "Manchester", covered: 52, uncovered: 15 },
];

export interface FunnelStage {
  stage: string;
  value: number;
}

export const queryFunnel: FunnelStage[] = [
  { stage: "New", value: 1240 },
  { stage: "Contacted", value: 962 },
  { stage: "Quoted", value: 718 },
  { stage: "Confirmed", value: 412 },
  { stage: "Ticketed", value: 286 },
];

export interface SourceSlice {
  name: string;
  value: number;
}

export const querySources: SourceSlice[] = [
  { name: "WhatsApp", value: 471 },
  { name: "Website", value: 268 },
  { name: "Walk-in", value: 196 },
  { name: "Phone", value: 148 },
  { name: "Referral", value: 92 },
  { name: "Facebook", value: 65 },
];

export interface RankRow {
  name: string;
  bookings: number;
}

export const topAgents: RankRow[] = [
  { name: "Kamran Ahmed", bookings: 218 },
  { name: "Hira Sheikh", bookings: 196 },
  { name: "Usman Tariq", bookings: 174 },
  { name: "Talha Butt", bookings: 158 },
  { name: "Nadia Iqbal", bookings: 141 },
  { name: "Saad Qureshi", bookings: 127 },
  { name: "Iqra Shahid", bookings: 113 },
  { name: "Maryam Javed", bookings: 98 },
  { name: "Fahad Mehmood", bookings: 86 },
  { name: "Rabia Anwar", bookings: 71 },
];

export const topSuppliers: RankRow[] = [
  { name: "Falcon Voyages", bookings: 242 },
  { name: "Skylink Distributors", bookings: 205 },
  { name: "Al-Saqib Travels", bookings: 188 },
  { name: "Paks Tours", bookings: 164 },
  { name: "Metro Ticketing Co.", bookings: 147 },
  { name: "Gulf Air Services", bookings: 129 },
  { name: "Crescent Holidays", bookings: 111 },
  { name: "Zenith Travel Mart", bookings: 94 },
  { name: "Orbit Consolidators", bookings: 82 },
  { name: "Prime Journeys", bookings: 68 },
];

export const topAirlines: RankRow[] = [
  { name: "Emirates", bookings: 284 },
  { name: "Qatar Airways", bookings: 251 },
  { name: "Saudia", bookings: 217 },
  { name: "Turkish Airlines", bookings: 183 },
  { name: "Etihad", bookings: 152 },
  { name: "PIA", bookings: 134 },
  { name: "FlyDubai", bookings: 117 },
  { name: "British Airways", bookings: 96 },
  { name: "Airblue", bookings: 78 },
  { name: "Oman Air", bookings: 64 },
];
