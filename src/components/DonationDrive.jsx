import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from './supabase'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const FOOD_CATEGORIES = [
  { value: 'Vegetarian', label: 'Vegetarian' },
  { value: 'Non-Vegetarian', label: 'Non-Vegetarian' },
  { value: 'Vegan', label: 'Vegan' },
  { value: 'Dessert', label: 'Dessert' },
  { value: 'Other', label: 'Other' },
]

const LOCATIONS = {
  'Food Banks': [
    { name: 'Roti Bank', lat: 19.0760, lng: 72.8777, capacity: 800 },
    { name: 'Annapurna Rasoi', lat: 19.2183, lng: 72.8479, capacity: 500 },
    { name: 'Sewa Sadan', lat: 18.9972, lng: 72.8344, capacity: 400 }
  ],
  'Restaurants & Hotels': [
    { name: 'Taj Hotel Kitchen', lat: 18.9217, lng: 72.8330, surplus: 50 },
    { name: 'Hyatt Regency', lat: 19.1173, lng: 72.8647, surplus: 75 },
    { name: 'ITC Maratha', lat: 19.1096, lng: 72.8494, surplus: 100 }
  ],
  'NGOs & Shelters': [
    { name: 'Goonj Center', lat: 19.0760, lng: 72.8777, needs: 175 },
    { name: 'Helping Hands', lat: 19.0272, lng: 72.8579, needs: 120 },
    { name: 'Akshaya Patra', lat: 19.1302, lng: 72.8746, needs: 200 }
  ],
  'Community Kitchens': [
    { name: 'Mumbai Dabbawalas', lat: 19.0821, lng: 72.8805, capacity: 250 },
    { name: 'Thane Roti Bank', lat: 19.2011, lng: 72.9648, capacity: 300 },
    { name: 'Kalyan Seva Sadan', lat: 19.2456, lng: 73.1238, capacity: 180 }
  ]
}

const DonationDrive = () => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [route, setRoute] = useState([])
  const [communities, setCommunities] = useState([])
  const [selectedCommunity, setSelectedCommunity] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
      if (error) throw error
      setCommunities(data || [])
    } catch (err) {
      console.error('Error fetching communities:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmission = () => {
    alert("Donation Successful")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Update the community's food_saved_kg
      const { error: updateError } = await supabase
        .from('communities')
        .update({
          food_saved_kg: supabase.rpc('increment_food_saved', {
            community_id: selectedCommunity,
            amount: parseFloat(quantity)
          })
        })
        .eq('id', selectedCommunity)

      if (updateError) throw updateError

      // Log the donation details
      console.log({
        selectedCategory,
        quantity,
        selectedLocation,
        selectedCommunity
      })

      // Reset form
      setSelectedCategory('')
      setQuantity('')
      setSelectedLocation(null)
      setSelectedCommunity('')

      // Refresh communities data
      fetchCommunities()

    } catch (err) {
      console.error('Error submitting donation:', err)
    }
  }

  const center = [19.0760, 72.8777] // Mumbai coordinates

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Map Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 h-[600px]">
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {Object.entries(LOCATIONS).map(([category, locations]) =>
                locations.map((location) => (
                  <Marker
                    key={location.name}
                    position={[location.lat, location.lng]}
                    eventHandlers={{
                      click: () => setSelectedLocation(location),
                    }}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">{location.name}</h3>
                        <p>{category}</p>
                        {location.capacity && <p>Capacity: {location.capacity} kg</p>}
                        {location.surplus && <p>Surplus: {location.surplus} kg</p>}
                        {location.needs && <p>Needs: {location.needs} kg</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))
              )}
              {route.length > 0 && (
                <Polyline positions={route.map(loc => [loc.lat, loc.lng])} color="red" />
              )}
            </MapContainer>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Food Donation Form</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Food Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a category</option>
                  {FOOD_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Select Community</label>
                <select
                  value={selectedCommunity}
                  onChange={(e) => setSelectedCommunity(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a community</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLocation && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium">Selected Location</h3>
                  <p>{selectedLocation.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedLocation.capacity
                      ? `Capacity: ${selectedLocation.capacity} kg`
                      : selectedLocation.surplus
                        ? `Surplus: ${selectedLocation.surplus} kg`
                        : `Needs: ${selectedLocation.needs} kg`}
                  </p>
                </div>
              )}

              <button
                type="submit"
                onClick={handleSubmission}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Submit Donation
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonationDrive
