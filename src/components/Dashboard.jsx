import React, { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import { supabase } from './supabase.js'
import { differenceInDays, format, parse } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { createWorker } from 'tesseract.js'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [model, setModel] = useState(null)
  const [modelResults, setModelResults] = useState({
    condition: '',
    confidence: 0,
    shelfLife: '',
    suggestedExpiry: ''
  })
  const [detectionStatus, setDetectionStatus] = useState('')
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    purchaseDate: '',
    expiryDate: ''
  })
  const [isDetecting, setIsDetecting] = useState(false)
  const [currentPrediction, setCurrentPrediction] = useState(null)
  const [detectedObjects, setDetectedObjects] = useState([])
  const [modelResponse, setModelResponse] = useState('')
  const [detectionBoxes, setDetectionBoxes] = useState([])

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const webcamRef = useRef(null)
  const [isWebcamActive, setIsWebcamActive] = useState(false)

  useEffect(() => {
    loadModel()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadModel = async () => {
    try {
      setDetectionStatus('Loading MobileNet model...')
      await tf.setBackend('webgl')
      const modelUrl = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
      const model = await tf.loadLayersModel(modelUrl)
      setModel(model)
      setIsModelLoaded(true)
      setDetectionStatus('Model loaded successfully! Ready for detection.')
      console.log('Model loaded successfully')
    } catch (error) {
      console.error('Error loading model:', error)
      setDetectionStatus('Error loading model. Please refresh the page.')
      setIsModelLoaded(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      if (webcamRef.current) {
        webcamRef.current.srcObject = stream
        setIsWebcamActive(true)
        startContinuousDetection()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access your camera. Please make sure it is connected and you have granted camera permissions.')
    }
  }

  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      webcamRef.current.srcObject = null
      setIsWebcamActive(false)
      stopContinuousDetection()
    }
  }

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || !model) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageTensor = tf.browser.fromPixels(canvas)
      .resizeNearestNeighbor([224, 224]) // Adjust size based on your model's input requirements
      .expandDims()
      .toFloat()
      .div(255.0)

    const predictions = await model.predict(imageTensor).data()

    const confidence = Math.max(...predictions)
    const condition = confidence > 0.7 ? 'Good' : 'Poor'

    setModelResults({
      condition,
      confidence,
      shelfLife: `${Math.round(confidence * 14)} days`,
      suggestedExpiry: format(new Date(new Date().setDate(new Date().getDate() + Math.round(confidence * 14))), 'yyyy-MM-dd')
    })

    setShowCameraModal(false)
    setShowModelModal(true)
    stopCamera()
  }

  const startContinuousDetection = () => {
    setIsDetecting(true)
    detectFrame()
  }

  const stopContinuousDetection = () => {
    setIsDetecting(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const drawDetection = (canvas, detections) => {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    detections.forEach(detection => {
      const [x, y, width, height] = detection.bbox
      const label = `${detection.class} (${Math.round(detection.confidence * 100)}%)`

      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, width, height)

      ctx.fillStyle = '#00FF00'
      const textWidth = ctx.measureText(label).width
      ctx.fillRect(x, y - 20, textWidth + 10, 20)

      ctx.fillStyle = '#000000'
      ctx.font = '14px Arial'
      ctx.fillText(label, x + 5, y - 5)
    })
  }

  const drawDetectionBoxes = (canvas, detections) => {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    detections.forEach(detection => {
      const { x, y, width, height, label, confidence } = detection

      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, width, height)

      ctx.fillStyle = '#00FF00'
      const text = `${label} (${Math.round(confidence * 100)}%)`
      const textWidth = ctx.measureText(text).width
      ctx.fillRect(x, y - 20, textWidth + 10, 20)

      ctx.fillStyle = '#000000'
      ctx.font = '14px Arial'
      ctx.fillText(text, x + 5, y - 5)
    })
  }

  const detectFrame = async () => {
    if (!isDetecting || !webcamRef.current || !model) return

    const video = webcamRef.current
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    const canvas = document.createElement('canvas')
    canvas.width = videoWidth
    canvas.height = videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, videoWidth, videoHeight)

    try {
      const imageTensor = tf.browser.fromPixels(canvas)
        .resizeNearestNeighbor([224, 224])
        .expandDims()
        .toFloat()
        .div(255.0)

      const predictions = await model.predict(imageTensor).data()

      const topPredictions = Array.from(predictions)
        .map((prob, index) => ({ probability: prob, index }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3)

      const response = await fetch('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/labels.json')
      const classNames = await response.json()

      const foodItems = {
        'banana': ['banana', 'bananas'],
        'apple': ['apple', 'apples'],
        'orange': ['orange', 'oranges'],
        'tomato': ['tomato', 'tomatoes'],
        'carrot': ['carrot', 'carrots'],
        'lettuce': ['lettuce'],
        'broccoli': ['broccoli'],
        'potato': ['potato', 'potatoes'],
        'onion': ['onion', 'onions'],
        'cucumber': ['cucumber', 'cucumbers'],
        'bell pepper': ['bell pepper', 'pepper'],
        'mushroom': ['mushroom', 'mushrooms'],
        'strawberry': ['strawberry', 'strawberries'],
        'grape': ['grape', 'grapes'],
        'lemon': ['lemon', 'lemons'],
        'lime': ['lime', 'limes'],
        'pear': ['pear', 'pears'],
        'peach': ['peach', 'peaches'],
        'plum': ['plum', 'plums'],
        'kiwi': ['kiwi', 'kiwis']
      }

      const foodDetections = []
      topPredictions.forEach(prediction => {
        const detectedItem = classNames[prediction.index].toLowerCase()
        const confidence = prediction.probability

        for (const [food, variations] of Object.entries(foodItems)) {
          if (variations.some(variation =>
            stringSimilarity(detectedItem, variation) > 0.7
          ) && confidence > 0.3) {
            foodDetections.push({
              food,
              confidence,
              bbox: [0, 0, videoWidth, videoHeight]
            })
            break
          }
        }
      })

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

        foodDetections.forEach(detection => {
          const [x, y, width, height] = detection.bbox

          ctx.strokeStyle = '#00FF00'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, width, height)

          ctx.fillStyle = '#00FF00'
          const text = `${detection.food} (${Math.round(detection.confidence * 100)}%)`
          const textWidth = ctx.measureText(text).width
          ctx.fillRect(x, y - 20, textWidth + 10, 20)

          ctx.fillStyle = '#000000'
          ctx.font = '14px Arial'
          ctx.fillText(text, x + 5, y - 5)
        })
      }

      setDetectionBoxes(foodDetections)

      imageTensor.dispose()
      canvas.remove()

    } catch (error) {
      console.error('Error in detection:', error)
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(detectFrame)
    }
  }

  const getModelResponse = async (condition, confidence) => {
    return `Product condition: ${condition}\nConfidence: ${Math.round(confidence * 100)}%\nShelf life: ${Math.round(confidence * 14)} days`
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('Product Data')
        .select('*')
        .eq('user_id', user.id)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('Product Data')
        .insert([{
          product_name: formData.productName,
          quantity: parseInt(formData.quantity),
          purchase_date: formData.purchaseDate,
          expiry_date: formData.expiryDate,
          user_id: user.id
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

  const handleModelDetection = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
      setIsProcessing(true)
      setDetectionStatus('Loading model...')

      try {
        // Load MobileNet model
        setDetectionStatus('Loading MobileNet model...')
        const model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json')

        // Load and preprocess the image
        setDetectionStatus('Processing image...')
        const img = await tf.browser.fromPixels(await createImageBitmap(file))
        const resized = tf.image.resizeBilinear(img, [224, 224])
        const normalized = resized.div(255.0)
        const batched = normalized.expandDims(0)

        // Make prediction
        setDetectionStatus('Making prediction...')
        const predictions = await model.predict(batched).data()

        // Get top prediction
        const topPrediction = Array.from(predictions)
          .map((prob, index) => ({ probability: prob, index }))
          .sort((a, b) => b.probability - a.probability)[0]

        // Load class names
        setDetectionStatus('Loading class names...')
        const response = await fetch('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/labels.json')
        const classNames = await response.json()

        const detectedItem = classNames[topPrediction.index]
        const confidence = topPrediction.probability

        // Map food items to shelf life estimates (in days)
        const shelfLifeMap = {
          'banana': 7,
          'apple': 30,
          'orange': 14,
          'tomato': 7,
          'carrot': 14,
          'lettuce': 5,
          'broccoli': 7,
          'potato': 30,
          'onion': 30,
          'cucumber': 7,
          'bell pepper': 7,
          'mushroom': 5,
          'strawberry': 3,
          'grape': 7,
          'lemon': 14,
          'lime': 14,
          'pear': 7,
          'peach': 5,
          'plum': 5,
          'kiwi': 7
        }

        // Find the best matching food item from our shelf life map
        setDetectionStatus('Matching food item...')
        let bestMatch = null
        let bestMatchScore = 0

        for (const [food, days] of Object.entries(shelfLifeMap)) {
          const score = stringSimilarity(detectedItem.toLowerCase(), food.toLowerCase())
          if (score > bestMatchScore) {
            bestMatchScore = score
            bestMatch = { food, days }
          }
        }

        // Calculate suggested expiry date
        const today = new Date()
        const expiryDate = new Date(today.setDate(today.getDate() + bestMatch.days))

        setModelResults({
          condition: bestMatch ? `Detected: ${bestMatch.food}` : 'Unknown food item',
          confidence: Math.round(confidence * 100),
          shelfLife: bestMatch ? `${bestMatch.days} days` : 'Unknown',
          suggestedExpiry: format(expiryDate, 'yyyy-MM-dd')
        })

        setDetectionStatus(`Detection complete! Detected: ${bestMatch ? bestMatch.food : 'Unknown item'}`)
        setShowModelModal(true)
      } catch (error) {
        console.error('Error processing model detection:', error)
        setDetectionStatus('Error processing the image. Please try again.')
        alert('Error processing the image. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    }
  }

  // Helper function to calculate string similarity
  const stringSimilarity = (str1, str2) => {
    const len1 = str1.length
    const len2 = str2.length
    const matrix = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return 1 - matrix[len1][len2] / Math.max(len1, len2)
  }

  const handleModelSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('Product Data')
        .insert([{
          product_name: formData.productName,
          quantity: parseInt(formData.quantity),
          purchase_date: formData.purchaseDate,
          expiry_date: modelResults.suggestedExpiry,
          user_id: user.id
        }])

      if (error) throw error

      fetchPurchases()
      setShowModelModal(false)
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

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('Product Data')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh the purchases list
      fetchPurchases()
    } catch (error) {
      console.error('Error deleting product:', error.message)
    }
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
                    setShowCameraModal(true)
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

        {showModelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Model Detection Results</h2>

              {!isModelLoaded && (
                <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                    <span className="text-yellow-700">{detectionStatus}</span>
                  </div>
                </div>
              )}

              {isModelLoaded && (
                <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-700">{detectionStatus}</span>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600">{detectionStatus}</span>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Product Condition</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span>{modelResults.condition}</span>
                  <span className="text-blue-600 font-medium">{modelResults.confidence}% confidence</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Suggested Shelf Life</h3>
                <p className="p-3 bg-gray-50 rounded">{modelResults.shelfLife}</p>
              </div>

              <form onSubmit={handleModelSubmit} className="space-y-4">
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
                    Suggested Expiry Date
                  </label>
                  <input
                    type="date"
                    value={modelResults.suggestedExpiry}
                    disabled
                    className="w-full p-2 border rounded bg-gray-100"
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
                      setShowModelModal(false)
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

        {showCameraModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Camera Detection</h2>

              <div className="relative mb-4">
                <video
                  ref={webcamRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ pointerEvents: 'none' }}
                />
                {modelResponse && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded-lg max-w-xs">
                    <pre className="text-sm whitespace-pre-wrap">{modelResponse}</pre>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4">
                {!isWebcamActive ? (
                  <button
                    onClick={startCamera}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Stop Camera
                  </button>
                )}
                <button
                  onClick={() => {
                    stopCamera()
                    setShowCameraModal(false)
                    setDetectedObjects([])
                    setModelResponse('')
                  }}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                {detectedObjects.length > 0 && (
                  <button
                    onClick={() => {
                      const bestDetection = detectedObjects[0]
                      setModelResults({
                        condition: bestDetection.class,
                        confidence: bestDetection.confidence,
                        shelfLife: `${Math.round(bestDetection.confidence * 14)} days`,
                        suggestedExpiry: format(new Date(new Date().setDate(new Date().getDate() + Math.round(bestDetection.confidence * 14))), 'yyyy-MM-dd')
                      })
                      stopCamera()
                      setShowCameraModal(false)
                      setShowModelModal(true)
                    }}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Use Current Detection
                  </button>
                )}
              </div>
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
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => navigate('/donation', { state: { product: purchase } })}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Donate
                      </button>
                    </div>
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
