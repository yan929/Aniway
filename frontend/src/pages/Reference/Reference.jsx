import React from "react";
import { Link } from "react-router-dom";

/**
 * ReferencePage component - Reference page for the Aniway application
 * Displays information about resources, APIs, and inspirations used in the project
 */
const ReferencePage = () => {
  return (
    <div className="bg-gradient-to-b from-green-50 to-white">
      {/* Header Section */}
      <div className="relative bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-20 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            References & Resources
          </h1>
          <p className="text-xl md:text-2xl mx-auto max-w-3xl">
            The building blocks and inspirations behind AniWay
          </p>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 mb-8">
            AniWay draws inspiration from various resources, technologies, and
            existing applications. This page acknowledges the tools, APIs, and
            references that helped make our anime-themed travel planner
            possible. We're grateful to the developers, creators, and
            communities that provide these valuable resources.
          </p>
        </div>
      </div>

      {/* Inspirations Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
            Inspirations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Inspiration 1 */}
            <div className="bg-green-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-b-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Tripadvisor Trip Planner
              </h3>
              <p className="text-gray-700 mb-4">
                We were inspired by Tripadvisor's AI-powered trip planning
                interface and their comprehensive tourist spot database with
                user reviews.
              </p>
              <a
                href="https://www.tripadvisor.co.nz/AITripBuilder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-500 font-medium inline-flex items-center"
              >
                Visit Website
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            {/* Inspiration 2 */}
            <div className="bg-orange-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-b-4 border-orange-400">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Wanderlog
              </h3>
              <p className="text-gray-700 mb-4">
                We drew inspiration from Wanderlog's user-friendly interface,
                map visualization, and collaborative features for group travel
                planning.
              </p>
              <a
                href="https://wanderlog.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-500 font-medium inline-flex items-center"
              >
                Visit Website
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            {/* Inspiration 3 */}
            <div className="bg-gray-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-b-4 border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Anitabi</h3>
              <p className="text-gray-700 mb-4">
                Anitabi's anime location mapping system helped us understand how
                to effectively display and categorize anime-related real-world
                locations.
              </p>
              <a
                href="https://anitabi.cn/map"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-500 font-medium inline-flex items-center"
              >
                Visit Website
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Technologies & APIs Section */}
      <div className="bg-green-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
            Technologies & APIs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* API 1 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Google Maps API
                  </h3>
                  <p className="text-sm text-orange-400">
                    Mapping and Location Services
                  </p>
                </div>
              </div>
              <p className="text-gray-700">
                We utilize the Google Maps API for interactive mapping,
                geocoding, and directions. This allows us to display anime
                locations and create optimized routes for travelers.
              </p>
              <div className="mt-4">
                <a
                  href="https://developers.google.com/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-600 font-medium text-sm"
                >
                  Documentation →
                </a>
              </div>
            </div>

            {/* API 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-400">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    OpenAI API
                  </h3>
                  <p className="text-sm text-orange-400">AI Recommendations</p>
                </div>
              </div>
              <p className="text-gray-700">
                Our AI-powered travel recommendations are generated using the
                OpenAI API, which helps create personalized itineraries based on
                user preferences.
              </p>
              <div className="mt-4">
                <a
                  href="https://openai.com/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-600 font-medium text-sm"
                >
                  Documentation →
                </a>
              </div>
            </div>

            {/* API 3 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-gray-800">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Google Places API
                  </h3>
                  <p className="text-sm text-orange-400">Location Details</p>
                </div>
              </div>
              <p className="text-gray-700">
                We use the Google Places API to supplement our anime location
                database with real-world information on operating hours,
                reviews, and accessibility.
              </p>
              <div className="mt-4">
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-600 font-medium text-sm"
                >
                  Documentation →
                </a>
              </div>
            </div>

            {/* API 4 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Anitabi API
                  </h3>
                  <p className="text-sm text-orange-400">Anime Location Data</p>
                </div>
              </div>
              <p className="text-gray-700">
                We reference the Anitabi API for a comprehensive database of
                anime-related real-world locations, providing accurate mapping
                and reference data.
              </p>
              <div className="mt-4">
                <a
                  href="https://anitabi.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-600 font-medium text-sm"
                >
                  Website →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Open Source Libraries Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
          Open Source Libraries
        </h2>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-orange-400">
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              AniWay is built with the following open-source libraries and
              frameworks. We're grateful to the developers and communities who
              maintain these incredible tools:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Frontend
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">React 19</span>
                      <p className="text-sm text-gray-600">
                        JavaScript library for building user interfaces
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">Redux</span>
                      <p className="text-sm text-gray-600">
                        State management for JavaScript apps
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">React Router</span>
                      <p className="text-sm text-gray-600">
                        Declarative routing for React applications
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">Tailwind CSS</span>
                      <p className="text-sm text-gray-600">
                        Utility-first CSS framework
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">React Icons</span>
                      <p className="text-sm text-gray-600">
                        Icon library for React applications
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Backend
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">Node.js</span>
                      <p className="text-sm text-gray-600">
                        JavaScript runtime built on Chrome's V8 engine
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">Express.js</span>
                      <p className="text-sm text-gray-600">
                        Web application framework for Node.js
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">MongoDB</span>
                      <p className="text-sm text-gray-600">
                        NoSQL database for modern applications
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">Mongoose</span>
                      <p className="text-sm text-gray-600">
                        MongoDB object modeling for Node.js
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">JSON Web Token</span>
                      <p className="text-sm text-gray-600">
                        Authentication mechanism for web applications
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Resources */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
            Academic Resources
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-700 mb-6">
                This project was created as part of the COMPSCI 732 course at
                the University of Auckland. We are grateful for the academic
                resources and guidance provided by the teaching staff.
              </p>

              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Course Materials
                  </h3>
                  <p className="text-gray-700">
                    The course materials and lectures on web services, AI
                    integration, and project management provided the foundation
                    for our application development process.
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Research Papers
                  </h3>
                  <p className="text-gray-700">
                    Our approach to anime tourism was informed by academic
                    research on tourism, user experience design, and
                    recommendation systems.
                  </p>
                </div>

                <div className="border-l-4 border-gray-800 pl-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Faculty Support
                  </h3>
                  <p className="text-gray-700">
                    We would like to thank the faculty members of the Department
                    of Computer Science for their guidance and feedback
                    throughout the development process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Resources Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
          Image & Design Resources
        </h2>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Resource 1 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-t-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Unsplash</h3>
              <p className="text-sm text-orange-400 mb-4">
                Free High-Resolution Photos
              </p>
              <p className="text-gray-700 mb-4">
                Many of our background images and location photography are
                sourced from Unsplash's extensive library of free-to-use
                high-quality photographs.
              </p>
              <a
                href="https://unsplash.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-500 font-medium inline-flex items-center"
              >
                Visit Website
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            {/* Resource 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-t-4 border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Hero Icons
              </h3>
              <p className="text-sm text-orange-400 mb-4">
                Beautiful SVG Icons
              </p>
              <p className="text-gray-700 mb-4">
                The beautiful SVG icons used throughout our interface are
                provided by the Hero Icons library, created by the makers of
                Tailwind CSS.
              </p>
              <a
                href="https://heroicons.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-500 font-medium inline-flex items-center"
              >
                Visit Website
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Legal Notice
          </h2>

          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-400">
            <div className="text-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-green-500 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">
              AniWay is an academic project created for educational purposes as
              part of COMPSCI 732 at the University of Auckland. All product
              names, logos, and brands mentioned on this page are property of
              their respective owners.
            </p>
            <p className="text-gray-700 mb-4">
              This project is not affiliated with any of the referenced
              companies or products. All external resources are used according
              to their respective licenses and terms of service.
            </p>
            <p className="text-gray-700">
              If you believe any content on this page infringes on your
              intellectual property rights, please contact us, and we will take
              appropriate action.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Start Your Anime Adventure Today
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Begin planning your anime-inspired journey with AniWay and turn your
            favorite series into real-life adventures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-orange-400 text-white hover:bg-orange-500 font-bold py-3 px-8 rounded-lg transition-colors inline-block shadow-md hover:shadow-lg"
            >
              Explore AniWay
            </Link>
            <Link
              to="/about"
              className="bg-transparent border-2 border-green-500 hover:bg-green-500 hover:text-white font-bold py-3 px-8 rounded-lg transition-colors inline-block"
            >
              About Our Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferencePage;
