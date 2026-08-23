import {
  CalendarDays,
  Camera,
  Car,
  Hotel,
  Plane,
  Repeat,
  ShieldCheck,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { BookingSearchField } from "@/types";

export interface ServiceConfig {
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
  tripTypes?: string[];
  showTravelers?: boolean;
  fields: BookingSearchField[];
}

export const SERVICES: ServiceConfig[] = [
  {
    slug: "flights",
    label: "Flights",
    icon: Plane,
    description: "Search live fares across GDS and NDC suppliers with negotiated markup applied.",
    tripTypes: ["One Way", "Round Trip", "Multi City"],
    showTravelers: true,
    fields: [
      { name: "origin", label: "From", type: "text", placeholder: "JFK - New York" },
      { name: "destination", label: "To", type: "text", placeholder: "DXB - Dubai" },
      { name: "depart", label: "Departure", type: "date" },
      { name: "return", label: "Return", type: "date" },
    ],
  },
  {
    slug: "hotels",
    label: "Hotels",
    icon: Hotel,
    description: "Contracted and dynamic rates from Expedia TAAP, Hotelbeds and TBO Holidays.",
    showTravelers: true,
    fields: [
      { name: "city", label: "City / Area", type: "text", placeholder: "Dubai, Marina" , colSpan: 2 },
      { name: "checkIn", label: "Check-in", type: "date" },
      { name: "checkOut", label: "Check-out", type: "date" },
    ],
  },
  {
    slug: "insurance",
    label: "Insurance",
    icon: ShieldCheck,
    description: "Schengen-compliant and worldwide travel insurance from AXA, Allianz and Zurich.",
    fields: [
      { name: "destination", label: "Destination zone", type: "select", options: ["Worldwide excl. USA", "Worldwide incl. USA", "Schengen Europe", "Asia Pacific", "GCC"] },
      { name: "tripType", label: "Trip type", type: "select", options: ["Single trip", "Annual multi-trip", "Student", "Senior"] },
      { name: "start", label: "Coverage start", type: "date" },
      { name: "end", label: "Coverage end", type: "date" },
    ],
  },
  {
    slug: "transfers",
    label: "Transfers",
    icon: Car,
    description: "Private, shared and luxury airport transfers with meet & greet.",
    fields: [
      { name: "from", label: "Pick-up location", type: "text", placeholder: "JFK Terminal 4", colSpan: 2 },
      { name: "to", label: "Drop-off location", type: "text", placeholder: "Manhattan, Times Square", colSpan: 2 },
      { name: "date", label: "Date", type: "date" },
      { name: "time", label: "Time", type: "select", options: ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"] },
      { name: "vehicle", label: "Vehicle", type: "select", options: ["Any", "Sedan", "SUV", "Van", "Minibus"] },
    ],
  },
  {
    slug: "holidays",
    label: "Holidays",
    icon: Sun,
    description: "Curated packages and FIT itineraries with dynamic pricing.",
    fields: [
      { name: "package", label: "Destination / Package", type: "text", placeholder: "Maldives, Bali, Europe...", colSpan: 2 },
      { name: "month", label: "Travel month", type: "select", options: ["September 2026", "October 2026", "November 2026", "December 2026"] },
      { name: "budget", label: "Budget per person", type: "select", options: ["Under $1,000", "$1,000 - $2,000", "$2,000 - $4,000", "Flexible"] },
      { name: "nights", label: "Nights", type: "select", options: ["3-5", "6-8", "9-12", "12+"] },
    ],
  },
  {
    slug: "sightseeing",
    label: "Sightseeing",
    icon: Camera,
    description: "Tours, attractions and experiences from vetted local DMCs.",
    fields: [
      { name: "city", label: "City", type: "text", placeholder: "Paris, Dubai, Istanbul...", colSpan: 2 },
      { name: "category", label: "Category", type: "select", options: ["All", "Attractions", "Day trips", "Shows & cruises", "Food tours"] },
      { name: "date", label: "Date", type: "date" },
      { name: "pax", label: "Guests", type: "select", options: ["1", "2", "3", "4", "5+"] },
    ],
  },
  {
    slug: "fix-departure",
    label: "Fix Departure",
    icon: CalendarDays,
    description: "Guaranteed group departures with fixed dates and allotment seats.",
    fields: [
      { name: "group", label: "Group / Departure", type: "select", options: ["Umrah · Dec 12", "Europe Explorer · May 04", "Turkey · Apr 18", "Azerbaijan · Oct 09"], colSpan: 2 },
      { name: "seats", label: "Seats needed", type: "select", options: ["1", "2", "3", "4", "5+"] },
      { name: "rooming", label: "Rooming", type: "select", options: ["Double", "Triple", "Quad", "Single (+supp.)"] },
    ],
  },
  {
    slug: "a-to-a",
    label: "A to A",
    icon: Repeat,
    description: "Airport-to-airport visa change services and same-day border runs.",
    fields: [
      { name: "country", label: "Visa change country", type: "select", options: ["UAE (Dubai)", "Malaysia (KUL)", "Thailand (BKK)", "Oman (MCT)", "Georgia (TBS)"], colSpan: 2 },
      { name: "duration", label: "New stay validity", type: "select", options: ["14 days", "21 days", "30 days", "45 days", "60 days"] },
      { name: "date", label: "Preferred date", type: "date" },
    ],
  },
];

export function serviceBySlug(slug?: string): ServiceConfig | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
