"use server"

import type { Hospital } from "./types"
import { v4 as uuidv4 } from "uuid"
import * as cheerio from "cheerio"

export async function searchHospitals(city: string): Promise<Hospital[]> {
  try {
    // First, get the coordinates of the city for better search results
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`,
    )

    if (!geocodeResponse.ok) {
      throw new Error("Failed to geocode city")
    }

    const geocodeData = await geocodeResponse.json()

    if (!geocodeData || geocodeData.length === 0) {
      throw new Error("City not found")
    }

    const { lat, lon } = geocodeData[0]

    // Now search for hospitals near this location
    const overpassQuery = `
      [out:json];
      (
        node["amenity"="hospital"](around:15000,${lat},${lon});
        way["amenity"="hospital"](around:15000,${lat},${lon});
        relation["amenity"="hospital"](around:15000,${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `

    const overpassResponse = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    if (!overpassResponse.ok) {
      throw new Error("Failed to fetch hospital data")
    }

    const overpassData = await overpassResponse.json()

    // Process the results
    const hospitals: Hospital[] = []
    const processedIds = new Set()

    for (const element of overpassData.elements) {
      if (element.tags && element.tags.amenity === "hospital") {
        // Skip if we've already processed this hospital
        if (processedIds.has(element.id)) continue
        processedIds.add(element.id)

        // Get coordinates
        let latitude = element.lat
        let longitude = element.lon

        // For ways and relations, calculate the center point
        if (!latitude && !longitude && element.center) {
          latitude = element.center.lat
          longitude = element.center.lon
        }

        // Skip if we don't have coordinates
        if (!latitude || !longitude) continue

        hospitals.push({
          id: uuidv4(),
          name: element.tags.name || "Unknown Hospital",
          address: [element.tags["addr:housenumber"], element.tags["addr:street"], element.tags["addr:city"] || city]
            .filter(Boolean)
            .join(", "),
          phone: element.tags.phone || element.tags["contact:phone"],
          website: element.tags.website || element.tags["contact:website"],
          latitude,
          longitude,
          type: element.tags.healthcare || "Hospital",
          services: element.tags.healthcare ? [element.tags.healthcare] : [],
        })
      }
    }

    // If we don't have enough results from OpenStreetMap, try to scrape Google Maps
    if (hospitals.length < 5) {
      const googleResults = await scrapeGoogleMapsHospitals(city)

      // Merge results, avoiding duplicates by name
      const existingNames = new Set(hospitals.map((h) => h.name.toLowerCase()))

      for (const hospital of googleResults) {
        if (!existingNames.has(hospital.name.toLowerCase())) {
          hospitals.push(hospital)
          existingNames.add(hospital.name.toLowerCase())
        }
      }
    }

    return hospitals
  } catch (error) {
    console.error("Error in searchHospitals:", error)
    throw error
  }
}

async function scrapeGoogleMapsHospitals(city: string): Promise<Hospital[]> {
  try {
    // This is a fallback method that attempts to scrape Google Maps results
    // Note: Web scraping may violate terms of service and should be used carefully

    const searchQuery = `hospitals in ${city}`
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch Google Maps results")
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const hospitals: Hospital[] = []

    // This is a simplified approach and may not work reliably
    // Google Maps dynamically loads content with JavaScript
    // A more robust approach would use a headless browser like Puppeteer

    // Try to extract some basic information from the initial HTML
    $('div[role="article"]').each((_, element) => {
      const name = $(element).find("h3").first().text().trim()
      const address = $(element).find(".address").text().trim()

      if (name) {
        hospitals.push({
          id: uuidv4(),
          name,
          address: address || `${city}`,
          latitude: 0, // We don't have coordinates from this method
          longitude: 0, // We'll need to geocode these separately
        })
      }
    })

    // For each hospital without coordinates, try to geocode the address
    for (const hospital of hospitals) {
      if (hospital.latitude === 0 && hospital.longitude === 0) {
        try {
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(hospital.name + ", " + city)}`,
          )

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()

            if (geocodeData && geocodeData.length > 0) {
              hospital.latitude = Number.parseFloat(geocodeData[0].lat)
              hospital.longitude = Number.parseFloat(geocodeData[0].lon)
            }
          }

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Failed to geocode ${hospital.name}:`, error)
        }
      }
    }

    // Filter out hospitals without coordinates
    return hospitals.filter((h) => h.latitude !== 0 && h.longitude !== 0)
  } catch (error) {
    console.error("Error in scrapeGoogleMapsHospitals:", error)
    return []
  }
}
