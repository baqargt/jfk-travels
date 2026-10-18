import type { BookingResult } from "@/types";

export const airlines = [
  "Emirates",
  "Qatar Airways",
  "Etihad",
  "Turkish Airlines",
  "Lufthansa",
  "British Airways",
];

export const cabins = ["Economy", "Premium Economy", "Business", "First"];

export const countries = [
  "United States", "United Kingdom", "Pakistan", "UAE", "Saudi Arabia", "India", "Other",
];

const pick = <T,>(items: readonly T[], index: number): T => items[index % items.length];

const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};

const displayDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

const flightRoutes = [
  ["JFK", "New York", "DXB", "Dubai"], ["JFK", "New York", "LHR", "London"],
  ["DXB", "Dubai", "ISB", "Islamabad"], ["KHI", "Karachi", "JED", "Jeddah"],
  ["LHE", "Lahore", "IST", "Istanbul"], ["ISB", "Islamabad", "DOH", "Doha"],
  ["LHR", "London", "CDG", "Paris"], ["DXB", "Dubai", "BKK", "Bangkok"],
] as const;
const flightDates = ["2026-10-20", "2026-10-24", "2026-11-03", "2026-11-12", "2026-12-05"];
const flightTimes = ["01:20", "06:45", "09:15", "16:40", "22:30"];
const stopCities = ["", "DOH", "AUH", "IST", "LHR"];
const fareTypes = ["Refundable", "Non-Refundable"];
const baggageOptions = ["Include Bags", "No Baggage"];
const fareSources = ["GDS", "NDC", "Budget", "Consolidator"];

const flights: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [originCode, originCity, destinationCode, destinationCity] = pick(flightRoutes, index);
  const airline = pick(airlines, index);
  const cabin = pick(cabins, Math.floor(index / 2));
  const depart = pick(flightDates, index);
  const returnDate = addDays(depart, 7 + (index % 4));
  const time = pick(flightTimes, index);
  const stopCity = pick(stopCities, index);
  const direct = stopCity === "";
  const flightNumber = 120 + index * 7;
  const durationHours = 6 + (index % 10);

  return {
    id: `FL-${String(index + 1).padStart(3, "0")}`,
    title: `${airline} ${airline.split(" ").map((word) => word[0]).join("")}${flightNumber}`,
    subtitle: `${originCode} → ${destinationCode}${direct ? " · Non-stop" : ` via ${stopCity}`}`,
    rating: Number((4.1 + (index % 8) / 10).toFixed(1)),
    price: 690 + index * 73 + (cabin === "Business" ? 900 : cabin === "First" ? 1700 : 0),
    badge: index === 0 ? "Cheapest" : index === 1 ? "Best Value" : cabin === "Business" ? "Business" : undefined,
    meta: [
      ["Departs", `${time} · ${displayDate(depart)}`], ["Duration", `${durationHours}h ${15 + (index % 4) * 10}m`],
      ["Cabin", cabin], [direct ? "Baggage" : "Stop", direct ? (index % 2 ? "1 × 23kg" : "2 × 23kg") : `${1 + (index % 3)}h ${stopCity}`],
    ],
    legs: [
      { origin: `${originCode} ${originCity}`, destination: `${destinationCode} ${destinationCity}`, depart, cabin, airline, time },
      { origin: `${destinationCode} ${destinationCity}`, destination: `${originCode} ${originCity}`, depart: returnDate, cabin, airline, time: pick(flightTimes, index + 2) },
    ],
    search: {
      stopType: direct ? "Direct" : "City", stopCity, fareType: pick(fareTypes, index),
      baggage: pick(baggageOptions, Math.floor(index / 2)), fareSource: pick(fareSources, index), capacity: 2 + (index % 9),
    },
  };
});

const hotelSeeds = [
  ["Dubai", "Palm Jumeirah", "Atlantis The Palm"], ["New York", "Times Square", "Marriott Marquis"],
  ["London", "Strand", "The Savoy"], ["Paris", "Trocadéro", "Shangri-La Paris"],
  ["Istanbul", "Maçka", "Park Hyatt Istanbul"],
] as const;
const roomTypes = ["Deluxe King", "Queen Deluxe", "Superior Twin", "Family Suite", "Executive King"];
const boards = ["Room only", "Breakfast", "Half board"];

const hotels: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [city, area, hotel] = pick(hotelSeeds, index);
  const room = pick(roomTypes, index);
  const board = pick(boards, index);
  const roomsAvailable = 1 + (index % 4);
  return {
    id: `HO-${String(index + 1).padStart(3, "0")}`,
    title: index < hotelSeeds.length ? hotel : `${hotel} ${index < 15 ? "Residence" : "Suites"}`,
    subtitle: `${city} · ${area}`,
    rating: Number((8.1 + (index % 14) / 10).toFixed(1)), price: 85 + index * 19, unit: "/night",
    badge: index % 9 === 0 ? "5 Star" : index % 11 === 0 ? "Luxury" : index % 7 === 0 ? "Budget" : undefined,
    meta: [["Room", room], ["Board", board], ["Cancel", index % 3 ? "Free cancellation" : "Non-refundable"], ["Pay", index % 2 ? "At hotel" : "Prepaid"]],
    search: {
      city: `${city} ${area}`, availableFrom: addDays("2026-09-01", index % 20),
      availableTo: addDays("2027-03-31", -(index % 15)), adultCapacity: 2 + (index % 4),
      childCapacity: index % 4, roomsAvailable,
    },
  };
});

