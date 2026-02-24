import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Issue } from "../../types";
import { Link } from "react-router-dom";

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
  onMapClick
}: {
  issues: Issue[];
  selectedCoords: { lat: number; lng: number } | null;
  onMapClick: (coords: { lat: number; lng: number }) => void;
}) {
  return (
    <div className="h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <MapContainer center={[43.238949, 76.889709]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickCapture onMapClick={onMapClick} />
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

export function StaticIssueMap({ issue }: { issue: Issue }) {
  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer center={[issue.lat, issue.lng]} zoom={14} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[issue.lat, issue.lng]}>
          <Popup>{issue.title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
