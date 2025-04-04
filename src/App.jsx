import { useState } from 'react'
import './App.css'
import Login from './components/Login'
import { Route, Routes } from 'react-router-dom'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import DonationDrive from './components/DonationDrive'
import Kitchen from './components/Kitchen'

function App() {
  return (
    <>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/donation' element={<DonationDrive />} />
        <Route path='/kitchen' element={<Kitchen />} />
      </Routes>
    </>
  )
}

export default App
