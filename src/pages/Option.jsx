import React from 'react'
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header.jsx'
import Footer from '../components/common/Footer.jsx'

const Option = () => {
    const navigate = useNavigate();
    
    return (
        <div className="w-screen min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col overflow-x-hidden">
             <Header />
            {/* Main Content */}
            <div className='flex-grow w-full flex flex-col lg:flex-row items-stretch pt-20'>
                {/* Left Side - Image */}
                <div className="w-full lg:w-[45%] h-64 sm:h-80 md:h-96 lg:h-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-third/30 z-10"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80" 
                        alt="Professional business meeting" 
                        className="object-cover h-full w-full transform hover:scale-105 transition-transform duration-700" 
                    />
                    
                    {/* Floating Elements */}
                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
                                <span className="text-secondary font-semibold text-xs sm:text-sm">Live Matches</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 z-20">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl">
                            <div className="text-secondary font-bold text-xl sm:text-2xl">500+</div>
                            <div className="text-gray-600 text-xs sm:text-sm">Active Advisors</div>
                        </div>
                    </div>
                </div>
                
                {/* Right Side - Content */}
                <div className="w-full lg:w-[55%] flex justify-center items-center min-h-[calc(100vh-5rem)] lg:min-h-screen bg-gradient-to-bl from-white to-gray-50/50 relative px-4 py-8 lg:py-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-20 h-20 sm:w-32 sm:h-32 bg-primary rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 right-10 sm:bottom-32 sm:right-20 w-32 h-32 sm:w-48 sm:h-48 bg-third rounded-full blur-3xl"></div>
                    </div>
                    
                    <div className='w-full max-w-sm sm:max-w-md flex flex-col justify-center items-center relative z-10'>
                        {/* Main Heading */}
                        <div className="text-center mb-6 sm:mb-8 animate-fadeIn">
                            <div className="inline-flex items-center bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                                Welcome to the Platform
                            </div>
                            
                            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-black text-secondary mb-3 sm:mb-4 leading-tight px-2'>
                                Connect with 
                                <span className="bg-gradient-to-r from-primary to-third bg-clip-text text-transparent">&nbsp;Expert Advisors</span>
                            </h1>
                            
                            <p className='text-base sm:text-lg text-gray-600 font-medium text-center leading-relaxed px-2'>
                                Seamlessly match businesses with qualified advisors.
                                <br className="hidden sm:block" /> 
                                Get professional guidance or showcase your expertise
                                <br className="hidden sm:block" /> 
                                in our trusted marketplace.
                            </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className='w-full space-y-3 sm:space-y-4 animate-fadeIn px-2'>
                            <button
                                onClick={() => navigate('/advisor-login')}
                                className="
                                    group relative w-full overflow-hidden
                                    bg-gradient-to-r from-primary to-third
                                    text-white font-semibold text-base sm:text-lg
                                    px-6 sm:px-8 py-3 sm:py-4 rounded-xl
                                    transform hover:scale-105 hover:shadow-2xl
                                    transition-all duration-300 ease-out
                                    border-0
                                "
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-third to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Advisor Login</span>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/seller-login')}
                                className="
                                    group relative w-full overflow-hidden
                                    bg-white border-2 border-primary
                                    text-primary font-semibold text-base sm:text-lg
                                    px-6 sm:px-8 py-3 sm:py-4 rounded-xl
                                    transform hover:scale-105 hover:shadow-2xl
                                    transition-all duration-300 ease-out
                                "
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-third opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center justify-center space-x-2 group-hover:text-white transition-colors duration-300">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>Get Matched</span>
                                </div>
                            </button>
                        </div>
                        
                        {/* Stats Section */}
                        {/* <div className="w-full mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                                <div className="p-2 sm:p-3">
                                    <div className="text-lg sm:text-2xl font-bold text-primary">500+</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Active Advisors</div>
                                </div>
                                <div className="p-2 sm:p-3">
                                    <div className="text-lg sm:text-2xl font-bold text-third">$50M+</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Business Volume</div>
                                </div>
                                <div className="p-2 sm:p-3">
                                    <div className="text-lg sm:text-2xl font-bold text-secondary">98%</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Match Success</div>
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        
        </div>
    )
}

export default Option