const insuranceSeeds = [
  ["Global Voyager", "AXA", "Worldwide excl. USA", "Single trip"],
  ["World Elite", "Allianz", "Worldwide incl. USA", "Annual multi-trip"],
  ["Schengen Secure", "Allianz", "Schengen Europe", "Single trip"],
  ["Asia Explorer", "Zurich", "Asia Pacific", "Single trip"],
  ["GCC Essential", "Trawick", "GCC", "Single trip"],
  ["Student Shield", "AXA", "Worldwide excl. USA", "Student"],
  ["Senior Care 70+", "Allianz", "Worldwide incl. USA", "Senior"],
] as const;

const insurance: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [plan, provider, zone, tripType] = pick(insuranceSeeds, index);
  const coverage = 50_000 + (index % 5) * 50_000;
  return {
    id: `IN-${String(index + 1).padStart(3, "0")}`, title: index < insuranceSeeds.length ? plan : `${plan} ${index + 1}`,
    subtitle: `${provider} · ${zone}`, rating: Number((4.1 + (index % 8) / 10).toFixed(1)),
    price: 24 + index * 4, unit: "/pax", badge: index === 0 ? "Popular" : index === 3 ? "Cheapest" : undefined,
    meta: [["Coverage", `$${coverage.toLocaleString()}`], ["Validity", `${15 + (index % 6) * 15} days`], ["Claims", "24/7 assistance"], ["COVID", index % 4 ? "Covered" : "Optional"]],
    search: { destination: zone, tripType, availableFrom: addDays("2026-09-01", index % 10), availableTo: "2027-12-31" },
  };
});

const transferRoutes = [
  ["JFK Terminal 4", "Manhattan Times Square"], ["DXB Terminal 3", "Dubai Marina"],
  ["LHR Terminal 5", "Central London"], ["ISB Airport", "Murree Hills"], ["JED Airport", "Makkah Hotel"],
] as const;
const vehicles = ["Sedan", "SUV", "Van", "Minibus"];
const transferDates = ["2026-10-20", "2026-10-24", "2026-11-03", "2026-11-12", "2026-12-05"];
const transferTimes = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];

const transfers: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [from, to] = pick(transferRoutes, index);
  const vehicle = pick(vehicles, index);
  const capacity = vehicle === "Sedan" ? 3 : vehicle === "SUV" ? 6 : vehicle === "Van" ? 10 : 14;
  return {
    id: `TR-${String(index + 1).padStart(3, "0")}`,
    title: `${index % 3 === 0 ? "Private" : index % 3 === 1 ? "Executive" : "Shared"} ${vehicle}`,
    subtitle: `${from} → ${to}`, rating: Number((4 + (index % 9) / 10).toFixed(1)), price: 35 + index * 9,
    badge: index === 0 ? "Most booked" : index === 2 ? "Cheapest" : undefined,
    meta: [["Pax", `Up to ${capacity}`], ["Luggage", `${Math.max(2, capacity - 1)} bags`], ["Meet & greet", index % 2 ? "Optional" : "Included"], ["Wait time", `${45 + (index % 3) * 15} min free`]],
    search: { from, to, date: pick(transferDates, index), time: pick(transferTimes, index), vehicle, capacity },
  };
});

const holidaySeeds = [
  ["Maldives Escape", "Maldives", 6], ["Dubai Delights", "Dubai", 5], ["Swiss Alps Tour", "Switzerland", 7],
  ["Bali Retreat", "Bali", 8], ["Turkey Grand Tour", "Turkey", 10],
] as const;
const holidayMonths = ["September 2026", "October 2026", "November 2026", "December 2026"];

const holidays: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [title, destination, baseNights] = pick(holidaySeeds, index);
  const nights = baseNights + (index % 3);
  const price = 650 + index * 145;
  return {
    id: `HD-${String(index + 1).padStart(3, "0")}`, title: index < holidaySeeds.length ? title : `${title} ${index < 15 ? "Plus" : "Signature"}`,
    subtitle: `${nights}N ${destination} · ${index % 2 ? "Breakfast" : "Half Board"}`,
    rating: Number((4.3 + (index % 7) / 10).toFixed(1)), price, unit: "/person",
    badge: index % 10 === 0 ? "Honeymoon" : index % 9 === 0 ? "Group" : undefined,
    meta: [["Nights", String(nights)], ["Flights", index % 2 ? "Excluded" : "Included"], ["Transfers", "Included"], ["Meals", index % 2 ? "Breakfast" : "Half board"]],
    search: { package: `${title} ${destination}`, month: pick(holidayMonths, index), price, nights },
  };
});

