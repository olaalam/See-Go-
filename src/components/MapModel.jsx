import { useState, useEffect } from "react";

export default function MapModal({ onClose, onSelect }) {
  const [mapSrc, setMapSrc] = useState(
    "https://maps.google.com/maps?q=Egypt&t=&z=13&ie=UTF8&iwloc=&output=embed"
  );
  const [coords, setCoords] = useState({ lat: null, lng: null });

  // استبدلي هذا بـ API Key الخاص بك
  const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          setMapSrc(
            `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
          );
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
        }
      );
    }
  }, []);

  // دالة لتحويل الاحداثيات إلى عنوان نصي
  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return "";
    } catch (err) {
      console.error("Error fetching address:", err);
      return "";
    }
  };

  const handleAdd = async () => {
    if (coords.lat && coords.lng) {
      const address = await fetchAddress(coords.lat, coords.lng);
      if (address) {
        onSelect(address); // نرسل العنوان النصي إلى الـ parent
      } else {
        onSelect(`${coords.lat},${coords.lng}`); // fallback لو العنوان مش متوفر
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4 relative">
        <h2 className="text-xl text-bg-primary font-bold mb-4">
          Choose Your Location
        </h2>
        <iframe
          src={mapSrc}
          className="w-full h-80 rounded"
          loading="lazy"
          title="Map"
        ></iframe>
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={handleAdd}
            disabled={!coords.lat || !coords.lng}
            className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={onClose}
            className="!px-4 !py-2 bg-gray-300 text-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
