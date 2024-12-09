/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import login from '../assets/login.png';
import { BASE_URL } from './constants';

function Login({ setIsAuthenticated }) {
    const [formData, setFormData] = useState({ email: '', otp: '' });
    const [step, setStep] = useState('login');
    const [redirect, setRedirect] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const validateForm = () => {
        let isValid = true;
        if (!formData.email) {
            toast.error("Email is required");
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error("Invalid email address");
            isValid = false;
        }
        return isValid;
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const endpoint = `${BASE_URL}login`;
                const response = await axios.post(endpoint, { email: formData.email });

                console.log(response)
                if (response.status === 200) {

                    // sessionStorage.setItem('token', response.data.token);
                    toast.success('OTP sent to your email!');
                    setStep('otp');

                } else {
                    console.log(response.status)
                    throw new Error('Failed to send OTP');

                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Something went wrong');
                console.log(error)
            }
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = `${BASE_URL}verify-otp`;
            const response = await axios.post(endpoint, { email: formData.email, otp: formData.otp });
            if (response.status !== 200) throw new Error("Failed to verify OTP");

            toast.success('Login successful!');
            setFormData({ email: '', otp: '' });
            sessionStorage.setItem("token", response.data.token);
            setIsAuthenticated(true);
            setRedirect(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    };

    if (redirect) {
        return <Navigate to="/update-result" />;
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[url('./assets/06ded2be-68c1-4023-ab8c-0783ccfb952c.jpg')] bg-cover bg-center bg-opacity-10">
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-0">
                <img
                    src={login}
                    alt="loginImg"
                    className="w-full md:w-3/4 lg:w-2/3 hidden lg:block rounded-xl mb-10 sm:mb-2"
                />
            </div>
            <div className="flex-1 flex items-center justify-center p-4 lg:p-0 sm:pt-2">
                <div className="w-full max-w-md">
                    <div className="flex flex-col md:flex-row items-center justify-center mb-8 space-y-4 md:space-y-0">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center md:text-left font-mono">Login</h2>
                    </div>
                    <div className="bg-transparent backdrop-blur-[40px] rounded-2xl shadow-2xl p-8">
                        <h3 className="text-2xl font-bold text-center mb-8 text-gray-800 font-mono ">
                            Welcome
                        </h3>
                        {step === 'login' ? (
                            <form onSubmit={handleLoginSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="text-md text-gray-900 block mb-2 font-mono font-bold">Email</label>
                                    <input
                                        type="text"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="bg-transparent backdrop-blur-[40px] w-full px-4 py-3 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out font-mono"
                                        placeholder="Enter your email"
                                        autoComplete="username"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-md hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out font-bold font-mono"
                                >
                                    Send OTP
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="otp" className="text-md font-bold text-gray-900 block mb-2 font-mono">OTP</label>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        className="bg-transparent backdrop-blur-[40px] w-full px-4 py-3 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out font-mono"
                                        placeholder="Enter the OTP sent to your email"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-md hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out font-bold font-mono"
                                >
                                    Verify OTP
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;