import type { BookingResult, BookingSearchFilters, FlightSearchFilters } from "@/types";

const ignoredValues = new Set(["", "any", "all", "flexible"]);
const isIgnored = (value?: string) => !value || ignoredValues.has(value.trim().toLowerCase());
const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
const contains = (value: unknown, query?: string) => isIgnored(query) || normalize(value).includes(normalize(query));
const equals = (value: unknown, query?: string) => isIgnored(query) || normalize(value) === normalize(query);
const numberFrom = (value?: string, fallback = 0) => Number.parseInt(value ?? "", 10) || fallback;

const withinAvailability = (result: BookingResult, start?: string, end?: string) => {
  const availableFrom = String(result.search.availableFrom ?? "");
  const availableTo = String(result.search.availableTo ?? "");
  return (!start || !availableFrom || start >= availableFrom) && (!end || !availableTo || end <= availableTo);
};

const matchesBudget = (price: number, budget?: string) => {
  if (isIgnored(budget)) return true;
  if (budget === "Under $1,000") return price < 1000;
  if (budget === "$1,000 - $2,000") return price >= 1000 && price <= 2000;
  if (budget === "$2,000 - $4,000") return price >= 2000 && price <= 4000;
  return true;
};

const matchesNights = (value: number, range?: string) => {
  if (isIgnored(range)) return true;
  if (range === "3-5") return value >= 3 && value <= 5;
  if (range === "6-8") return value >= 6 && value <= 8;
  if (range === "9-12") return value >= 9 && value <= 12;
  if (range === "12+") return value >= 12;
  return true;
};

export function filterBookingResults(
  service: string,
  results: BookingResult[],
  filters: BookingSearchFilters,
): BookingResult[] {
  return results.filter((result) => {
    switch (service) {
      case "hotels":
        return (
          contains(result.search.city, filters.city) &&
          withinAvailability(result, filters.checkIn, filters.checkOut) &&
          Number(result.search.adultCapacity) * numberFrom(filters.rooms, 1) >= numberFrom(filters.adults, 1) &&
          Number(result.search.childCapacity) * numberFrom(filters.rooms, 1) >= numberFrom(filters.children) &&
          Number(result.search.roomsAvailable) >= numberFrom(filters.rooms, 1)
        );
      case "insurance":
        return (
          equals(result.search.destination, filters.destination) &&
          equals(result.search.tripType, filters.tripType) &&
          withinAvailability(result, filters.start, filters.end)
        );
      case "transfers":
        return (
          contains(result.search.from, filters.from) &&
          contains(result.search.to, filters.to) &&
          equals(result.search.date, filters.date) &&
          equals(result.search.time, filters.time) &&
          equals(result.search.vehicle, filters.vehicle)
        );
      case "holidays":
        return (
          contains(result.search.package, filters.package) &&
          equals(result.search.month, filters.month) &&
          matchesBudget(result.price, filters.budget) &&
          matchesNights(Number(result.search.nights), filters.nights)
        );
      case "sightseeing": {
        const guests = filters.pax === "5+" ? 5 : numberFrom(filters.pax);
        return (
          contains(result.search.city, filters.city) &&
          equals(result.search.category, filters.category) &&
          equals(result.search.date, filters.date) &&
          (!guests || Number(result.search.capacity) >= guests)
        );
      }
      case "fix-departure": {
        const seats = filters.seats === "5+" ? 5 : numberFrom(filters.seats);
        return (
          equals(result.search.group, filters.group) &&
          (!seats || Number(result.search.seatsAvailable) >= seats) &&
          equals(result.search.rooming, filters.rooming)
        );
      }
      case "a-to-a":
        return (
          equals(result.search.country, filters.country) &&
          equals(result.search.duration, filters.duration) &&
          equals(result.search.date, filters.date)
        );
      default:
        return true;
    }
  });
}

const daysApart = (a: string, b: string) =>
  Math.abs(new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86_400_000;

export function filterFlightResults(results: BookingResult[], filters: FlightSearchFilters): BookingResult[] {
  const requestedTravelers = filters.travelers.adults + filters.travelers.children + filters.travelers.infants;

  return results.filter((result) => {
    const legsMatch = filters.legs.every((filterLeg, index) => {
      const resultLeg = result.legs?.[index];
      const legHasFilter = Object.values(filterLeg).some((value) => !isIgnored(value));
      if (!legHasFilter) return true;
      if (!resultLeg) return false;

      const dateMatches = !filterLeg.depart ||
        (filters.tab === "flexi"
          ? daysApart(resultLeg.depart, filterLeg.depart) <= 3
          : resultLeg.depart === filterLeg.depart);

      return (
        contains(resultLeg.origin, filterLeg.origin) &&
        contains(resultLeg.destination, filterLeg.destination) &&
        dateMatches &&
        equals(resultLeg.cabin, filterLeg.cabin) &&
        equals(resultLeg.airline, filterLeg.airline) &&
        equals(resultLeg.time, filterLeg.time)
      );
    });

    return (
      legsMatch &&
      Number(result.search.capacity) >= requestedTravelers &&
      equals(result.search.stopType, filters.stopType) &&
      contains(result.search.stopCity, filters.stopCity) &&
      equals(result.search.fareType, filters.fareType) &&
      equals(result.search.baggage, filters.baggage) &&
      equals(result.search.fareSource, filters.fareSource)
    );
  });
}
