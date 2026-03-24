import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents, useMap, CircleMarker, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Issue } from "../../types";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LocateFixed, ZoomIn } from "lucide-react";

// Fix default marker assets in Vite builds.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export function IssuesMap({
  issues,
  selectedCoords,
  onMapClick,
  clickable = false
}: {
  issues: Issue[];
  selectedCoords?: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  clickable?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-card">
      <MapContainer center={[43.238949, 76.889709]} zoom={12} zoomControl={false} className="h-full w-full">

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clickable && onMapClick ? <MapClickCapture onMapClick={onMapClick} /> : null}
        <LiveLocation />
        <LocateButton />
        <ZoomControl position="bottomright" />

        <MarkerClusterGroup chunkedLoading>
          {issues.map((issue) => (
            <Marker key={issue.id} position={[issue.lat, issue.lng]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-medium">{issue.title}</div>
                  <div className="text-xs text-slate-600">
                    {issue.category} • {issue.status}
                  </div>
                  <Link className="text-xs text-emerald-700 underline" to={`/issue/${issue.id}`}>
                    View details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {selectedCoords ? (
          <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
            <Popup>Selected report location</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}

function MapClickCapture({
  onMapClick
}: {
  onMapClick: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return null;
}

export function StaticIssueMap({ center, selectedCoords, onMapClick }: {
  center: { lat: number, lng: number } | null;
  selectedCoords?: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number, lng: number }) => void;
}) {
  if (!center) return null;
  return (
    <div className="h-[620px] overflow-hidden rounded-[28px] border border-slate-200">
      <MapContainer center={[center.lat, center.lng]} zoom={14} zoomControl={false} className={`h-full w-full ${onMapClick ? "cursor-crosshair" : ""}`}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick ? <MapClickCapture onMapClick={onMapClick} /> : null}
        <LiveLocation />
        <LocateButton />
        <ZoomControl position="bottomright" />
        {selectedCoords ? (
          <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
            <Popup>Selected location</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}

function LocateButton() {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported")
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        map.flyTo([lat, lng], 16, {
          animate: true,
          duration: 1.5
        })
      },
      (error) => {
        console.error("Location error: ", error);
        if (error.code === 1) alert("Please allow location acces");
        if (error.code === 2) alert("Location unavailable");
        if (error.code === 3) alert("Location request timeout");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000
      }
    );
  }
  return (
    <button
      type="button"
      onClick={handleLocate}
      title="My Location"
      className="absolute bottom-24 right-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 active:scale-95"
    >
      <LocateFixed size={18} />
    </button>
  );
}

function LiveLocation() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPosition([lat, lng]);
        // map.setView([lat, lng]);
      },
      (err) => console.log(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      }
    );
  }, [map]);

  if (!position) return null;

  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{
        color: "#2563eb",
        fillColor: "#2563eb",
        fillOpacity: 0.9
      }}
    />
  );
}