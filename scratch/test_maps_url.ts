import { getGoogleMapsDirectionsUrl } from '../lib/maps';

const testFacilityWithCoords = {
  name: "Sabarmati Sports Arena",
  address: "Ashram Road",
  city: "Ahmedabad",
  state: "Gujarat",
  country: "India",
  pincode: "380009",
  latitude: 23.0225,
  longitude: 72.5714,
};

const testFacilityWithAddressOnly = {
  name: "Sardar Patel Tennis Club",
  address: "Navrangpura",
  city: "Ahmedabad",
  state: "Gujarat",
  country: "India",
  latitude: null,
  longitude: null,
};

const testFacilityEmpty = {
  name: null,
  address: null,
  city: null,
};

console.log("Coords URL:", getGoogleMapsDirectionsUrl(testFacilityWithCoords));
console.log("Address URL:", getGoogleMapsDirectionsUrl(testFacilityWithAddressOnly));
console.log("Empty URL:", getGoogleMapsDirectionsUrl(testFacilityEmpty));
