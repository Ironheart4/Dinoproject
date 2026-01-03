import React from 'react'
import { User, Heart, BookOpen, Brain, Bot, Map, Clock, Image, Video, Cuboid as Cube3d, Github, Mail, Coffee, ExternalLink } from 'lucide-react'

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold font-display text-primary-700 mb-4">About DinoProject</h2>
      <p className="text-gray-600 text-lg mb-8">A passion project bringing dinosaurs to life through code</p>

      {/* Who Built This */}
      <section className="bg-white rounded-lg shadow p-8 mb-8">
        <h3 className="text-2xl font-bold font-display text-primary-700 mb-4 flex items-center gap-2">
          <User className="text-green-500" /> Who Built DinoProject
        </h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Hi, I'm <strong>Ayomide Mathins</strong> — a self-taught developer and university student at the <strong>University of Johannesburg</strong>. 
          I've been fascinated by dinosaurs since I was a kid. Growing up, I watched every Jurassic Park and Jurassic World movie more times than I can count. 
          There's something about these ancient creatures that just captures the imagination.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          DinoProject started as a way to combine two things I love: <strong>dinosaurs</strong> and <strong>building things with code</strong>. 
          It's part of my learning journey as I teach myself full-stack development — working with databases, APIs, cloud hosting, interactive maps, 3D graphics, and even experimenting with AI.
        </p>
        <p className="text-gray-700 leading-relaxed mb-6">
          This isn't a company or a startup. It's just me, learning by building something I genuinely care about.
        </p>
        <a 
          href="https://github.com/Ironheart4" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          <Github size={20} /> View My GitHub
        </a>
      </section>

      {/* Mission & Purpose */}
      <section className="bg-primary-50 rounded-lg shadow p-8 mb-8">
        <h3 className="text-2xl font-bold font-display text-primary-700 mb-4 flex items-center gap-2">
          <Heart className="text-red-500" /> Why I Built This
        </h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          When I was learning about dinosaurs as a kid, most resources were just walls of text or static images in books. 
          I always wished there was something more <strong>visual</strong>, more <strong>interactive</strong> — something that made you feel like you were actually exploring their world.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          That's what DinoProject aims to be. Not a textbook, but an experience. A place where you can:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Explore dinosaurs visually with images, videos, and 3D models</li>
          <li>See where they lived on an interactive map</li>
          <li>Understand when they existed on a timeline</li>
          <li>Test your knowledge with quizzes</li>
          <li>Ask questions to an AI assistant (experimental!)</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          It's driven by <strong>curiosity and accessibility</strong>, not profit. I want anyone — students, kids, adults, educators — to be able to explore and learn for free.
        </p>
      </section>

      {/* What DinoProject Offers */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold font-display text-primary-700 mb-6 flex items-center gap-2">
          <BookOpen className="text-green-500" /> What DinoProject Offers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <BookOpen size={32} className="text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">Dinosaur Encyclopedia</h4>
              <p className="text-sm text-gray-600">Browse detailed profiles of dinosaur species with information about diet, size, period, and habitat.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <Clock size={32} className="text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">Interactive Timeline</h4>
              <p className="text-sm text-gray-600">Visualize the Mesozoic Era — Triassic, Jurassic, and Cretaceous periods — and see when each dinosaur lived.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <Map size={32} className="text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">Fossil Map</h4>
              <p className="text-sm text-gray-600">Explore where dinosaur fossils have been discovered around the world on an interactive map.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <Brain size={32} className="text-purple-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">Knowledge Quizzes</h4>
              <p className="text-sm text-gray-600">Test what you've learned with fun quizzes and track your scores over time.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <Cube3d size={32} className="text-teal-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">3D Models</h4>
              <p className="text-sm text-gray-600">View dinosaurs in 3D — rotate, zoom, and explore them from every angle.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <Bot size={32} className="text-indigo-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">AI Dino Assistant</h4>
              <p className="text-sm text-gray-600">An experimental AI chatbot that answers your dinosaur questions. Still learning!</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <Image size={32} className="text-pink-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">Images & Illustrations</h4>
              <p className="text-sm text-gray-600">High-quality dinosaur images and artistic reconstructions.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 flex items-start gap-4">
            <Video size={32} className="text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">Video Content</h4>
              <p className="text-sm text-gray-600">Embedded videos to bring dinosaurs to life with motion and sound.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Independent Project Disclaimer */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-amber-800 mb-3">⚠️ Independent Project Disclaimer</h3>
        <p className="text-amber-900 leading-relaxed mb-2">
          DinoProject is a <strong>solo, independent project</strong> — not a company, organization, or commercial product. 
          It's built by one person (me!) while studying at university and learning software development.
        </p>
        <p className="text-amber-900 leading-relaxed">
          Features are constantly evolving. Some things might break, change, or be experimental. 
          That's part of the journey! I appreciate your patience as I continue to learn and improve the platform.
        </p>
      </section>

      {/* Support the Creator */}
      <section className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg p-8 mb-8">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Coffee className="text-yellow-300" /> Support the Creator
        </h3>
        <p className="leading-relaxed mb-4 opacity-95">
          If you enjoy DinoProject and want to help keep it running, consider making a small donation. 
          Your support helps cover:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-6 opacity-95">
          <li>Hosting and server costs</li>
          <li>Database and cloud services</li>
          <li>Development tools and resources</li>
          <li>Time spent building and improving features</li>
        </ul>
        <p className="leading-relaxed mb-6 opacity-95">
          <strong>$5+ suggested</strong> (one-time donation via PayPal). Supporters may receive access to premium features in the future, 
          though some ads may still appear to help sustain the project.
        </p>
        <a 
          href="https://www.paypal.com/ncp/payment/EVW4TFDP3B9RU" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-gray-100 transition font-bold shadow-lg"
        >
          <Coffee size={20} /> Support via PayPal <ExternalLink size={16} />
        </a>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-2xl font-bold font-display text-primary-700 mb-4">Get In Touch</h3>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          Have questions, suggestions, or just want to say hi? Feel free to reach out! 
          I read every message and appreciate all feedback.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="mailto:dinoprojectoriginal@gmail.com" 
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-600 transition font-medium inline-flex items-center justify-center gap-2"
          >
            <Mail size={18} /> dinoprojectoriginal@gmail.com
          </a>
          <a 
            href="https://github.com/Ironheart4" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium inline-flex items-center justify-center gap-2"
          >
            <Github size={18} /> GitHub
          </a>
        </div>
      </section>
    </div>
  )
}
