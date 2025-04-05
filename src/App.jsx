import { useState } from 'react'
import './App.css'
import Login from './components/Login'
import { Route, Routes } from 'react-router-dom'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import DonationDrive from './components/DonationDrive'
import Kitchen from './components/Kitchen'
import LandingPage from './components/LandingPage'
import Recipe from './components/Recipe'
import Community from './components/Community'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/recipe' element={<Recipe />} />
        <Route path='/community' element={<Community />} />
        <Route path='/donation' element={<DonationDrive />} />
        <Route path='/kitchen' element={<Kitchen />} />
      </Routes>
    </>
  )
}

export default App
