import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config'

export default function Login(){
  const navigate = useNavigate()
  const [authType, setAuthType] = useState('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e){
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${config.API_URL}/api/auth/login`, {
        username,
        password,
        authType
      })

      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="login-card">
        <div className="brand">
          <img src="/logo.png" alt="logo" />
        </div>

        <div className="tabs">
          <button 
            className={authType === 'thaiid' ? 'tab active' : 'tab'}
            onClick={() => setAuthType('thaiid')}
          >
            ThaiID
          </button>
          <button 
            className={authType === 'ldap' ? 'tab active' : 'tab'}
            onClick={() => setAuthType('ldap')}
          >
            LDAP
          </button>
          <button 
            className={authType === 'password' ? 'tab active' : 'tab'}
            onClick={() => setAuthType('password')}
          >
            User/Password
          </button>
        </div>

        <h2>Log in</h2>
        <p className="subtitle">ระบบผู้ใช้/รหัสผ่าน</p>

        {error && <div className="error-message">{error}</div>}

        {authType === 'password' ? (
          <form onSubmit={onSubmit} className="login-form">
            <label>ชื่อผู้ใช้
              <input 
                value={username} 
                onChange={e=>setUsername(e.target.value)} 
                placeholder="ชื่อผู้ใช้" 
                required
              />
            </label>
            <label>รหัสผ่าน
              <input 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="รหัสผ่าน"
                required
              />
            </label>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
            
            <div style={{textAlign: 'center', marginTop: '15px'}}>
              <button 
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
          </form>
        ) : (
          <div className="not-implemented">
            <p>🚧 ระบบ {authType === 'thaiid' ? 'ThaiID' : 'LDAP'} อยู่ระหว่างพัฒนา</p>
            <p>กรุณาใช้ User/Password ในการเข้าสู่ระบบ</p>
          </div>
        )}

        <div className="demo-accounts">
          <p><strong>บัญชีทดสอบ:</strong></p>
          <small>
            admin/admin123 (ผู้ดูแล) | staff01/staff123 (เจ้าหน้าที่) | 
            pd_bangkok/pd123 (ผอ.จังหวัด)
          </small>
        </div>
      </div>
    </div>
  )
}
