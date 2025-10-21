import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import config from '../config'

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'staff',
    province: '',
    is_active: true
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    // Check if admin
    if (user.role !== 'admin') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${config.API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data.data)
    } catch (error) {
      console.error('Fetch users error:', error)
      if (error.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditUser(null)
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: 'staff',
      province: '',
      is_active: true
    })
    setShowModal(true)
  }

  function openEditModal(user) {
    setEditUser(user)
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      email: user.email || '',
      role: user.role,
      province: user.province || '',
      is_active: user.is_active
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      if (editUser) {
        // Update
        const updateData = { ...formData }
        delete updateData.username
        delete updateData.password // Don't update password in edit
        
        await axios.put(`${config.API_URL}/api/users/${editUser.id}`, updateData, config)
        alert('แก้ไขผู้ใช้สำเร็จ')
      } else {
        // Create
        if (!formData.password || formData.password.length < 6) {
          alert('กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษร')
          return
        }
        await axios.post(`${config.API_URL}/api/users`, formData, config)
        alert('สร้างผู้ใช้สำเร็จ')
      }

      setShowModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Submit error:', error)
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message))
    }
  }

  async function handleDelete(userId) {
    if (!confirm('ยืนยันการลบผู้ใช้?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${config.API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('ลบผู้ใช้สำเร็จ')
      fetchUsers()
    } catch (error) {
      console.error('Delete error:', error)
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message))
    }
  }

  function getRoleName(role) {
    const roleMap = {
      admin: 'ผู้ดูแลระบบ',
      staff: 'เจ้าหน้าที่',
      provincial_director: 'ผู้อำนวยการจังหวัด',
      secretary_general: 'เลขาธิการ',
      board: 'คณะกรรมการ'
    }
    return roleMap[role] || role
  }

  if (loading) {
    return <Layout><div className="loading">กำลังโหลด...</div></Layout>
  }

  return (
    <Layout>
      <div className="content-container">
        <div className="page-header">
          <h1>จัดการผู้ใช้งาน</h1>
          <button className="btn primary" onClick={openCreateModal}>
            + เพิ่มผู้ใช้
          </button>
        </div>

        <div className="section">
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', minWidth: 'auto'}}>
              <thead>
                <tr>
                  <th style={{width: '10%'}}>Username</th>
                  <th style={{width: '18%'}}>ชื่อ-นามสกุล</th>
                  <th style={{width: '20%'}}>Email</th>
                  <th style={{width: '12%'}}>บทบาท</th>
                  <th style={{width: '12%'}}>จังหวัด</th>
                  <th style={{width: '8%'}}>สถานะ</th>
                  <th style={{width: '10%'}}>วันที่สร้าง</th>
                  <th style={{width: '10%', textAlign: 'center'}}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{fontSize: '13px'}}>{user.username}</td>
                    <td style={{fontSize: '13px'}}>{user.full_name}</td>
                    <td style={{fontSize: '12px', wordBreak: 'break-all'}}>{user.email}</td>
                    <td style={{fontSize: '13px'}}>{getRoleName(user.role)}</td>
                    <td style={{fontSize: '13px'}}>{user.province || '-'}</td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'status-approved' : 'status-draft'}`} style={{fontSize: '11px', padding: '4px 8px'}}>
                        {user.is_active ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </td>
                    <td style={{fontSize: '12px'}}>{new Date(user.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={{textAlign: 'center'}}>
                      <button className="btn-icon" onClick={() => openEditModal(user)} title="แก้ไข">✏️</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(user.id)} title="ลบ">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>{editUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Username <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    disabled={!!editUser}
                    required
                  />
                </div>

                {!editUser && (
                  <div className="form-group">
                    <label>Password <span className="required">*</span></label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>ชื่อ-นามสกุล <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>บทบาท <span className="required">*</span></label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="staff">เจ้าหน้าที่</option>
                    <option value="provincial_director">ผู้อำนวยการจังหวัด</option>
                    <option value="secretary_general">เลขาธิการ</option>
                    <option value="board">คณะกรรมการ</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>จังหวัด</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    placeholder="ระบุจังหวัด (สำหรับผู้อำนวยการจังหวัด)"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    {' '}เปิดใช้งาน
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn primary">
                    {editUser ? 'บันทึก' : 'สร้าง'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
