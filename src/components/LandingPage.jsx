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
      icon: <FaBell className="text-4xl text-green-500" />,
      title: "Smart Tracking & Expiry Reminders",
      description: "AI-powered system keeps an eye on stored food and sends timely reminders before items expire."
    },
    {
      icon: <FaMicrophone className="text-4xl text-green-500" />,
      title: "Voice & OCR-Based Freshness Detection",
      description: "Just speak to add food items. OCR analyzes visual cues to estimate spoilage and send alerts."
    },
    {
      icon: <FaHandshake className="text-4xl text-green-500" />,
      title: "Connecting Surplus Food",
      description: "Bridge the gap between households, restaurants, and NGOs to redistribute surplus food efficiently."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a192f] relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          src={video}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0a192f]/80 backdrop-blur-sm" />
      </div>

      <section className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <FaLeaf className="text-6xl text-green-500" />
          </motion.div>
          <h1 className="text-6xl font-bold text-green-500 mb-6 leading-tight">
          Smarter Food ,Less Waste<br /> FridgeFriend
          </h1>
          <p className="text-xl text-green-200 mb-8 max-w-2xl mx-auto">
            Reinventing fridge and pantry management for a sustainable India.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center bg-green-400 text-[#0a192f] px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-300 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
              <FaArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            {...fadeInUp}
            className="max-w-3xl mx-auto text-center bg-[#004d24]/80 backdrop-blur-sm p-12 rounded-2xl shadow-xl border border-cyan-400/20"
          >
            <h2 className="text-4xl font-bold text-green-400 mb-6">The Challenge</h2>
            <p className=" text-emerald-200 text-lg leading-relaxed">
              India, the world's second-largest food producer, faces a troubling paradox—over 30% of our food supply goes to waste.
              Much of this happens not because we lack food, but because we struggle to manage it efficiently.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <motion.h2
            {...fadeInUp}
            className="text-4xl font-bold text-center text-green-400 mb-12"
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
                className="bg-[#004d24]/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-cyan-400/20"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex justify-center mb-6"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-semibold  text-green-400 mb-4">{feature.title}</h3>
                <p className=" text-emerald-100 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            {...fadeInUp}
            className="bg-[#004d24]/80 backdrop-blur-sm text-white p-12 rounded-2xl shadow-2xl border border-cyan-400/20"
          >
            <h2 className="text-4xl font-bold text-green-400 mb-6">Ready to Make a Difference?</h2>
            <p className="text-xl  text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join our community and start reducing food waste today
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/register"
                className="inline-flex items-center bg-green-400 text-[#0a192f] px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-300 transition-colors"
              >
                Sign Up Now
                <FaArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#004d24]/80 backdrop-blur-sm text-white py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <FaLeaf className="text-4xl text-green-400 mb-4" />
              <p className="text-lg text-gray-300">© 2024 FridgeFriend. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-gray-300 hover:text-green-600 transition-colors"
              >
                About Us
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-gray-300 hover:text-green-600 transition-colors"
              >
                Contact
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-gray-300 hover:text-green-600 transition-colors"
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