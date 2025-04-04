import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import { supabase } from './supabase.js'
import { differenceInDays, format, parse } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { createWorker } from 'tesseract.js'

const Dashboard = () => {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    purchaseDate: '',
    expiryDate: ''
  })

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('Product Data')
        .select('*')
        .order('expiry_date', { ascending: true })

      if (error) throw error

      const formattedData = data.map(item => ({
        ...item,
        remaining_days: differenceInDays(new Date(item.expiry_date), new Date()),
        formatted_expiry: format(new Date(item.expiry_date), 'MMM dd, yyyy')
      }))

      setPurchases(formattedData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching purchases:', error.message)
      setLoading(false)
    }
  }

  // Prepare data for charts
  const expiryData = purchases.map(item => ({
    name: item.product_name,
    days: item.remaining_days
  }))

  const quantityData = purchases.map(item => ({
    name: item.product_name,
    quantity: item.quantity
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const handleAddItem = () => {
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
  }

  const detectExpiryDate = (text) => {
    const datePatterns = [
      /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/, // DD-MM-YYYY or DD/MM/YYYY
      /(\d{2,4})[-/](\d{1,2})[-/](\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
      /(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})/, // DD Month YYYY
      /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{2,4})/, // Month DD, YYYY
    ]

    const expiryKeywords = ['expiry', 'expires', 'use by', 'best before', 'use before', 'valid until']

    const lowerText = text.toLowerCase()

    const lines = text.split('\n')
    let expiryLine = ''
    for (const line of lines) {
      if (expiryKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        expiryLine = line
        break
      }
    }

    const searchText = expiryLine || text

    for (const pattern of datePatterns) {
      const match = searchText.match(pattern)
      if (match) {
        try {
          let date
          if (pattern === datePatterns[0]) {
            date = parse(`${match[1]}-${match[2]}-${match[3]}`, 'd-M-yyyy', new Date())
          } else if (pattern === datePatterns[1]) {
            date = parse(`${match[1]}-${match[2]}-${match[3]}`, 'yyyy-M-d', new Date())
          } else if (pattern === datePatterns[2]) {
            date = parse(`${match[1]} ${match[2]} ${match[3]}`, 'd MMMM yyyy', new Date())
          } else if (pattern === datePatterns[3]) {
            date = parse(`${match[1]} ${match[2]} ${match[3]}`, 'MMMM d yyyy', new Date())
          }

          if (date && !isNaN(date)) {
            return format(date, 'yyyy-MM-dd')
          }
        } catch (error) {
          console.error('Error parsing date:', error)
        }
      }
    }

    return null
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
      setIsProcessing(true)

      try {
        const worker = await createWorker('eng')
        const { data: { text } } = await worker.recognize(file)
        setExtractedText(text)

        const expiryDate = detectExpiryDate(text)
        if (expiryDate) {
          setFormData(prev => ({
            ...prev,
            expiryDate
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            expiryDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd')
          }))
        }

        await worker.terminate()
      } catch (error) {
        console.error('Error processing image:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('Product Data')
        .insert([{
          product_name: formData.productName,
          quantity: parseInt(formData.quantity),
          purchase_date: formData.purchaseDate,
          expiry_date: formData.expiryDate
        }])

      if (error) throw error

      fetchPurchases()
      setShowImageModal(false)
      setShowAddModal(false)
      setFormData({
        productName: '',
        quantity: '',
        purchaseDate: '',
        expiryDate: ''
      })
      setSelectedImage(null)
    } catch (error) {
      console.error('Error adding product:', error.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Dashboard</h1>
        <button
          onClick={handleAddItem}
          className='bg-blue-500 text-white p-2 rounded-lg mb-3 w-full sm:w-auto hover:bg-blue-600 transition-colors'
        >
          Add an Item
        </button>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
              <p className="text-gray-600 mb-4">Choose how you want to add the item:</p>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    closeModal()
                  }}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Using Detection Model
                </button>

                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setShowImageModal(true)
                  }}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Extract Expiry by Image
                </button>
              </div>

              <button
                onClick={closeModal}
                className="mt-4 w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Upload Product Image</h2>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 border rounded"
                  disabled={isProcessing}
                />
              </div>

              {isProcessing && (
                <div className="mb-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Processing image...</p>
                </div>
              )}
{/* 
              {selectedImage && !isProcessing && (
                <div className="mb-4">
                  <img src={selectedImage} alt="Preview" className="max-h-48 mx-auto" />
                </div>
              )} */}

              {/* {extractedText && !isProcessing && (
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <h3 className="text-sm font-semibold mb-2">Extracted Text:</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{extractedText}</p>
                </div>
              )} */}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Expiry Date (Extracted)
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageModal(false)
                      setSelectedImage(null)
                      setFormData({
                        productName: '',
                        quantity: '',
                        purchaseDate: '',
                        expiryDate: ''
                      })
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Days Until Expiry</h2>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expiryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="days" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Product Quantities</h2>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quantityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantity"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {quantityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Days</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className={purchase.remaining_days < 7 ? 'bg-red-50' : ''}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.product_name}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.quantity}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.formatted_expiry}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${purchase.remaining_days < 7 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {purchase.remaining_days} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
