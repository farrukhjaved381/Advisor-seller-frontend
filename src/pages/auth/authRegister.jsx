import React from 'react'
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';


const Option = () => {
    const navigate = useNavigate();
    return (
        <div className="w-screen min-h-screen bg-white flex flex-col overflow-x-hidden">
            <Header />
            <div className='flex-grow w-full flex items-stretch'>
                <div id="left" className="w-[45%] bg-white h-screen">
                    <img src="src\assets\Option.png" alt="login-img" className="object-cover h-full w-full" />
                </div>
                <div id="right" className="w-[75%] flex justify-center items-center h-screen">
                    <div className=' w-[50%] h-[50%] flex flex-col justify-center items-center'>
                        <h1 className='text-5xl font-black'>Let's do some deals!</h1>
                        <p className='text-xl text-gray-600 font-medium text-center mt-[5%]'>Streamline your deal flow process with our platform. <br /> Connect with qualified buyers or find the perfect <br /> investment opportunity.</p>
                        <div className='w-[80%] h-[35%] mt-10 flex flex-col justify-between items-center'>

                            <button
                                onClick={() => navigate('/advisor-login')}
                                className="
        relative overflow-hidden border-2 border-primary text-primary
        px-6 py-5 font-semibold rounded-lg
        transition-colors duration-300 w-full text-xl
        group
    "
                            >
                                <span className="relative z-10 group-hover:text-white">Advisor Register</span>
                                <span
                                    className="
            absolute left-0 top-0 h-full w-0 bg-primary
            transition-all duration-300 ease-in-out
            group-hover:w-full z-0
        "
                                ></span>
                            </button>

                            <button
                            onClick={() => navigate('/auth')}
                                className="
    relative overflow-hidden border-2 border-primary text-primary
    px-6 py-5 font-semibold rounded-lg
    transition-colors duration-300 w-full text-xl
    group
  "
                            >
                                <span className="relative z-10 group-hover:text-white">Seller Register</span>
                                <span
                                    className="
      absolute left-0 top-0 h-full w-0 bg-primary
      transition-all duration-300 ease-in-out
      group-hover:w-full z-0
    "
                                ></span>
                            </button>
                        </div>


                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Option