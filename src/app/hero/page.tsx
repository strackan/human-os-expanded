'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HeroPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null)
  const router = useRouter()

  // No DOM manipulation to avoid hydration issues

  const showMessage = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleLogin = () => {
    router.push('/signin')
  }

  const handleSeeDemo = () => {
    showMessage('Demo functionality coming soon!', 'info')
  }

  const handleLearnMore = () => {
    showMessage('Learn more content coming soon!', 'info')
  }

  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif',
      background: 'linear-gradient(135deg, #2D1B69 0%, #1A0D3A 100%)',
      width: '100vw',
      height: '100vh',
      color: 'white',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '2rem 0',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
            <span style={{ color: 'white' }}>Ren</span>
            <span style={{ color: '#00FF88' }}>ubu</span>
          </div>
          <button
            onClick={handleLogin}
            style={{
              background: 'rgba(45, 27, 105, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(45, 27, 105, 0.9)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(45, 27, 105, 0.8)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Log in
          </button>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', padding: '4rem 0 6rem', position: 'relative' }}>
          <h2 style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'white',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            Renubu Customer Expansion Intelligence
          </h2>
          <h1 style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '4rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '2rem',
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Resurrect Customer <span style={{ color: '#00FF88' }}>Growth</span> Without Killing Your Team
          </h1>
          <p style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 400,
            marginBottom: '4rem',
            opacity: 0.9,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Renewals drive <strong>83%</strong> of revenue. Why not make them <span style={{ fontWeight: 700, color: '#00FF88' }}>awesome</span>?
          </p>
        </section>

        {/* Content Section */}
        <section style={{ 
          background: 'rgba(45, 27, 105, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '3rem',
          margin: '4rem 0',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.125rem',
            lineHeight: 1.7,
            color: 'white',
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            Transform your renewal process from a spreadsheet nightmare into a strategic advantage. 
            Renubu provides the intelligence and automation your team needs to maximize customer expansion 
            without burning out your people. Get the insights you need at the right moment to extend 
            your window for new business while meeting expansion targets.
          </p>
        </section>

        {/* Call to Action Buttons */}
        <section style={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginTop: '4rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleSeeDemo}
            style={{
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              minWidth: '200px',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.5)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            See It In Action
          </button>
          <button
            onClick={handleLearnMore}
            style={{
              background: 'rgba(45, 27, 105, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              minWidth: '200px',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(45, 27, 105, 0.9)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(45, 27, 105, 0.8)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
            Learn More
          </button>
        </section>

        {/* Alternative Login Options */}
        <section style={{ textAlign: 'center', marginTop: '4rem' }}>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ width: '4rem', height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif'
            }}>Or</span>
            <div style={{ width: '4rem', height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
          </div>
          <a 
            href="/signin" 
            style={{ 
              color: '#00FF88',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.3s ease',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#00FF88'
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#00FF88'
              e.currentTarget.style.opacity = '1'
            }}
          >
            Use email and password instead
          </a>
        </section>

        {/* Messages */}
        {message && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            maxWidth: '400px',
            textAlign: 'center',
            ...(message.type === 'error' 
              ? { background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }
              : message.type === 'success'
              ? { background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#86efac' }
              : { background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd' })
          }}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