const sightseeingSeeds = [
  ["Burj Khalifa AT THE TOP", "Dubai", "Attractions"], ["Red Dunes Desert Safari", "Dubai", "Day trips"],
  ["Louvre Museum Guided", "Paris", "Attractions"], ["Bosphorus Dinner Cruise", "Istanbul", "Shows & cruises"],
  ["Old City Food Walk", "Istanbul", "Food tours"],
] as const;
const sightseeingDates = ["2026-10-20", "2026-10-24", "2026-11-03", "2026-11-12", "2026-12-05"];

const sightseeing: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [experience, city, category] = pick(sightseeingSeeds, index);
  const capacity = 1 + (index % 8);
  return {
    id: `SG-${String(index + 1).padStart(3, "0")}`, title: index < sightseeingSeeds.length ? experience : `${experience} ${index < 15 ? "Experience" : "Premium"}`,
    subtitle: `${city} · ${category}`, rating: Number((4.2 + (index % 8) / 10).toFixed(1)), price: 25 + index * 8, unit: "/person",
    badge: index % 8 === 0 ? "Fast track" : undefined,
    meta: [["Duration", `${2 + (index % 7)} hrs`], ["Group", `Up to ${capacity}`], ["Language", "English / Urdu"], ["Ticket", "Instant e-ticket"]],
    search: { city, category, date: pick(sightseeingDates, index), capacity },
  };
});

const departureSeeds = [
  ["Umrah · Dec 12", "Umrah Group · December", "Makkah + Madinah", "2026-12-12", "JFK"],
  ["Europe Explorer · May 04", "Europe Explorer", "Paris · Swiss · Italy", "2027-05-04", "JFK"],
  ["Turkey · Apr 18", "Turkey Discovery", "Istanbul + Cappadocia", "2027-04-18", "LHE"],
  ["Azerbaijan · Oct 09", "Azerbaijan Weekend", "Baku city break", "2026-10-09", "DXB"],
] as const;
const roomingOptions = ["Double", "Triple", "Quad", "Single (+supp.)"];

const fixDepartures: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [group, title, destination, departure, origin] = pick(departureSeeds, index);
  const seatsAvailable = 1 + (index * 3) % 40;
  const rooming = pick(roomingOptions, index);
  return {
    id: `FD-${String(index + 1).padStart(3, "0")}`, title: index < departureSeeds.length ? title : `${title} Batch ${Math.floor(index / 4) + 1}`,
    subtitle: `${destination} · ${7 + (index % 8)} nights`, rating: Number((4.2 + (index % 8) / 10).toFixed(1)),
    price: 850 + index * 135, unit: "/person", badge: `${seatsAvailable} seats left`,
    meta: [["Departure", `${displayDate(departure)} · ${origin}`], ["Rooming", rooming], ["Hotels", "4★ central"], ["Tour leader", "Included"]],
    search: { group, seatsAvailable, rooming },
  };
});

const aToASeeds = [
  ["UAE (Dubai)", "Dubai Visa Run", "DXB"], ["Malaysia (KUL)", "Malaysia A to A", "KUL"],
  ["Thailand (BKK)", "Thailand Visa Change", "BKK"], ["Oman (MCT)", "Oman Fly-Fly", "MCT"],
  ["Georgia (TBS)", "Georgia A to A", "TBS"],
] as const;
const validityOptions = ["14 days", "21 days", "30 days", "45 days", "60 days"];
const aToADates = ["2026-10-20", "2026-10-24", "2026-11-03", "2026-11-12", "2026-12-05"];

const aToA: BookingResult[] = Array.from({ length: 25 }, (_, index) => {
  const [country, title, airport] = pick(aToASeeds, index);
  const duration = pick(validityOptions, index);
  return {
    id: `AA-${String(index + 1).padStart(3, "0")}`, title: index < aToASeeds.length ? title : `${title} ${index < 15 ? "Express" : "Plus"}`,
    subtitle: `${airport} visa change · ${duration}`, rating: Number((4.1 + (index % 8) / 10).toFixed(1)), price: 180 + index * 17,
    badge: index === 0 ? "Same day" : index === 2 ? "Cheapest" : undefined,
    meta: [["Processing", `${24 + (index % 3) * 24} hrs`], ["Stay", index % 2 ? "Airport transit" : "Hotel included"], ["Insurance", "Included"], ["Support", "24/7 line"]],
    search: { country, duration, date: pick(aToADates, index) },
  };
});

export const bookingResults: Record<string, BookingResult[]> = {
  flights, hotels, insurance, transfers, holidays, sightseeing,
  "fix-departure": fixDepartures,
  "a-to-a": aToA,
};
