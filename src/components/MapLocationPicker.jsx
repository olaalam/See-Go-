import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_LOCATION = {
  lat: 31.2001,
  lng: 29.9187,
  zoom: 12
};

export default function MapLocationPicker({ value, onChange, placeholder }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [coordinates, setCoordinates] = useState(DEFAULT_LOCATION);
  // Update the useState initialization for locationName
  const [locationName, setLocationName] = useState(() => {
    if (!value) return "";
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.address) return value.address;
    return "";
  });
  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const leafletMap = L.map(mapRef.current).setView(
      [coordinates.lat, coordinates.lng],
      DEFAULT_LOCATION.zoom
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);

    markerRef.current = L.marker([coordinates.lat, coordinates.lng], {
      draggable: true
    }).addTo(leafletMap);

    leafletMap.on("click", handleMapClick);
    markerRef.current.on("dragend", handleMarkerDragEnd);

    setMap(leafletMap);

    // Geocode initial address if provided
    if (value && typeof value === 'string') {
      geocodeAddress(value);
    }

    return () => {
      leafletMap.off();
      leafletMap.remove();
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (map && markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      map.panTo([coordinates.lat, coordinates.lng]);
    }
  }, [coordinates, map]);

  // Handle address changes from parent
  useEffect(() => {
    if (value && value !== locationName) {
      setLocationName(value);
      geocodeAddress(value);
    }
  }, [value]);

  const geocodeAddress = async (address) => {
    if (!address) return;

    try {
const response = await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates({
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    setCoordinates({ lat, lng });
    await reverseGeocode(lat, lng);
  };

  const handleMarkerDragEnd = async (e) => {
    const { lat, lng } = e.target.getLatLng();
    setCoordinates({ lat, lng });
    await reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const name = data.display_name || "Selected Location";
      setLocationName(name);
      onChange?.(name);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocationName(value);
    onChange?.(value);
  };

  return (
    <div className="!space-y-4 w-full">
      <Input
        placeholder={placeholder || "Search location"}
        value={locationName}
        onChange={handleInputChange}
        className="rounded-[15px] border border-gray-300 !px-5 !py-6 focus:border-bg-primary focus:ring-bg-primary"
      />
      <div
        ref={mapRef}
        className="h-64 w-full rounded-[15px] border border-gray-300"
      />
    </div>
  );
}