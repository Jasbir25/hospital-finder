"use client"

import { useState } from "react"
import SearchForm from "@/components/search-form"
import HospitalList from "@/components/hospital-list"
import type { Hospital } from "@/lib/types"
import { searchHospitals } from "@/lib/actions"
import dynamic from "next/dynamic"

// Dynamically import HospitalMap with no SSR
const HospitalMap = dynamic(() => import("@/components/hospital-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
})

export default function Home() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [city, setCity] = useState("")
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)

  const handleSearch = async (cityName: string) => {
    setLoading(true)
    setCity(cityName)
    try {
      const results = await searchHospitals(cityName)
      setHospitals(results)
    } catch (error) {
      console.error("Error fetching hospitals:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Hospital Finder</h1>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {hospitals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <HospitalMap
              hospitals={hospitals}
              city={city}
              selectedHospital={selectedHospital}
              onSelectHospital={setSelectedHospital}
            />
          </div>
          <div>
            <HospitalList
              hospitals={hospitals}
              city={city}
              selectedHospital={selectedHospital}
              onSelectHospital={setSelectedHospital}
            />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center mt-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
    </main>
  )
}
