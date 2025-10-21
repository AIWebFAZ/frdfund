import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Enter username, 2: Enter OTP, 3: New password
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp] = useState('') // For development

  async function handleRequestOTP(e) {
    e.preventDefault()
    setError('')

    if (!username || !phone) {
      setError('กรุณากรอก Username และเบอร์โทรศัพท์')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post(`${config.API_URL}/api/auth/forgot-password`, {
        username,
        phone
      })

      if (res.data.success) {
        alert('ส่ง OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว')
        // Show OTP in dev mode
        if (res.data.otp) {
          setDevOtp(res.data.otp)
        }
        setStep(2)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')

    if (!otp) {
      setError('กรุณากรอก OTP')
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('กรุณากรอกรหัสผ่านใหม่')
      return
    }

    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post(`${config.API_URL}/api/auth/reset-password`, {
        username,
        otp,
        newPassword
      })

      if (res.data.success) {
        alert('รีเซ็ตรหัสผ่านสำเร็จ')
        navigate('/login')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="login-card">
        <div className="brand">
          <img src="/logo.png" alt="Logo" />
        </div>
        
        <h2>ลืมรหัสผ่าน</h2>
        <p className="subtitle">รีเซ็ตรหัสผ่านด้วย OTP ผ่าน SMS</p>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Enter Username and Phone */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="กรอก username ของคุณ"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0812345678"
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn primary" disabled={loading} style={{width: '100%'}}>
              {loading ? 'กำลังส่ง OTP...' : 'ส่ง OTP'}
            </button>

            <div style={{textAlign: 'center', marginTop: '15px'}}>
              <button 
                type="button"
                className="btn secondary"
                onClick={() => navigate('/login')}
                style={{width: '100%'}}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Enter OTP and New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="login-form">
            {devOtp && (
              <div style={{
                padding: '10px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <strong>🔐 OTP (Dev Mode):</strong> {devOtp}
              </div>
            )}

            <div className="form-group">
              <label>OTP (6 หลัก)</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength="6"
                disabled={loading}
                style={{fontSize: '20px', textAlign: 'center', letterSpacing: '5px'}}
              />
              <small style={{color: 'var(--muted)', fontSize: '12px', display: 'block', marginTop: '5px'}}>
                OTP จะหมดอายุภายใน 5 นาที
              </small>
            </div>

            <div className="form-group">
              <label>รหัสผ่านใหม่</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn primary" disabled={loading} style={{width: '100%'}}>
              {loading ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
            </button>

            <div style={{textAlign: 'center', marginTop: '15px'}}>
              <button 
                type="button"
                className="btn secondary"
                onClick={() => {
                  setStep(1)
                  setOtp('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setDevOtp('')
                  setError('')
                }}
                style={{width: '100%'}}
                disabled={loading}
              >
                ส่ง OTP ใหม่
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
