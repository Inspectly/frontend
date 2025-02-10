import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet"; // ✅ Import LatLngExpression

interface MapProps {
  latitude: number;
  longitude: number;
  listingName: string;
}

const MapFixer = () => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 500);
  }, [map]);

  return null;
};

const MapComponent: React.FC<MapProps> = ({
  latitude,
  longitude,
  listingName,
}) => {
  const [isReady, setIsReady] = useState(false); // Track when map is ready

  // Explicitly define center as LatLngExpression
  const center: LatLngExpression = [latitude, longitude];

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  // Delay map initialization to ensure correct rendering
  useEffect(() => {
    setTimeout(() => {
      setIsReady(true);
    }, 500); // Short delay before mounting
  }, []);

  return (
    <div className="h-64 w-full rounded-lg border">
      {isReady ? (
        <MapContainer center={center} zoom={17} className="h-full w-full">
          {/* Fixes gray screen issue */}
          <MapFixer />

          {/* Base Map Layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
          />

          {/* Marker for Listing Location */}
          <Marker position={center}>
            <Popup>
              <div>
                <p className="font-semibold">{listingName}</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline mt-2 block"
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      ) : (
        // ✅ Display loading placeholder before map is ready
        <div className="flex items-center justify-center h-full bg-gray-200 animate-pulse">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
