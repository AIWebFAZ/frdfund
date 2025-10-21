import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

export default function ChangePassword() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }

    if (newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }

    if (currentPassword === newPassword) {
      setError('รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post(`${config.API_URL}/api/auth/change-password`, {
        username: user.username,
        currentPassword,
        newPassword
      })

      if (res.data.success) {
        alert('เปลี่ยนรหัสผ่านสำเร็จ กรุณา login ใหม่')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="content-container">
        <div className="page-header">
          <div>
            <h1>เปลี่ยนรหัสผ่าน</h1>
            <p style={{color: 'var(--muted)', marginTop: '8px'}}>
              เปลี่ยนรหัสผ่านสำหรับบัญชี: <strong>{user.username}</strong>
            </p>
          </div>
        </div>

        <div className="card" style={{maxWidth: '500px', margin: '0 auto'}}>
          {error && (
            <div className="error-message" style={{marginBottom: '20px'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>รหัสผ่านปัจจุบัน *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>รหัสผ่านใหม่ *</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                disabled={loading}
              />
              <small style={{color: 'var(--muted)', fontSize: '12px', display: 'block', marginTop: '5px'}}>
                รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
              </small>
            </div>

            <div className="form-group">
              <label>ยืนยันรหัสผ่านใหม่ *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                disabled={loading}
              />
            </div>

            <div style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
              <button 
                type="submit" 
                className="btn primary" 
                disabled={loading}
                style={{flex: 1}}
              >
                {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
              <button 
                type="button"
                className="btn secondary"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                style={{flex: 1}}
              >
                ยกเลิก
              </button>
            </div>
          </form>

          <div className="alert alert-warning" style={{marginTop: '30px'}}>
            <strong>⚠️ คำเตือน:</strong>
            <ul style={{marginTop: '10px', paddingLeft: '20px'}}>
              <li>หลังจากเปลี่ยนรหัสผ่าน คุณจะต้อง login ใหม่</li>
              <li>กรุณาจดจำรหัสผ่านใหม่ของคุณ</li>
              <li>ห้ามใช้รหัสผ่านเดิมซ้ำ</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
