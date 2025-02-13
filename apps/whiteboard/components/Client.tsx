"use client";

import { motion } from "framer-motion";
import { Pencil, Share2, Sparkles, Users } from "lucide-react";
// import LivePreview from "./live-preview";

const features = [
  {
    icon: <Pencil className="w-6 h-6" />,
    title: "Intuitive Drawing",
    description:
      "Sketch and draw with natural, fluid movements that feel just right",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Real-time Collaboration",
    description:
      "Work together seamlessly with your team, anywhere in the wo   rld",
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: "Easy Sharing",
    description: "Share your creations instantly with a simple link",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Smart Features",
    description: "Intelligent shape recognition and drawing assistance",
  },
];

export function Client() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Whiteboarding, <span className="text-blue-400">Reimagined</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Create, collaborate, and bring your ideas to life with our intuitive
            drawing tool.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors duration-200">
              Start Drawing Now
            </button>
          </motion.div>
        </motion.div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="col-span-1 md:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                            <Pencil className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
              </div>
              <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-400 text-sm">Drawing Canvas</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Real-time Preview
              </h3>
              <p className="text-gray-400">
                See your changes instantly as you draw and collaborate.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Export Options
              </h3>
              <p className="text-gray-400">
                Download your work in multiple formats with one click.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to bring your ideas to life?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of creators and teams using our platform.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Get Started Free
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
