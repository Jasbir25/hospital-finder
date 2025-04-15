"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { Hospital } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Phone } from "lucide-react"
import L from "leaflet"

interface MapCenterProps {
  center: [number, number]
  zoom: number
}

// Component to update map center
function ChangeMapCenter({ center, zoom }: MapCenterProps) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

interface HospitalMapProps {
  hospitals: Hospital[]
  city: string
  selectedHospital: Hospital | null
  onSelectHospital: (hospital: Hospital) => void
}

export default function HospitalMap({ hospitals, city, selectedHospital, onSelectHospital }: HospitalMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09])
  const [mapZoom, setMapZoom] = useState(12)
  const leafletInitialized = useRef(false)

  useEffect(() => {
    if (!leafletInitialized.current) {
      // This is needed to fix the marker icon issue with Leaflet in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      leafletInitialized.current = true
    }
  }, [])

  useEffect(() => {
    if (hospitals.length > 0) {
      // Use the first hospital's coordinates as the center
      setMapCenter([hospitals[0].latitude, hospitals[0].longitude])
    }
  }, [hospitals])

  useEffect(() => {
    if (selectedHospital) {
      setMapCenter([selectedHospital.latitude, selectedHospital.longitude])
      setMapZoom(15)
    }
  }, [selectedHospital])

  return (
    <Card className="w-full h-[500px]">
      <CardHeader className="pb-2">
        <CardTitle>Hospitals in {city}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[440px]">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%", borderRadius: "0 0 0.5rem 0.5rem" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ChangeMapCenter center={mapCenter} zoom={mapZoom} />

          {hospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              position={[hospital.latitude, hospital.longitude]}
              eventHandlers={{
                click: () => onSelectHospital(hospital),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold">{hospital.name}</h3>
                  <p className="mt-1">{hospital.address}</p>
                  {hospital.phone && (
                    <p className="mt-1 flex items-center">
                      <Phone className="h-3 w-3 mr-1" /> {hospital.phone}
                    </p>
                  )}
                  {hospital.website && (
                    <a
                      href={hospital.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline mt-1 flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> Website
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  )
}
