import React, { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import { supabase } from './supabase.js'
import { differenceInDays, format, parse } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { createWorker } from 'tesseract.js'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
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

  // Define shelf life map for different food items
  const shelfLifeMap = {
    // Fruits
    'apple': 30,
    'banana': 7,
    'orange': 14,
    'tomato': 7,
    'strawberry': 5,
    'grape': 7,
    'lemon': 14,
    'lime': 14,
    'pear': 7,
    'peach': 5,
    'plum': 5,
    'kiwi': 14,
    'mango': 7,
    'pineapple': 5,
    'watermelon': 7,
    'melon': 7,
    'blueberry': 7,
    'raspberry': 3,
    'blackberry': 3,
    'cherry': 7,
    'pomegranate': 14,
    'avocado': 5,

    // Vegetables
    'carrot': 21,
    'lettuce': 7,
    'broccoli': 7,
    'potato': 30,
    'onion': 30,
    'cucumber': 7,
    'bell pepper': 7,
    'mushroom': 7,
    'spinach': 5,
    'kale': 7,
    'cauliflower': 7,
    'cabbage': 14,
    'celery': 14,
    'zucchini': 7,
    'eggplant': 7,
    'green beans': 7,
    'peas': 5,
    'corn': 5,
    'asparagus': 5,
    'brussels sprouts': 7,
    'beet': 14,
    'radish': 7,
    'turnip': 14,
    'sweet potato': 30,
    'garlic': 30,
    'ginger': 30,
    'pumpkin': 30,
    'squash': 7,
    'artichoke': 7,
    'leek': 14,
    'fennel': 7,
    'bok choy': 7,
    'arugula': 5,
    'endive': 7,
    'watercress': 5
  }

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
      setDetectionStatus('Loading COCO-SSD model...')
      await tf.setBackend('webgl')

      const model = await cocoSsd.load()
      setModel(model)
      setIsModelLoaded(true)
      setDetectionStatus('Model loaded successfully! Ready for detection.')
      console.log('COCO-SSD model loaded successfully')
    } catch (error) {
      console.error('Error loading model:', error)
      setDetectionStatus(`Error loading model: ${error.message}. Please refresh the page.`)
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

      const response = await fetch('https://storage.googleapis.com/tfjs-models/tfjs/resnet50/labels.json')
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

  const detectSpoilage = (canvas, detection) => {
    const ctx = canvas.getContext('2d')
    const { bbox } = detection
    const [x, y, width, height] = bbox

    // Extract the region of interest (ROI) for the detected item
    const imageData = ctx.getImageData(x, y, width, height)
    const data = imageData.data

    // Analyze color and texture for spoilage indicators
    let brownPixels = 0
    let darkPixels = 0
    let totalPixels = width * height

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Check for brown/dark spots (common in spoiled food)
      if (r > 100 && g < 100 && b < 100) { // Brownish color
        brownPixels++
      }
      if (r < 50 && g < 50 && b < 50) { // Dark spots
        darkPixels++
      }
    }

    const brownPercentage = (brownPixels / totalPixels) * 100
    const darkPercentage = (darkPixels / totalPixels) * 100
    const spoilagePercentage = (brownPercentage + darkPercentage) / 2

    let spoilageLevel = 'Fresh'
    let shelfLifeReduction = 0
    if (spoilagePercentage > 30) {
      spoilageLevel = 'Spoiled'
      shelfLifeReduction = 0.8 // Reduce shelf life by 80%
    } else if (spoilagePercentage > 15) {
      spoilageLevel = 'Starting to Spoil'
      shelfLifeReduction = 0.5 // Reduce shelf life by 50%
    } else if (spoilagePercentage > 5) {
      spoilageLevel = 'Slightly Spoiled'
      shelfLifeReduction = 0.2 // Reduce shelf life by 20%
    }

    return {
      spoilageLevel,
      spoilagePercentage: Math.round(spoilagePercentage),
      brownPercentage: Math.round(brownPercentage),
      darkPercentage: Math.round(darkPercentage),
      shelfLifeReduction
    }
  }

  const handleModelDetection = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      if (!model) {
        await loadModel()
        if (!model) {
          throw new Error('Model failed to load')
        }
      }

      setSelectedImage(URL.createObjectURL(file))
      setIsProcessing(true)
      setDetectionStatus('Processing image...')

      const img = new Image()
      img.src = URL.createObjectURL(file)

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error('Failed to load image'))
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      let maxRetries = 5
      let currentTry = 0
      let bestDetection = null
      let bestConfidence = 0
      let spoilageInfo = null

      while (currentTry < maxRetries) {
        setDetectionStatus(`Making prediction (Attempt ${currentTry + 1}/${maxRetries})...`)

        const predictions = await model.detect(canvas)

        const foodPredictions = predictions.filter(pred => {
          const foodClasses = [
            'apple', 'banana', 'orange', 'sandwich', 'broccoli', 'carrot',
            'hot dog', 'pizza', 'donut', 'cake', 'chair', 'dining table',
            'potted plant', 'bottle', 'wine glass', 'cup', 'fork', 'knife',
            'spoon', 'bowl'
          ]
          return foodClasses.includes(pred.class.toLowerCase())
        })

        if (foodPredictions.length > 0) {
          const currentConfidence = foodPredictions[0].score
          if (currentConfidence > bestConfidence) {
            bestConfidence = currentConfidence
            bestDetection = foodPredictions[0]
            spoilageInfo = detectSpoilage(canvas, bestDetection)
          }
        }

        if (bestConfidence >= 0.5) {
          setDetectionStatus(`Confidence level reached ${Math.round(bestConfidence * 100)}% after ${currentTry + 1} attempts`)
          break
        }

        currentTry++
        if (currentTry < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (!bestDetection) {
        throw new Error('Unable to detect any food items in the image')
      }

      if (bestConfidence >= 0.5) {
        const detectedClass = bestDetection.class.toLowerCase()
        const detectedFood = detectFoodItem(detectedClass)
        const baseShelfLife = shelfLifeMap[detectedFood] || 7

        const adjustedShelfLife = Math.max(1, Math.floor(baseShelfLife * (1 - spoilageInfo.shelfLifeReduction)))

        const today = new Date()
        const expiryDate = new Date(today.setDate(today.getDate() + adjustedShelfLife))

        setModelResults({
          condition: `Detected: ${detectedFood}`,
          confidence: Math.round(bestConfidence * 100),
          shelfLife: `${adjustedShelfLife} days (${spoilageInfo.spoilageLevel})`,
          suggestedExpiry: format(expiryDate, 'yyyy-MM-dd'),
          spoilageLevel: spoilageInfo.spoilageLevel,
          spoilagePercentage: spoilageInfo.spoilagePercentage,
          spoilageDetails: {
            brownSpots: spoilageInfo.brownPercentage,
            darkSpots: spoilageInfo.darkPercentage,
            totalSpoilage: spoilageInfo.spoilagePercentage
          }
        })

        setDetectionStatus(`Detection complete! Detected: ${detectedFood} (${Math.round(bestConfidence * 100)}% confidence) - ${spoilageInfo.spoilageLevel} (${spoilageInfo.spoilagePercentage}% spoiled)`)
        setShowModelModal(true)
      } else {
        setDetectionStatus('Unable to detect the item with sufficient confidence. Please try again with a clearer image.')
        alert('Unable to detect the item with sufficient confidence. Please try again with a clearer image.')
        setShowModelModal(false)
      }

      canvas.remove()
      URL.revokeObjectURL(img.src)

    } catch (error) {
      console.error('Error processing model detection:', error)
      setDetectionStatus('Error processing the image. Please try again.')
      alert(`Error processing the image: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const detectFoodItem = (className) => {
    const foodMappings = {
      'banana': ['banana', 'bananas'],
      'apple': ['apple', 'apples'],
      'orange': ['orange', 'oranges'],
      'tomato': ['tomato', 'tomatoes'],
      'strawberry': ['strawberry', 'strawberries'],
      'grape': ['grape', 'grapes'],
      'lemon': ['lemon', 'lemons'],
      'lime': ['lime', 'limes'],
      'pear': ['pear', 'pears'],
      'peach': ['peach', 'peaches'],
      'plum': ['plum', 'plums'],
      'kiwi': ['kiwi', 'kiwis'],
      'mango': ['mango', 'mangoes'],
      'pineapple': ['pineapple', 'pineapples'],
      'watermelon': ['watermelon'],
      'melon': ['melon', 'melons'],
      'blueberry': ['blueberry', 'blueberries'],
      'raspberry': ['raspberry', 'raspberries'],
      'blackberry': ['blackberry', 'blackberries'],
      'cherry': ['cherry', 'cherries'],
      'pomegranate': ['pomegranate', 'pomegranates'],
      'avocado': ['avocado', 'avocados'],

      'carrot': ['carrot', 'carrots'],
      'lettuce': ['lettuce'],
      'broccoli': ['broccoli'],
      'potato': ['potato', 'potatoes'],
      'onion': ['onion', 'onions'],
      'cucumber': ['cucumber', 'cucumbers'],
      'bell pepper': ['bell pepper', 'pepper', 'peppers'],
      'mushroom': ['mushroom', 'mushrooms'],
      'spinach': ['spinach'],
      'kale': ['kale'],
      'cauliflower': ['cauliflower'],
      'cabbage': ['cabbage'],
      'celery': ['celery'],
      'zucchini': ['zucchini', 'courgette'],
      'eggplant': ['eggplant', 'aubergine'],
      'green beans': ['green bean', 'beans'],
      'peas': ['pea', 'peas'],
      'corn': ['corn', 'maize'],
      'asparagus': ['asparagus'],
      'brussels sprouts': ['brussels sprout', 'brussels sprouts'],
      'beet': ['beet', 'beets', 'beetroot'],
      'radish': ['radish', 'radishes'],
      'turnip': ['turnip', 'turnips'],
      'sweet potato': ['sweet potato', 'sweet potatoes'],
      'garlic': ['garlic'],
      'ginger': ['ginger'],
      'pumpkin': ['pumpkin', 'pumpkins'],
      'squash': ['squash'],
      'artichoke': ['artichoke', 'artichokes'],
      'leek': ['leek', 'leeks'],
      'fennel': ['fennel'],
      'bok choy': ['bok choy', 'pak choi'],
      'arugula': ['arugula', 'rocket'],
      'endive': ['endive'],
      'watercress': ['watercress']
    }

    const lowerClassName = className.toLowerCase()
    for (const [food, variations] of Object.entries(foodMappings)) {
      if (variations.some(variation => lowerClassName.includes(variation))) {
        return food
      }
    }
    return 'Unknown Item'
  }

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

  const sendExpiryNotification = async (item) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <h2 style="color: #dc3545; text-align: center;">⚠️ Expiry Alert ⚠️</h2>
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <p style="font-size: 16px; margin-bottom: 10px;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 10px;">This is to inform you that the following item in your fridge is about to expire:</p>
            <div style="background-color: #fff3f3; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Item:</strong> ${item.product_name}</p>
              <p style="margin: 5px 0;"><strong>Quantity:</strong> ${item.quantity}</p>
              <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${item.formatted_expiry}</p>
              <p style="margin: 5px 0;"><strong>Days Remaining:</strong> ${item.remaining_days} day(s)</p>
            </div>
            <p style="font-size: 16px; margin-top: 20px;">Please take necessary action to prevent food waste.</p>
            <p style="font-size: 16px; margin-top: 20px;">Best regards,<br>FridgeFriend Team</p>
          </div>
        </div>
      `

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          subject: `⚠️ Expiry Alert: ${item.product_name}`,
          html: emailTemplate
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  const handleModelSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      if (!modelResults.suggestedExpiry) {
        throw new Error('Please select an expiry date')
      }

      const currentDate = new Date().toISOString().split('T')[0]

      const detectedItem = modelResults.condition.replace('Detected: ', '').trim()

      const newItem = {
        product_name: detectedItem || 'Unknown Item',
        quantity: parseInt(formData.quantity) || 1,
        purchase_date: currentDate,
        expiry_date: modelResults.suggestedExpiry,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('Product Data')
        .insert([newItem])
        .select()

      if (error) throw error

      alert('Item added successfully to the database!')

      await fetchPurchases()

      const expiringItems = purchases.filter(item => item.remaining_days <= 1)
      if (expiringItems.length > 0) {
        expiringItems.forEach(item => sendExpiryNotification(item))
      }

      // Reset form and close modal
      setShowModelModal(false)
      setFormData({
        productName: '',
        quantity: '',
        purchaseDate: '',
        expiryDate: ''
      })
      setSelectedImage(null)
      setModelResults({
        condition: '',
        confidence: 0,
        shelfLife: '',
        suggestedExpiry: ''
      })

    } catch (error) {
      console.error('Error adding product:', error.message)
      alert(`Error adding product: ${error.message}`)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('Product Data')
        .delete()
        .eq('id', id)

      if (error) throw error

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
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Fridge</h1>
            <p className="text-gray-400 mt-2">Manage your food items and track expiry dates</p>
          </div>
          <button
            onClick={handleAddItem}
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Item
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Items</p>
                <h3 className="text-2xl font-bold text-white mt-1">{purchases.length}</h3>
              </div>
              <div className="bg-blue-900 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Expiring Soon</p>
                <h3 className="text-2xl font-bold text-red-400 mt-1">
                  {purchases.filter(item => item.remaining_days <= 1).length}
                </h3>
              </div>
              <div className="bg-red-900 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Average Shelf Life</p>
                <h3 className="text-2xl font-bold text-green-400 mt-1">
                  {purchases.length > 0
                    ? Math.round(purchases.reduce((acc, item) => acc + item.remaining_days, 0) / purchases.length)
                    : 0} days
                </h3>
              </div>
              <div className="bg-green-900 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold text-white mb-4">Days Until Expiry</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expiryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  barSize={40}
                >
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="opacity-30"
                    stroke="#374151"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#000000'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    formatter={(value) => [`${value} days`, 'Remaining']}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{
                      color: '#9CA3AF'
                    }}
                  />
                  <Bar
                    dataKey="days"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                    animationBegin={0}
                    animationEasing="ease-in-out"
                  >
                    {expiryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.days <= 1 ? 'url(#dangerGradient)' :
                          entry.days <= 7 ? 'url(#warningGradient)' :
                            'url(#colorGradient)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold text-white mb-4">Product Quantities</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quantityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="quantity"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    animationDuration={1500}
                    animationBegin={0}
                  >
                    {quantityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#1F2937"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      color: '#9CA3AF'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white">Your Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className={`hover:bg-gray-700 transition-colors ${purchase.remaining_days < 0 ? 'bg-red-900/30 animate-pulse' : ''
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{purchase.product_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{purchase.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{purchase.formatted_expiry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${purchase.remaining_days < 0
                          ? 'bg-red-900 text-red-200'
                          : purchase.remaining_days <= 1
                            ? 'bg-red-900 text-red-200'
                            : purchase.remaining_days <= 7
                              ? 'bg-yellow-900 text-yellow-200'
                              : 'bg-green-900 text-green-200'
                          }`}
                      >
                        {purchase.remaining_days < 0 ? 'Expired' : `${purchase.remaining_days} days`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {purchase.remaining_days >= 0 && (
                          <button
                            onClick={() => navigate('/donation', { state: { product: purchase } })}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Item</h2>
            <p className="text-gray-400 mb-4">Choose how you want to add the item:</p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  closeModal()
                  setShowModelModal(true)
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Using Detection Model
              </button>

              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowImageModal(true)
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Extract Expiry by Image
              </button>
            </div>

            <button
              onClick={closeModal}
              className="mt-4 w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Product Image</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Image
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400">PNG, JPG or JPEG (MAX. 800x400px)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isProcessing}
                      />
                    </label>
                  </div>
                </div>

                {isProcessing && (
                  <div className="mb-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Processing image...</p>
                  </div>
                )}

                {selectedImage && !isProcessing && (
                  <div className="mb-4">
                    <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-96 object-contain rounded-lg" />
                  </div>
                )}
              </div>

              {/* Form Section */}
              <div className="space-y-4">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expiry Date (Extracted)
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
                      className="flex-1 bg-gray-700 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Image for Detection</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModelDetection}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                    disabled={isProcessing}
                  />
                </div>

                {isProcessing && (
                  <div className="mb-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Processing image...</p>
                  </div>
                )}

                {selectedImage && !isProcessing && (
                  <div className="mb-4">
                    <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-96 object-contain rounded-lg" />
                  </div>
                )}
              </div>

              {modelResults.condition && !isProcessing && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">Detection Results</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span className="text-gray-300">{modelResults.condition}</span>
                      <span className="text-blue-400 font-medium">{modelResults.confidence}% confidence</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">Spoilage Analysis</h3>
                    <div className="p-3 bg-gray-700 rounded space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Condition:</span>
                        <span className={`font-medium ${modelResults.spoilageLevel === 'Spoiled' ? 'text-red-400' :
                          modelResults.spoilageLevel === 'Starting to Spoil' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                          {modelResults.spoilageLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">Adjusted Shelf Life</h3>
                    <p className="p-3 bg-gray-700 rounded text-gray-300">{modelResults.shelfLife}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">Suggested Expiry Date</h3>
                    <p className="p-3 bg-gray-700 rounded text-gray-300">{modelResults.suggestedExpiry}</p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleModelSubmit}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add to Database
                    </button>
                    <button
                      onClick={() => {
                        setShowModelModal(false)
                        setSelectedImage(null)
                        setModelResults({
                          condition: '',
                          confidence: 0,
                          shelfLife: '',
                          suggestedExpiry: ''
                        })
                      }}
                      className="flex-1 bg-gray-700 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-white mb-4">Camera Detection</h2>

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
                <div className="absolute bottom-4 left-4 bg-gray-900/90 text-white p-2 rounded-lg max-w-xs">
                  <pre className="text-sm whitespace-pre-wrap">{modelResponse}</pre>
                </div>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              {!isWebcamActive ? (
                <button
                  onClick={startCamera}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
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
                className="bg-gray-700 text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
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
                  className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Use Current Detection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
