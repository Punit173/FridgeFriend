import React from 'react';
import { motion } from 'framer-motion';
import { FaLeaf, FaBell, FaMicrophone, FaHandshake, FaChartLine, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import video from '../assets/video1.webm'

const LandingPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const features = [
    {
      icon: <FaBell className="text-4xl text-indigo-600" />,
      title: "Smart Tracking & Expiry Reminders",
      description: "AI-powered system keeps an eye on stored food and sends timely reminders before items expire."
    },
    {
      icon: <FaMicrophone className="text-4xl text-indigo-600" />,
      title: "Voice & OCR-Based Freshness Detection",
      description: "Just speak to add food items. OCR analyzes visual cues to estimate spoilage and send alerts."
    },
    {
      icon: <FaHandshake className="text-4xl text-indigo-600" />,
      title: "Connecting Surplus Food",
      description: "Bridge the gap between households, restaurants, and NGOs to redistribute surplus food efficiently."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <FaLeaf className="text-6xl text-indigo-600" />
          </motion.div>
          <h1 className="text-6xl font-bold text-indigo-900 mb-6 leading-tight">
            Fight Food Waste,<br />Feed the Future
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join us in revolutionizing food management and reducing waste in India
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
              <FaArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </motion.div>

        <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            className='mt-5 w-full max-w-2xl mx-auto rounded-lg shadow-lg'
          />
        
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-10"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-300 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-300 rounded-full blur-3xl" />
        </motion.div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            {...fadeInUp}
            className="max-w-3xl mx-auto text-center bg-white/80 backdrop-blur-sm p-12 rounded-2xl shadow-xl"
          >
            <h2 className="text-4xl font-bold text-indigo-900 mb-6">The Challenge</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              India, the world's second-largest food producer, faces a troubling paradox—over 30% of our food supply goes to waste. 
              Much of this happens not because we lack food, but because we struggle to manage it efficiently.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            {...fadeInUp}
            className="text-4xl font-bold text-center text-indigo-900 mb-12"
          >
            Our Solution
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex justify-center mb-6"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-semibold text-indigo-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-12 rounded-2xl shadow-2xl"
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join our community and start reducing food waste today
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/register"
                className="inline-flex items-center bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Sign Up Now
                <FaArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <FaLeaf className="text-4xl text-white mb-4" />
              <p className="text-lg">© 2024 FridgeFriend. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-white hover:text-indigo-200 transition-colors"
              >
                About Us
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-white hover:text-indigo-200 transition-colors"
              >
                Contact
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-white hover:text-indigo-200 transition-colors"
              >
                Privacy Policy
              </motion.a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;