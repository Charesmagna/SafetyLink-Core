export function getClosestSouthAfricanCity(lat: number, lng: number): string {
  const cities = [
    { name: "Johannesburg, GP", lat: -26.2041, lng: 28.0473 },
    { name: "Cape Town, WC", lat: -33.9249, lng: 18.4241 },
    { name: "Durban, KZN", lat: -29.8587, lng: 31.0218 },
    { name: "Pretoria, GP", lat: -25.7479, lng: 28.2293 },
    { name: "Port Elizabeth, EC", lat: -33.9608, lng: 25.6022 },
    { name: "Bloemfontein, FS", lat: -29.1181, lng: 26.2241 },
    { name: "Lenasia, GP", lat: -26.3085, lng: 27.8344 },
    { name: "Soweto, GP", lat: -26.2678, lng: 27.8585 },
    { name: "Sandton, GP", lat: -26.1076, lng: 28.0567 },
    { name: "Mitchells Plain, WC", lat: -34.0485, lng: 18.6052 }
  ];
  let closest = cities[0];
  let minDist = Infinity;
  for (const city of cities) {
    const dist = Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2);
    if (dist < minDist) {
      minDist = dist;
      closest = city;
    }
  }
  return closest.name;
}
