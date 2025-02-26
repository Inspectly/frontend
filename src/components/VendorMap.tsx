import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// Example vendor data (Replace with real data)
const vendors = [
  { id: 1, name: "Plumbing Pros", lat: 42.9849, lng: -81.2453 },
  { id: 2, name: "Electrical Experts", lat: 42.9862, lng: -81.2396 },
  { id: 3, name: "HVAC Specialists", lat: 42.9795, lng: -81.25 },
];

// Custom Map Icon
const vendorIcon = new Icon({
  iconUrl: "/images/vendor-marker.webp", // Replace with your own marker icon
  iconSize: [30, 30],
  iconAnchor: [15, 0],
});

const VendorMap = () => {
  return (
    <MapContainer
      center={[42.9849, -81.2453]}
      zoom={13}
      className="h-52 w-full rounded-lg"
    >
      {/* Base Map Layer */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">Carto</a>'
      />

      {/* Vendor Markers */}
      {vendors.map((vendor) => (
        <Marker
          key={vendor.id}
          position={[vendor.lat, vendor.lng]}
          icon={vendorIcon}
        >
          <Popup>
            <strong>{vendor.name}</strong>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default VendorMap;
