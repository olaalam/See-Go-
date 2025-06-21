// PickUpMap.jsx
import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const PickUpMap = ({ tourPickUp, setTourPickUp }) => {
  const defaultPosition = [31.2001, 29.9187];
  const initialPosition =
    tourPickUp.lat && tourPickUp.lng
      ? [tourPickUp.lat, tourPickUp.lng]
      : defaultPosition;

  const [position, setPosition] = useState(initialPosition);

  const extractLatLng = useCallback((url) => {
    const placeMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    const queryMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
    return null;
  }, []);

  const geocodeAddress = useCallback(async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    const updatePositionBasedOnInput = async () => {
      const { location_map } = tourPickUp;
      if (!location_map) {
        if (tourPickUp.lat !== defaultPosition[0] || tourPickUp.lng !== defaultPosition[1]) {
          setPosition(defaultPosition);
          setTourPickUp((prev) => ({ ...prev, lat: defaultPosition[0], lng: defaultPosition[1], location_map: "" }));
        }
        return;
      }

      const googleCoords = extractLatLng(location_map);
      if (googleCoords) {
        setPosition([googleCoords.lat, googleCoords.lng]);
        setTourPickUp((prev) => ({ ...prev, lat: googleCoords.lat, lng: googleCoords.lng, location_map }));
        return;
      }

      const geocodedCoords = await geocodeAddress(location_map);
      if (geocodedCoords) {
        setPosition([geocodedCoords.lat, geocodedCoords.lng]);
        setTourPickUp((prev) => ({ ...prev, lat: geocodedCoords.lat, lng: geocodedCoords.lng, location_map }));
      } else {
        console.warn("Invalid address/URL provided for pick-up map. Location not found.");
      }
    };
    updatePositionBasedOnInput();
  }, [tourPickUp.location_map, extractLatLng, geocodeAddress]);

  const ChangeView = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
      if (
        typeof coords[0] === "number" &&
        typeof coords[1] === "number" &&
        !isNaN(coords[0]) &&
        !isNaN(coords[1])
      ) {
        map.setView(coords, map.getZoom() || 13, { animate: true });
      }
    }, [coords, map]);
    return null;
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setTourPickUp((prev) => ({
          ...prev,
          lat,
          lng,
          location_map: `https://maps.google.com/?q=${lat},${lng}`,
        }));
      },
    });
    return position[0] !== undefined && position[1] !== undefined && <Marker position={position} />;
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer center={position} zoom={13} className="h-[300px] w-full z-0">
        <ChangeView coords={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default PickUpMap;