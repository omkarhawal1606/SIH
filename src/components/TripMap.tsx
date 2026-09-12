"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type TripData } from "@/lib/types";
import { MapPin, Hotel, Compass, ShieldAlert, AlertCircle } from "lucide-react";

// Fix leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom Icon for Hotels (Gold/Sand)
const hotelIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Icon for Activities (Green/Forest)
const activityIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to auto-fit bounds
function FitBounds({ markers }: { markers: {lat: number, lng: number}[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  return null;
}

export default function TripMap({ trip }: { trip: TripData }) {
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    const allMarkers: any[] = [];
    
    // Add hotels
    if (trip.hotels) {
      trip.hotels.forEach(h => {
        if (h.lat && h.lng) {
          allMarkers.push({
            lat: h.lat,
            lng: h.lng,
            type: "hotel",
            title: h.name,
            desc: h.description,
            price: h.price_per_night,
            rating: h.rating
          });
        }
      });
    }

    // Add activities
    if (trip.itinerary) {
      trip.itinerary.forEach(day => {
        Object.entries(day.slots).forEach(([time, data]: [string, any]) => {
          if (data.lat && data.lng) {
            allMarkers.push({
              lat: data.lat,
              lng: data.lng,
              type: "activity",
              title: data.place,
              desc: data.activity,
              time: `${time.charAt(0).toUpperCase() + time.slice(1)} (Day ${day.day})`
            });
          }
        });
      });
    }

    setMarkers(allMarkers);
  }, [trip]);

  if (markers.length === 0) {
    return (
      <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-8 text-center text-[var(--slate)] italic shadow-sm">
        Map coordinates not available for this trip record.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--light-sage)] rounded-2xl p-2 shadow-sm relative z-0 h-[480px] w-full overflow-hidden">
      <MapContainer 
        center={[markers[0].lat, markers[0].lng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, i) => (
          <Marker 
            key={i} 
            position={[m.lat, m.lng]} 
            icon={m.type === "hotel" ? hotelIcon : activityIcon}
          >
            <Popup className="custom-popup">
              <div className="font-sans p-1">
                <h4 className="font-bold text-sm text-[var(--charcoal)] mb-0.5">{m.title}</h4>
                {m.type === "activity" && <p className="text-xs font-semibold text-[var(--forest)] mb-1">{m.time}</p>}
                {m.type === "hotel" && <p className="text-xs font-semibold text-[#7A5C00] mb-1">⭐ {m.rating} | {trip.currency || "INR"} {m.price}/night</p>}
                <p className="text-xs text-[var(--slate)] line-clamp-3 leading-snug">{m.desc}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds markers={markers} />
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl shadow-md border border-[var(--light-sage)] flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--charcoal)]">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png" alt="Hotel" className="h-4" />
          Accommodations
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--charcoal)]">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" alt="Activity" className="h-4" />
          Planned Activities
        </div>
      </div>
      
      {/* Map Security Advisory Overlay */}
      {trip.safety_level === "unsafe" && (
        <div className="absolute top-5 right-5 z-[1000] bg-[var(--error-bg)] border border-[var(--error)]/40 px-3 py-2 rounded-xl shadow-md flex items-center gap-2 max-w-xs">
          <ShieldAlert className="w-5 h-5 text-[var(--error)] shrink-0" />
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--error)] block mb-0.5">Critical Alert Zone</span>
            <p className="text-[10px] font-medium text-[var(--charcoal-80)] line-clamp-2 leading-tight">Refer to security advisory for location safety.</p>
          </div>
        </div>
      )}
      {trip.safety_level === "caution" && (
        <div className="absolute top-5 right-5 z-[1000] bg-[var(--warning-bg)] border border-[var(--sand)] px-3 py-2 rounded-xl shadow-md flex items-center gap-2 max-w-xs">
          <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0" />
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A5C00] block mb-0.5">Travel Caution Area</span>
            <p className="text-[10px] font-medium text-[var(--charcoal-80)] line-clamp-2 leading-tight">Exercise caution when visiting marked locations.</p>
          </div>
        </div>
      )}
    </div>
  );
}
