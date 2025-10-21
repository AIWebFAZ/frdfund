import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import Layout from '../components/Layout'

export default function AuditLogs() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    table_name: '',
    username: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (user.role !== 'admin') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
      navigate('/dashboard')
      return
    }
    fetchLogs()
  }, [currentPage])

  async function fetchLogs() {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      })

      const res = await axios.get(`${config.API_URL}/api/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setLogs(res.data.data || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (error) {
      console.error('Fetch logs error:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  function handleSearch() {
    setCurrentPage(1)
    fetchLogs()
  }

  function handleReset() {
    setFilters({
      action: '',
      table_name: '',
      username: '',
      startDate: '',
      endDate: ''
    })
    setCurrentPage(1)
    setTimeout(() => fetchLogs(), 100)
  }

  function getActionBadge(action) {
    const actionMap = {
      'LOGIN': { label: 'เข้าสู่ระบบ', class: 'info' },
      'CREATE': { label: 'สร้าง', class: 'success' },
      'UPDATE': { label: 'แก้ไข', class: 'warning' },
      'DELETE': { label: 'ลบ', class: 'danger' },
      'APPROVE': { label: 'อนุมัติ', class: 'success' },
      'REJECT': { label: 'ไม่อนุมัติ', class: 'danger' }
    }
    const badge = actionMap[action] || { label: action, class: 'secondary' }
    return <span className={`badge ${badge.class}`}>{badge.label}</span>
  }

  function getTableLabel(tableName) {
    const tableMap = {
      'users': 'ผู้ใช้',
      'projects': 'โครงการ',
      'project_members': 'คณะทำงาน',
      'project_budget_items': 'งบประมาณ',
      'project_plans': 'แผนการดำเนินงาน',
      'project_documents': 'เอกสาร',
      'project_approvals': 'การอนุมัติ',
      'farmer_groups': 'กลุ่มเกษตรกร',
      'farmer_members': 'สมาชิกเกษตรกร',
      'user_roles': 'บทบาทผู้ใช้'
    }
    return tableMap[tableName] || tableName
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
          <h1>บันทึกการใช้งานระบบ (Audit Logs)</h1>
          <p style={{color: 'var(--muted)', marginTop: '8px'}}>
            ประวัติการใช้งานระบบทั้งหมด ({logs.length} รายการ)
          </p>
        </div>

        {/* Filters Card */}
        <div className="card" style={{marginBottom: '20px'}}>
          <div style={{padding: '0'}}>
            <h3 style={{marginBottom: '15px', color: 'var(--accent)'}}>ค้นหาและกรอง</h3>
            <div className="form-row">
            <div className="form-group">
              <label>การกระทำ</label>
              <select name="action" value={filters.action} onChange={handleFilterChange}>
                <option value="">ทั้งหมด</option>
                <option value="LOGIN">เข้าสู่ระบบ</option>
                <option value="CREATE">สร้าง</option>
                <option value="UPDATE">แก้ไข</option>
                <option value="DELETE">ลบ</option>
                <option value="APPROVE">อนุมัติ</option>
                <option value="REJECT">ไม่อนุมัติ</option>
              </select>
            </div>
            <div className="form-group">
              <label>ตาราง</label>
              <select name="table_name" value={filters.table_name} onChange={handleFilterChange}>
                <option value="">ทั้งหมด</option>
                <option value="users">ผู้ใช้</option>
                <option value="projects">โครงการ</option>
                <option value="project_approvals">การอนุมัติ</option>
              </select>
            </div>
            <div className="form-group">
              <label>ผู้ใช้</label>
              <input 
                type="text" 
                name="username" 
                value={filters.username}
                onChange={handleFilterChange}
                placeholder="ค้นหาจาก username"
              />
            </div>
            <div className="form-group">
              <label>วันที่เริ่มต้น</label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label>วันที่สิ้นสุด</label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
            <button className="btn primary" onClick={handleSearch}>
              🔍 ค้นหา
            </button>
            <button className="btn secondary" onClick={handleReset}>
              รีเซ็ต
            </button>
          </div>
          </div>
        </div>

        {/* Logs Table Card */}
        <div className="card" style={{padding: 0}}>
          {logs.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px 20px'}}>
              <div style={{fontSize: '48px', marginBottom: '20px'}}>📋</div>
              <h3 style={{color: 'var(--muted)', marginBottom: '10px'}}>ไม่พบบันทึก</h3>
              <p style={{color: 'var(--muted)'}}>ไม่มีบันทึกการใช้งานที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>วันที่-เวลา</th>
                    <th>ผู้ใช้</th>
                    <th>การกระทำ</th>
                    <th>ตาราง</th>
                    <th>Record ID</th>
                    <th>รายละเอียด</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{fontSize: '12px'}}>
                        {new Date(log.created_at).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td>
                        <strong>{log.username}</strong>
                        <div style={{fontSize: '11px', color: 'var(--muted)'}}>
                          ID: {log.user_id}
                        </div>
                      </td>
                      <td>
                        {getActionBadge(log.action)}
                      </td>
                      <td>{getTableLabel(log.table_name)}</td>
                      <td style={{textAlign: 'center'}}>
                        {log.record_id || '-'}
                      </td>
                      <td>
                        {log.new_values && (
                          <div style={{fontSize: '12px'}}>
                            {log.action === 'CREATE' && (
                              <span style={{color: 'var(--success)'}}>
                                สร้างรายการใหม่
                              </span>
                            )}
                            {log.action === 'UPDATE' && (
                              <span style={{color: 'var(--warning)'}}>
                                แก้ไขข้อมูล
                                {log.new_values.new_status && ` → ${log.new_values.new_status}`}
                              </span>
                            )}
                            {log.action === 'DELETE' && (
                              <span style={{color: 'var(--danger)'}}>
                                ลบรายการ
                              </span>
                            )}
                            {log.action === 'APPROVE' && (
                              <span style={{color: 'var(--success)'}}>
                                อนุมัติ → {log.new_values.new_status}
                              </span>
                            )}
                            {log.action === 'REJECT' && (
                              <span style={{color: 'var(--danger)'}}>
                                ไม่อนุมัติ
                              </span>
                            )}
                            {log.action === 'LOGIN' && (
                              <span style={{color: 'var(--info)'}}>
                                เข้าสู่ระบบ
                                {log.new_values.authType && ` (${log.new_values.authType})`}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{fontSize: '12px', color: 'var(--muted)'}}>
                        <div>{log.ip_address || '-'}</div>
                        <div style={{marginTop: '5px'}}>
                          <button 
                            className="btn secondary" 
                            style={{padding: '4px 10px', fontSize: '11px'}}
                            onClick={() => navigate(`/audit-logs/${log.id}`)}
                          >
                            🔍 ดูรายละเอียด
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px'}}>
                  <button 
                    className="btn secondary"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← ก่อนหน้า
                  </button>
                  <span style={{padding: '12px 20px', background: 'var(--bg)', borderRadius: '8px'}}>
                    หน้า {currentPage} / {totalPages}
                  </span>
                  <button 
                    className="btn secondary"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป →
                  </button>
                </div>
              )}
          )}
        </div>
      </div>
    </Layout>
  )
}
