'use client';

import { useState } from 'react';

interface LoginFormProps {
  showSignup: boolean;
  setShowSignup: (show: boolean) => void;
}

export default function LoginForm({ showSignup, setShowSignup }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    stayLoggedIn: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login attempt:', { email: formData.email, password: formData.password, stayLoggedIn: formData.stayLoggedIn });
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement signup logic
    console.log('Signup attempt:', formData);
  };

  return (
    <>
      {/* Login Form */}
      <div className={`row justify-content-center mt-4 ${showSignup ? 'hidden' : 'block'}`} id="login_section">
        <form id="login_form" onSubmit={handleLoginSubmit} className="max-w-xs mx-auto">
          <div className="form-group mb-3">
            <input
              type="email"
              name="email"
              className="form-control w-[350px] mx-auto px-3 py-2 my-[10px] mb-[6px] text-[14px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="email"
              aria-describedby="emailHelp"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <small id="emailHelp" className="form-text text-muted text-sm text-gray-600">
              We&rsquo;ll never share your email with anyone else.
            </small>
          </div>
          <div className="form-group input-group-md mb-3">
            <input
              type="password"
              name="password"
              className="form-control w-[350px] mx-auto px-3 py-2 my-[10px] mb-[6px] text-[14px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input mr-2"
              name="stayLoggedIn"
              id="stayLoggedIn"
              checked={formData.stayLoggedIn}
              onChange={handleInputChange}
            />
            <label className="form-check-label text-sm" htmlFor="stayLoggedIn">
              Stay Logged In
            </label>
          </div>
          <div className="form-group mb-3" style={{ paddingTop: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors mx-auto"
              name="submit"
            >
              Login
            </button>
          </div>

          <div className="form-group mb-3">
            <hr className="border-t border-gray-200 w-[100px] mx-auto opacity-70" />
          </div>
          <div className="form-group">
            <button
              type="button"
              className="nav-link text-center text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => setShowSignup(true)}
              id="signup_link"
            >
              New user? Sign up
            </button>
          </div>
        </form>
      </div>

      {/* Signup Form */}
      <div className={`row justify-content-center mt-4 ${showSignup ? 'block' : 'hidden'}`} id="signup_section">
        <form onSubmit={handleSignupSubmit} id="signup_form" className="max-w-xs mx-auto">
          <div className="form-group mb-3">
            <input
              type="email"
              name="email"
              className="form-control w-[350px] mx-auto px-3 py-2 my-[10px] mb-[6px] text-[14px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="email"
              aria-describedby="emailHelp"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <small id="emailHelp" className="form-text text-muted text-sm text-gray-600">
              We&rsquo;ll never share your email with anyone else.
            </small>
          </div>
          <div className="form-group input-group-md mb-3">
            <input
              type="password"
              name="password"
              className="form-control w-[350px] mx-auto px-3 py-2 my-[10px] mb-[6px] text-[14px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group input-group-md mb-3">
            <input
              type="password"
              name="password_confirm"
              className="form-control w-[350px] mx-auto px-3 py-2 my-[10px] mb-[6px] text-[14px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="password_confirm"
              placeholder="Confirm Your Password"
              value={formData.password_confirm}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input mr-2"
              id="stayLoggedIn"
              name="stayLoggedIn"
              checked={formData.stayLoggedIn}
              onChange={handleInputChange}
            />
            <label className="form-check-label text-sm" htmlFor="stayLoggedIn">
              Stay Logged In
            </label>
          </div>
          <div className="form-group mb-3" style={{ paddingTop: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors mx-auto"
              name="submit"
            >
              Sign Up
            </button>
          </div>

          <div className="form-group mb-3">
            <hr className="border-t border-gray-200 w-[100px] mx-auto opacity-70" />
          </div>
          <div className="form-group">
            <button
              type="button"
              className="nav-link text-center text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => setShowSignup(false)}
              id="login_link"
            >
              Existing User? Log In
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 