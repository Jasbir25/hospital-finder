"use client"

import { useState } from "react"
import type { Hospital } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Search, Phone, MapPin, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HospitalListProps {
  hospitals: Hospital[]
  city: string
  selectedHospital: Hospital | null
  onSelectHospital: (hospital: Hospital) => void
}

export default function HospitalList({ hospitals, city, selectedHospital, onSelectHospital }: HospitalListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const downloadCSV = () => {
    // Create CSV content
    const headers = ["Name", "Address", "Phone", "Website", "Latitude", "Longitude", "Revenue"]
    const csvRows = [
      headers.join(","),
      ...hospitals.map((hospital) =>
        [
          `"${hospital.name.replace(/"/g, '""')}"`,
          `"${hospital.address.replace(/"/g, '""')}"`,
          `"${hospital.phone || ""}"`,
          `"${hospital.website || ""}"`,
          hospital.latitude,
          hospital.longitude,
          `"${hospital.revenue || "Not available"}"`,
        ].join(","),
      ),
    ]

    const csvContent = csvRows.join("\n")

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `hospitals_in_${city.replace(/\s+/g, "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Hospital List</span>
          <Badge variant="outline">{hospitals.length} found</Badge>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-3">
        <div className="space-y-3">
          {filteredHospitals.length > 0 ? (
            filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${selectedHospital?.id === hospital.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                  }`}
                onClick={() => onSelectHospital(hospital)}
              >
                <h3 className="font-medium">{hospital.name}</h3>
                <p className="text-sm text-muted-foreground flex items-start mt-1">
                  <MapPin className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                  {hospital.address}
                </p>
                {hospital.phone && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <Phone className="h-3 w-3 mr-1 shrink-0" /> {hospital.phone}
                  </p>
                )}
                {hospital.website && (
                  <a
                    href={hospital.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 mr-1 shrink-0" /> Website
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">No hospitals match your search</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <Button variant="outline" className="w-full" onClick={downloadCSV} disabled={hospitals.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Download as CSV
        </Button>
      </CardFooter>
    </Card>
  )
}
