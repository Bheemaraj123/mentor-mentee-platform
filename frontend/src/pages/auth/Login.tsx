import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

function LogoMark() {
  return (
    <div className="logo-mark" aria-label="Men.AI">
      <span className="logo-orbit logo-orbit-one" />
      <span className="logo-orbit logo-orbit-two" />
      <span className="logo-dot" />
    </div>
  );
}

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'mentor' | 'mentee'>('mentor');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, role);
      if (role === 'mentor') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/mentee/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (type: 'mentor' | 'mentee') => {
    if (type === 'mentor') {
      setEmail('mentor.demo@example.com');
      setPassword('Mentor@123');
      setRole('mentor');
    } else {
      setEmail('mentee.demo@example.com');
      setPassword('Mentee@123');
      setRole('mentee');
    }
  };

  return (
    <div className="menai-shell" style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fb', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="surface-card" style={{ width: '100%', maxWidth: '440px', padding: '36px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.05)' }}>

        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', textAlign: 'center' }}>
          <div className="brand-lockup" style={{ marginBottom: '12px' }}>
            <LogoMark />
            <span style={{ fontSize: '24px' }}>Men<span className="brand-dot">.</span>AI</span>
          </div>
          <p className="eyebrow" style={{ margin: 0 }}>Welcome back</p>
          <h2 style={{ fontSize: '20px', color: '#15233e', fontWeight: 600, marginTop: '4px' }}>Sign in to your practice</h2>
        </div>

        {/* Demo Credentials Quick-Fill */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShieldCheck size={14} className="text-primary" /> Demo Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('mentor')}
              className="outline-button"
              style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center', height: 'auto', background: 'white' }}
            >
              Fill Mentor Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('mentee')}
              className="outline-button"
              style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center', height: 'auto', background: 'white' }}
            >
              Fill Mentee Demo
            </button>
          </div>
        </div>

        {error && (
          <div className="pill pill-high" style={{ width: '100%', marginBottom: '20px', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Role selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64758d', display: 'block', marginBottom: '8px' }}>Account Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f1f5f9', padding: '3px', borderRadius: '9px' }}>
              <button
                type="button"
                onClick={() => setRole('mentor')}
                style={{
                  padding: '8px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: role === 'mentor' ? 'white' : 'transparent',
                  color: role === 'mentor' ? '#2f6bff' : '#64758d',
                  boxShadow: role === 'mentor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Mentor
              </button>
              <button
                type="button"
                onClick={() => setRole('mentee')}
                style={{
                  padding: '8px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: role === 'mentee' ? 'white' : 'transparent',
                  color: role === 'mentee' ? '#2f6bff' : '#64758d',
                  boxShadow: role === 'mentee' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Mentee
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="email" style={{ fontSize: '12px', fontWeight: 600, color: '#64758d', display: 'block', marginBottom: '6px' }}>Email address</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${validationErrors.email ? '#e11d48' : '#dfe7f0'}`,
                borderRadius: '9px',
                fontSize: '13px',
                outline: 'none',
                background: 'white'
              }}
            />
            {validationErrors.email && (
              <p style={{ color: '#e11d48', fontSize: '11px', marginTop: '4px', margin: 0 }}>{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" style={{ fontSize: '12px', fontWeight: 600, color: '#64758d', display: 'block', marginBottom: '6px' }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${validationErrors.password ? '#e11d48' : '#dfe7f0'}`,
                borderRadius: '9px',
                fontSize: '13px',
                outline: 'none',
                background: 'white'
              }}
            />
            {validationErrors.password && (
              <p style={{ color: '#e11d48', fontSize: '11px', marginTop: '4px', margin: 0 }}>{validationErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="primary-button"
            style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '6px', borderRadius: '9px' }}
          >
            {isLoading ? 'Signing in...' : (
              <>
                Sign in <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#64758d', marginTop: '24px', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2f6bff', fontWeight: 600, textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};