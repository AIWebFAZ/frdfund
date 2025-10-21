import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

export default function UserRoles() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userRoles, setUserRoles] = useState([])
  const [showAddRole, setShowAddRole] = useState(false)
  const [newRole, setNewRole] = useState({
    role: '',
    province: ''
  })

  const roleOptions = [
    { value: 'admin', label: 'ผู้ดูแลระบบ', needProvince: false },
    { value: 'staff', label: 'เจ้าหน้าที่', needProvince: false },
    { value: 'provincial_director', label: 'ผู้อำนวยการจังหวัด', needProvince: true },
    { value: 'secretary_general', label: 'เลขาธิการ', needProvince: false },
    { value: 'board', label: 'คณะกรรมการบริหาร', needProvince: false }
  ]

  const provinces = [
    'กรุงเทพมหานคร', 'เชียงใหม่', 'เชียงราย', 'ขอนแก่น', 'อุบลราชธานี', 
    'นครราชสีมา', 'สุราษฎร์ธานี', 'ภูเก็ต', 'สงขลา', 'นครศรีธรรมราช'
  ]

  useEffect(() => {
    if (user.role !== 'admin' && !user.roles?.includes('admin')) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${config.API_URL}/api/user-roles/all-with-roles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data.data || [])
    } catch (error) {
      console.error('Fetch users error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function openRoleModal(userId) {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${config.API_URL}/api/user-roles/${userId}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userFound = users.find(u => u.id === userId)
      setSelectedUser(userFound)
      setUserRoles(res.data.data || [])
      setShowAddRole(false)
      setNewRole({ role: '', province: '' })
    } catch (error) {
      console.error('Fetch user roles error:', error)
    }
  }

  async function handleAddRole() {
    if (!newRole.role) {
      alert('กรุณาเลือก Role')
      return
    }

    const roleOption = roleOptions.find(r => r.value === newRole.role)
    if (roleOption?.needProvince && !newRole.province) {
      alert('กรุณาเลือกจังหวัด')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${config.API_URL}/api/user-roles/${selectedUser.id}/roles`,
        {
          role: newRole.role,
          province: roleOption?.needProvince ? newRole.province : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert('เพิ่ม Role สำเร็จ')
      openRoleModal(selectedUser.id)
      fetchUsers()
    } catch (error) {
      console.error('Add role error:', error)
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message))
    }
  }

  async function handleToggleRole(roleId, currentStatus) {
    if (!confirm(`ยืนยันการ${currentStatus ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} Role นี้?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${config.API_URL}/api/user-roles/${selectedUser.id}/roles/${roleId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert(`${currentStatus ? 'ปิด' : 'เปิด'}ใช้งาน Role สำเร็จ`)
      openRoleModal(selectedUser.id)
      fetchUsers()
    } catch (error) {
      console.error('Toggle role error:', error)
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message))
    }
  }

  async function handleDeleteRole(roleId) {
    if (!confirm('ยืนยันการลบ Role นี้? (ผู้ใช้ต้องมี Role อย่างน้อย 1 Role)')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `${config.API_URL}/api/user-roles/${selectedUser.id}/roles/${roleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert('ลบ Role สำเร็จ')
      openRoleModal(selectedUser.id)
      fetchUsers()
    } catch (error) {
      console.error('Delete role error:', error)
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message))
    }
  }

  function getRoleLabel(role) {
    return roleOptions.find(r => r.value === role)?.label || role
  }

  if (loading) {
    return (
      <Layout>
        <div className="content-container">
          <div className="loading">กำลังโหลดข้อมูล...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="content-container">
        {/* Header Card */}
        <div className="card" style={{marginBottom: '24px'}}>
          <h1>จัดการ Roles ของผู้ใช้</h1>
          <p style={{color: 'var(--muted)', marginTop: '8px'}}>
            กำหนดสิทธิ์การใช้งาน (1 user สามารถมีได้หลาย roles)
          </p>
        </div>

        {/* Users Table Card */}
        <div className="card" style={{padding: 0}}>
          <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>ชื่อ-นามสกุล</th>
                <th>Email</th>
                <th>Roles</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.full_name}</td>
                  <td>{u.email || '-'}</td>
                  <td>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r, idx) => (
                          <span 
                            key={idx} 
                            className={`badge ${r.is_active ? 'success' : 'secondary'}`}
                            style={{fontSize: '11px'}}
                          >
                            {getRoleLabel(r.role)}
                            {r.province && ` (${r.province})`}
                          </span>
                        ))
                      ) : (
                        <span className="badge danger">ไม่มี Role</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="badge success">ใช้งาน</span>
                    ) : (
                      <span className="badge secondary">ปิดใช้งาน</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm"
                      onClick={() => openRoleModal(u.id)}
                    >
                      จัดการ Roles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Role Management Modal */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>จัดการ Roles: {selectedUser.full_name}</h2>
                <button 
                  className="modal-close"
                  onClick={() => setSelectedUser(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div style={{marginBottom: '20px'}}>
                  <p><strong>Username:</strong> {selectedUser.username}</p>
                  <p><strong>Email:</strong> {selectedUser.email || '-'}</p>
                </div>

                <h3 style={{marginBottom: '15px', color: 'var(--accent)'}}>Roles ปัจจุบัน</h3>
                
                {userRoles.length === 0 ? (
                  <div className="alert alert-warning" style={{marginBottom: '20px'}}>
                    ผู้ใช้นี้ยังไม่มี Role กรุณาเพิ่ม Role อย่างน้อย 1 Role
                  </div>
                ) : (
                  <div className="data-table" style={{marginBottom: '20px'}}>
                    <table>
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>จังหวัด</th>
                          <th>สถานะ</th>
                          <th>การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userRoles.map(role => (
                          <tr key={role.id}>
                            <td><strong>{getRoleLabel(role.role)}</strong></td>
                            <td>{role.province || '-'}</td>
                            <td>
                              {role.is_active ? (
                                <span className="badge success">ใช้งาน</span>
                              ) : (
                                <span className="badge secondary">ปิดใช้งาน</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm secondary"
                                onClick={() => handleToggleRole(role.id, role.is_active)}
                                style={{marginRight: '5px'}}
                              >
                                {role.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                              </button>
                              <button 
                                className="btn btn-sm danger"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                ลบ
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!showAddRole ? (
                  <button 
                    className="btn success"
                    onClick={() => setShowAddRole(true)}
                  >
                    + เพิ่ม Role ใหม่
                  </button>
                ) : (
                  <div className="card" style={{background: 'var(--bg)', padding: '20px'}}>
                    <h4 style={{marginBottom: '15px'}}>เพิ่ม Role ใหม่</h4>
                    <div className="form-group">
                      <label>เลือก Role</label>
                      <select 
                        value={newRole.role}
                        onChange={e => setNewRole({...newRole, role: e.target.value, province: ''})}
                      >
                        <option value="">-- เลือก Role --</option>
                        {roleOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {newRole.role && roleOptions.find(r => r.value === newRole.role)?.needProvince && (
                      <div className="form-group">
                        <label>จังหวัด</label>
                        <select 
                          value={newRole.province}
                          onChange={e => setNewRole({...newRole, province: e.target.value})}
                        >
                          <option value="">-- เลือกจังหวัด --</option>
                          {provinces.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                      <button className="btn success" onClick={handleAddRole}>
                        บันทึก
                      </button>
                      <button 
                        className="btn secondary" 
                        onClick={() => {
                          setShowAddRole(false)
                          setNewRole({ role: '', province: '' })
                        }}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
