import React, { useState } from 'react'
import Navbar from './Navbar'
import { generateResponse } from '../config/gemini'
import ReactMarkdown from 'react-markdown'

const Recipe = () => {
  const [recipeQuery, setRecipeQuery] = useState('')
  const [recipe, setRecipe] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const extractVideoId = (url) => {
    // Handle both full URLs and video IDs
    if (!url) return '';

    // If it's already a video ID, return it
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return url;
    }

    // Extract video ID from URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!recipeQuery.trim()) return

    setIsLoading(true)
    setError('')
    setRecipe('')
    setVideoUrl('')

    try {
      // First, get the recipe
      const recipePrompt = `You are a professional chef. Please provide a detailed recipe for: ${recipeQuery}. Include the following sections in markdown format:
      1. Ingredients (with measurements)
      2. Instructions (step by step)
      3. Cooking time
      4. Serving size
      5. Tips and variations (if any)
      
      Format the response in proper markdown with appropriate headings and lists.`

      const recipeResult = await generateResponse(recipePrompt)
      setRecipe(recipeResult)

      // Then, get a relevant YouTube video URL
      const videoPrompt = `For the recipe "${recipeQuery}", provide a full YouTube URL of a good tutorial video. 
      The URL should be in the format: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID.
      Return ONLY the URL, nothing else.`

      const videoResult = await generateResponse(videoPrompt)
      setVideoUrl(videoResult.trim())
    } catch (err) {
      setError('Failed to generate recipe. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const videoId = extractVideoId(videoUrl)

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">Recipe Generator</h1>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={recipeQuery}
                onChange={(e) => setRecipeQuery(e.target.value)}
                placeholder="What recipe would you like to make? (e.g., chocolate cake, pasta carbonara)"
                className="flex-1 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-900"
              >
                {isLoading ? 'Generating...' : 'Generate Recipe'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 mb-4 text-red-200 bg-red-900/50 rounded-lg">
              {error}
            </div>
          )}

          {recipe && (
            <div className="space-y-8">
              {videoId && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-4 text-white">Video Tutorial</h2>
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Recipe Tutorial"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-[400px] rounded-lg"
                    ></iframe>
                  </div>
                </div>
              )}

              <div className="prose max-w-none bg-gray-800 p-6 rounded-lg shadow-lg text-gray-300">
                <ReactMarkdown>{recipe}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Recipe
