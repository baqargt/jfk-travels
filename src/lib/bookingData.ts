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

export const bookingResults: Record<string, BookingResult[]> = {
  flights: [
    { id: "FL-1", title: "Emirates EK202", subtitle: "JFK → DXB · Non-stop", rating: 4.7, price: 1180, badge: "Cheapest", meta: [["Departs", "22:30 · Sep 02"], ["Duration", "12h 45m"], ["Cabin", "Economy"], ["Baggage", "2 × 23kg"]] },
    { id: "FL-2", title: "Qatar Airways QR701", subtitle: "JFK → DXB via DOH", rating: 4.8, price: 1245, badge: "Best Value", meta: [["Departs", "01:20 · Sep 03"], ["Duration", "16h 10m"], ["Cabin", "Economy"], ["Stop", "1h 50m DOH"]] },
    { id: "FL-3", title: "Etihad EY102", subtitle: "JFK → DXB via AUH", rating: 4.5, price: 1098, meta: [["Departs", "09:15 · Sep 02"], ["Duration", "17h 05m"], ["Cabin", "Economy"], ["Stop", "2h 20m AUH"]] },
    { id: "FL-4", title: "Turkish Airlines TK004", subtitle: "JFK → DXB via IST", rating: 4.4, price: 1012, meta: [["Departs", "16:40 · Sep 02"], ["Duration", "18h 30m"], ["Cabin", "Economy"], ["Stop", "3h 05m IST"]] },
    { id: "FL-5", title: "British Airways BA106", subtitle: "JFK → DXB via LHR", rating: 4.3, price: 1340, meta: [["Departs", "18:25 · Sep 02"], ["Duration", "19h 15m"], ["Cabin", "Premium"], ["Stop", "4h 10m LHR"]] },
    { id: "FL-6", title: "Emirates EK204", subtitle: "JFK → DXB · Non-stop", rating: 4.7, price: 2890, badge: "Business", meta: [["Departs", "23:20 · Sep 02"], ["Duration", "12h 35m"], ["Cabin", "Business"], ["Lounge", "Included"]] },
  ],
  hotels: [
    { id: "HO-1", title: "Atlantis The Palm", subtitle: "Dubai · Palm Jumeirah", rating: 9.2, price: 480, unit: "/night", badge: "5 Star", meta: [["Room", "Deluxe King"], ["Board", "Breakfast"], ["Cancel", "Free till Aug 30"], ["Pay", "At hotel"]] },
    { id: "HO-2", title: "Marriott Marquis", subtitle: "New York · Times Square", rating: 8.8, price: 216, unit: "/night", meta: [["Room", "Queen Deluxe"], ["Board", "Room only"], ["Cancel", "Free till Aug 29"], ["Pay", "Prepaid"]] },
    { id: "HO-3", title: "The Savoy", subtitle: "London · Strand", rating: 9.4, price: 520, unit: "/night", badge: "Luxury", meta: [["Room", "Superior Twin"], ["Board", "Breakfast"], ["Cancel", "Non-refundable"], ["Pay", "Prepaid"]] },
    { id: "HO-4", title: "Rove Downtown", subtitle: "Dubai · Burj Khalifa View", rating: 8.6, price: 96, unit: "/night", badge: "Budget", meta: [["Room", "Rove Room"], ["Board", "Room only"], ["Cancel", "Free anytime"], ["Pay", "At hotel"]] },
    { id: "HO-5", title: "Shangri-La Paris", subtitle: "Paris · Trocadéro", rating: 9.3, price: 395, unit: "/night", meta: [["Room", "Superior Queen"], ["Board", "Breakfast"], ["Cancel", "Free till Sep 01"], ["Pay", "At hotel"]] },
    { id: "HO-6", title: "Park Hyatt Istanbul", subtitle: "Istanbul · Maçka", rating: 8.9, price: 310, unit: "/night", meta: [["Room", "Park King"], ["Board", "Half board"], ["Cancel", "Free till Aug 31"], ["Pay", "Prepaid"]] },
  ],
  insurance: [
    { id: "IN-1", title: "Global Voyager", subtitle: "AXA · Worldwide excl. USA", rating: 4.6, price: 48, unit: "/pax", badge: "Popular", meta: [["Coverage", "$250,000"], ["Validity", "30 days"], ["Claims", "24/7 hotline"], ["COVID", "Covered"]] },
    { id: "IN-2", title: "Schengen Secure", subtitle: "Allianz · Visa compliant", rating: 4.8, price: 32, unit: "/pax", meta: [["Coverage", "$50,000"], ["Validity", "15 days"], ["Visa letter", "Instant PDF"], ["COVID", "Covered"]] },
    { id: "IN-3", title: "Trip Guard Plus", subtitle: "Zurich · Full journey cover", rating: 4.5, price: 49, unit: "/pax", meta: [["Coverage", "$500,000"], ["Validity", "45 days"], ["Baggage", "$1,500"], ["Cancel", "Covered"]] },
    { id: "IN-4", title: "AeroCare Standard", subtitle: "Trawick · Budget essential", rating: 4.2, price: 24, unit: "/pax", badge: "Cheapest", meta: [["Coverage", "$50,000"], ["Validity", "7 days"], ["Claims", "Email only"], ["COVID", "Not covered"]] },
    { id: "IN-5", title: "Student Shield", subtitle: "AXA · Study abroad", rating: 4.7, price: 78, unit: "/pax", meta: [["Coverage", "$250,000"], ["Validity", "180 days"], ["Sponsor", "Letter included"], ["Dental", "Covered"]] },
    { id: "IN-6", title: "Senior Care 70+", subtitle: "Allianz · Senior travelers", rating: 4.4, price: 98, unit: "/pax", meta: [["Coverage", "$150,000"], ["Validity", "30 days"], ["Pre-existing", "Stable covered"], ["Assistance", "Dedicated desk"]] },
  ],
  transfers: [
    { id: "TR-1", title: "Private Sedan", subtitle: "JFK → Manhattan", rating: 4.6, price: 78, badge: "Most booked", meta: [["Pax", "Up to 3"], ["Luggage", "3 bags"], ["Meet & greet", "Included"], ["Wait time", "60 min free"]] },
    { id: "TR-2", title: "Luxury SUV", subtitle: "JFK → Manhattan", rating: 4.8, price: 145, meta: [["Pax", "Up to 6"], ["Luggage", "6 bags"], ["Child seat", "On request"], ["Wait time", "90 min free"]] },
    { id: "TR-3", title: "Shared Shuttle", subtitle: "JFK → Any Manhattan hotel", rating: 4.0, price: 35, badge: "Cheapest", meta: [["Pax", "Shared"], ["Luggage", "2 bags"], ["Stops", "Multi-drop"], ["Wait time", "45 min max"]] },
    { id: "TR-4", title: "Executive Van", subtitle: "DXB → Abu Dhabi City", rating: 4.5, price: 210, meta: [["Pax", "Up to 10"], ["Luggage", "10 bags"], ["WiFi", "Onboard"], ["Wait time", "60 min free"]] },
    { id: "TR-5", title: "Standard Saloon", subtitle: "LHR → Central London", rating: 4.3, price: 92, meta: [["Pax", "Up to 3"], ["Luggage", "3 bags"], ["Flight tracking", "Yes"], ["Wait time", "45 min free"]] },
    { id: "TR-6", title: "Minibus 14-Seater", subtitle: "ISB → Murree Hills", rating: 4.4, price: 180, meta: [["Pax", "Up to 14"], ["Luggage", "Group gear"], ["Driver", "English speaking"], ["Tolls", "Included"]] },
  ],
  holidays: [
    { id: "HD-1", title: "Maldives Escape", subtitle: "6N Beach Villa · Half Board", rating: 4.9, price: 3450, unit: "/person", badge: "Honeymoon", meta: [["Nights", "6"], ["Flights", "Included"], ["Transfers", "Seaplane"], ["Rating", "Overwater villa"]] },
    { id: "HD-2", title: "Dubai Delights", subtitle: "5N City Break · 4★ Stay", rating: 4.6, price: 899, unit: "/person", meta: [["Nights", "5"], ["Flights", "Excluded"], ["Tours", "Desert + City"], ["Visa", "Assisted"]] },
    { id: "HD-3", title: "Swiss Alps Tour", subtitle: "7N Panorama Rail Journey", rating: 4.8, price: 2450, unit: "/person", meta: [["Nights", "7"], ["Rail pass", "Included"], ["Peaks", "Jungfrau + Titlis"], ["Meals", "Breakfast"]] },
    { id: "HD-4", title: "Bali Retreat", subtitle: "7N Ubud + Seminyak", rating: 4.7, price: 1290, unit: "/person", meta: [["Nights", "7"], ["Villas", "Private pool"], ["Spa", "2 sessions"], ["Guide", "English"]] },
    { id: "HD-5", title: "Turkey Grand Tour", subtitle: "8N Cappadocia + Istanbul", rating: 4.6, price: 1690, unit: "/person", badge: "Group", meta: [["Nights", "8"], ["Balloon", "Sunrise flight"], ["Internal air", "Included"], ["Meals", "Half board"]] },
    { id: "HD-6", title: "Umrah Premium", subtitle: "14N Makkah + Madinah", rating: 4.9, price: 2890, unit: "/person", meta: [["Nights", "14"], ["Hotel", "Clock Tower view"], ["Transport", "Private coach"], ["Ziyarat", "Guided"]] },
  ],
  sightseeing: [
    { id: "SG-1", title: "Burj Khalifa AT THE TOP", subtitle: "Levels 124 + 125 · Prime slot", rating: 4.7, price: 62, unit: "/person", badge: "Fast track", meta: [["Duration", "2 hrs"], ["Slot", "Sunset option"], ["Transfer", "Optional"], ["Instant", "E-ticket"]] },
    { id: "SG-2", title: "Red Dunes Desert Safari", subtitle: "Dubai · BBQ dinner show", rating: 4.8, price: 65, unit: "/person", meta: [["Duration", "7 hrs"], ["Pickup", "4x4 hotel"], ["Dinner", "BBQ buffet"], ["Shows", "Tanoura + fire"]] },
    { id: "SG-3", title: "Louvre Museum Guided", subtitle: "Paris · Skip-the-line", rating: 4.6, price: 85, unit: "/person", meta: [["Duration", "3 hrs"], ["Groups", "Max 15"], ["Language", "EN / FR"], ["Mona Lisa", "Priority route"]] },
    { id: "SG-4", title: "Niagara Day Trip", subtitle: "From NYC · Boat + Cave", rating: 4.5, price: 199, unit: "/person", meta: [["Duration", "15 hrs"], ["Boat", "Maid of the Mist"], ["Lunch", "Included"], ["Guide", "Live bilingual"]] },
    { id: "SG-5", title: "Bosphorus Dinner Cruise", subtitle: "Istanbul · Live performance", rating: 4.4, price: 75, unit: "/person", meta: [["Duration", "3 hrs"], ["Menu", "3-course"], ["Drinks", "Unlimited soft"], ["Pickup", "European side"]] },
    { id: "SG-6", title: "Madinah Ziyarat Tour", subtitle: "Sacred sites · AC coach", rating: 4.9, price: 25, unit: "/person", meta: [["Duration", "4 hrs"], ["Sites", "7 landmarks"], ["Guide", "Arabic / Urdu / EN"], ["Water", "Provided"]] },
  ],
  "fix-departure": [
    { id: "FD-1", title: "Umrah Group · December", subtitle: "Makkah + Madinah · 14 nights", rating: 4.9, price: 2890, unit: "/person", badge: "38 seats left", meta: [["Departure", "Dec 12 · JFK"], ["Airline", "Saudia direct"], ["Hotel", "Walking distance"], ["Leader", "Included"]] },
    { id: "FD-2", title: "Europe Explorer", subtitle: "Paris · Swiss · Italy · 12 nights", rating: 4.6, price: 2750, unit: "/person", badge: "17 seats left", meta: [["Departure", "May 04 · JFK"], ["Coach", "Luxury AC"], ["Hotels", "4★ central"], ["Visa help", "Schengen"]] },
    { id: "FD-3", title: "Turkey Discovery", subtitle: "Istanbul + Cappadocia · 7 nights", rating: 4.7, price: 1150, unit: "/person", meta: [["Departure", "Apr 18 · LHE"], ["Balloon", "Add-on"], ["Meals", "18 included"], ["Guide", "Urdu speaking"]] },
    { id: "FD-4", title: "Azerbaijan Weekend", subtitle: "Baku city break · 4 nights", rating: 4.4, price: 890, unit: "/person", badge: "9 seats left", meta: [["Departure", "Oct 09 · DXB"], ["Flames", "View rooms"], ["City tour", "2 days"], ["E-visa", "Handled"]] },
    { id: "FD-5", title: "Thailand Phuket", subtitle: "Beach escape · 6 nights", rating: 4.5, price: 1320, unit: "/person", meta: [["Departure", "Nov 21 · KHI"], ["Islands", "Phi Phi trip"], ["Stay", "Beachfront"], ["Transfers", "Private"]] },
    { id: "FD-6", title: "East Africa Safari", subtitle: "Kenya + Tanzania · 9 nights", rating: 4.8, price: 4650, unit: "/person", meta: [["Departure", "Jul 07 · JFK"], ["Parks", "4 reserves"], ["Lodges", "Full board"], ["4x4", "Window seat"]] },
  ],
  "a-to-a": [
    { id: "AA-1", title: "Dubai Visa Run", subtitle: "UAE exit + re-entry · 21 days", rating: 4.6, price: 210, badge: "Same day", meta: [["Processing", "24 hrs"], ["Border", "Hatta / Al Aweer"], ["Insurance", "Included"], ["Documents", "Passport + photo"]] },
    { id: "AA-2", title: "Malaysia A to A", subtitle: "KUL visa change · 30 days", rating: 4.5, price: 420, meta: [["Processing", "48 hrs"], ["Stay", "Airport hotel"], ["Onward", "Ticket required"], ["Approval", "eNTRI basis"]] },
    { id: "AA-3", title: "Thailand Visa Change", subtitle: "BKK in-out · 15 days", rating: 4.3, price: 180, badge: "Cheapest", meta: [["Processing", "36 hrs"], ["Stay", "Airport transit"], ["Extension", "Available"], ["Nationality", "Selected"]] },
    { id: "AA-4", title: "Oman Fly-Fly", subtitle: "MCT round trip · 30 days", rating: 4.4, price: 260, meta: [["Processing", "24 hrs"], ["Flight", "Low-cost carrier"], ["Baggage", "Hand carry"], ["Assist", "Airport rep"]] },
    { id: "AA-5", title: "Georgia A to A", subtitle: "TBS visa run · 60 days", rating: 4.7, price: 340, meta: [["Processing", "72 hrs"], ["Stay", "1-night TBS"], ["Tour", "Old city walk"], ["Insurance", "Included"]] },
    { id: "AA-6", title: "Armenia Change", subtitle: "EVN border run · 45 days", rating: 4.2, price: 295, meta: [["Processing", "48 hrs"], ["Stay", "Transit lounge"], ["Group rate", "4+ pax"], ["Support", "24/7 line"]] },
  ],
};
