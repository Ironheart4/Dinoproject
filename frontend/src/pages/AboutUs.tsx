import React from 'react'
import { Target, Sparkles, BookOpen, Brain, Bot, Microscope, Code, Palette, Mail } from 'lucide-react'

export default function AboutUs() {
  return (
    <div>
      <h2 className="text-4xl font-bold font-display text-primary-700 mb-4">About DinoProject</h2>
      <p className="text-gray-600 text-lg mb-8">Bringing the age of dinosaurs to the modern world</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Mission */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold font-display text-primary-700 mb-4 flex items-center gap-2"><Target className="text-green-500" /> Our Mission</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            DinoProject is dedicated to making prehistoric education fun, engaging, and accessible to everyone. We combine interactive learning, e-commerce, and community to create a unique experience around dinosaurs.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Whether you're a student, educator, or dino enthusiast, DinoProject provides the tools and resources to explore, learn, and collect.
          </p>
        </div>

        {/* Vision */}
        <div className="bg-primary-50 rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold font-display text-primary-700 mb-4 flex items-center gap-2"><Sparkles className="text-purple-500" /> Our Vision</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            We envision a world where learning about dinosaurs is engaging and fun for all ages. Our platform bridges education, entertainment, and commerce.
          </p>
          <p className="text-gray-700 leading-relaxed">
            With our interactive 3D models, immersive quizzes, and AI assistant, we're making paleontology accessible and exciting for the next generation of scientists.
          </p>
        </div>
      </div>

      {/* Features */}
      <section className="mb-12">
        <h3 className="text-3xl font-bold font-display text-primary-700 mb-8">What We Offer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <BookOpen size={48} className="mx-auto mb-3 text-green-500" />
            <h4 className="font-semibold text-primary-700 mb-2">Encyclopedia</h4>
            <p className="text-sm text-gray-600">Comprehensive dinosaur database with detailed information about species, diet, and habitats.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Brain size={48} className="mx-auto mb-3 text-blue-500" />
            <h4 className="font-semibold text-primary-700 mb-2">Interactive Quiz</h4>
            <p className="text-sm text-gray-600">Test your knowledge with our engaging quiz and see how you compare with other dino fans.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Bot size={48} className="mx-auto mb-3 text-purple-500" />
            <h4 className="font-semibold text-primary-700 mb-2">AI Dino Assistant</h4>
            <p className="text-sm text-gray-600">Ask questions and get instant answers about any dinosaur from our AI-powered assistant.</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mb-12">
        <h3 className="text-3xl font-bold font-display text-primary-700 mb-8">Our Team</h3>
        <p className="text-gray-700 mb-8 text-center max-w-2xl mx-auto">
          DinoProject was founded by a group of passionate educators, developers, and dinosaur enthusiasts who wanted to make learning about prehistoric creatures fun and engaging.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Dr. Paleo', role: 'Founder & Paleontologist', icon: Microscope, color: 'text-green-500' },
            { name: 'Alex Dev', role: 'Lead Developer', icon: Code, color: 'text-blue-500' },
            { name: 'Sam Design', role: 'Creative Director', icon: Palette, color: 'text-purple-500' },
          ].map((member, idx) => {
            const IconComponent = member.icon
            return (
              <div key={idx} className="bg-white rounded-lg shadow p-6 text-center">
                <IconComponent size={48} className={`mx-auto mb-3 ${member.color}`} />
                <h4 className="font-semibold text-primary-700">{member.name}</h4>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-500 text-white rounded-lg p-12 mb-12">
        <h3 className="text-3xl font-bold text-center mb-8">By The Numbers</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">150+</div>
            <p>Dinosaur Species</p>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">50K+</div>
            <p>Active Users</p>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">1000+</div>
            <p>Products Sold</p>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">98%</div>
            <p>Satisfaction Rate</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-2xl font-bold font-display text-primary-700 mb-4">Get In Touch</h3>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          Have questions or feedback? We'd love to hear from you! Reach out to our team and let's bring dinosaurs to life together.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="mailto:dinoprojectoriginal@gmail.com" 
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-600 transition font-medium inline-flex items-center justify-center gap-2"
          >
            <Mail size={18} /> dinoprojectoriginal@gmail.com
          </a>
        </div>
      </section>
    </div>
  )
}
