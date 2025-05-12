import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ContactPage component - Contact page for the Aniway application
 * Provides contact information and frequently asked questions
 */
const ContactPage = () => {
  return (
    <div className="bg-gradient-to-b from-green-50 to-white">
      {/* Header Section */}
      <div className="relative bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-20 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Have questions about AniWay? We're here to help!
          </p>
        </div>
      </div>

      {/* Get In Touch Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-10 transform hover:scale-[1.02] transition-transform duration-300 border-t-4 border-orange-400">
            <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center">Get In Touch</h2>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">Email Us</h3>
              <a 
                href="mailto:aniway.adm@gmail.com" 
                className="text-lg text-orange-400 hover:text-orange-500 transition-colors font-medium"
              >
                aniway.adm@gmail.com
              </a>
              <p className="mt-4 text-gray-600 text-center max-w-md">
                We're always happy to hear from anime enthusiasts and travelers. 
                Drop us a line with your questions, suggestions, or feedback!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-green-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-800 mb-3">What is AniWay?</h3>
              <p className="text-gray-700">
                AniWay is an anime-themed intelligent travel planner designed to help anime fans discover 
                and visit real-world locations featured in their favorite anime series. Our platform 
                combines AI recommendations, interactive maps, and comprehensive itineraries to make 
                planning your anime pilgrimage easy and enjoyable.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-orange-400">
              <h3 className="text-xl font-bold text-gray-800 mb-3">How does AniWay work?</h3>
              <p className="text-gray-700">
                AniWay works by allowing you to select your favorite anime, set your budget and preferences, 
                and then generating a personalized travel plan that includes real-world locations from the 
                anime, accommodation suggestions, transportation options, and activity recommendations. 
                You can view these locations on an interactive map, save your itinerary, and share it with friends.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Is AniWay free to use?</h3>
              <p className="text-gray-700">
                AniWay offers both free and premium features. Basic itinerary planning, location 
                discovery, and map visualization are available for free. Premium features, such as 
                advanced AI recommendations, collaborative planning tools, and offline access, 
                may require a subscription in the future.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Which anime series are supported?</h3>
              <p className="text-gray-700">
                AniWay is continuously expanding its database of anime series. We currently focus on 
                popular series that feature real-world locations, such as "Your Name," "Spirited Away," 
                "Violet Evergarden," and many others. We welcome suggestions for new series to add to our database!
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-orange-400">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Can I contribute to AniWay?</h3>
              <p className="text-gray-700">
                Yes! We welcome contributions from the anime community. You can help by suggesting 
                new anime locations, providing feedback on existing itineraries, or sharing your own 
                anime pilgrimage experiences. Please contact us if you're interested in contributing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Anime Adventure?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Discover real-world locations from your favorite anime series and create unforgettable travel experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/" className="bg-orange-400 text-white hover:bg-orange-500 font-bold py-3 px-8 rounded-lg transition-colors inline-block shadow-md hover:shadow-lg">
              Get Started
            </Link>
            <Link to="/about" className="bg-transparent border-2 border-green-500 hover:bg-green-500 hover:text-white font-bold py-3 px-8 rounded-lg transition-colors inline-block">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;