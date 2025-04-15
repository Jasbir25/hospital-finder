export interface Hospital {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  latitude: number
  longitude: number
  type?: string
  services?: string[]
}
