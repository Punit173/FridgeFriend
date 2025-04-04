import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className={`shadow-lg ${isAuthenticated ? 'bg-emerald-600' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className={`text-2xl font-bold ${isAuthenticated ? 'text-white' : 'text-gray-800'}`}>
              FridgeFriend
            </Link>
          </div>
          <div className="flex space-x-8">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-emerald-200 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/donation" className="text-white hover:text-emerald-200 px-3 py-2 rounded-md text-sm font-medium">
                  Donation Drive
                </Link>
                <Link to="/kitchen" className="text-white hover:text-emerald-200 px-3 py-2 rounded-md text-sm font-medium">
                  Virtual Kitchen
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-emerald-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
