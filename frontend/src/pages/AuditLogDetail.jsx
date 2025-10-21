import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import Layout from '../components/Layout'

export default function AuditLogDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogDetail()
  }, [id])

  async function fetchLogDetail() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${config.API_URL}/api/audit-logs?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const foundLog = res.data.data.find(l => l.id === parseInt(id))
      setLog(foundLog)
    } catch (error) {
      console.error('Fetch log detail error:', error)
    } finally {
      setLoading(false)
    }
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

  function formatJsonData(data) {
    if (!data) return null
    try {
      if (typeof data === 'object') return data
      return JSON.parse(data)
    } catch (e) {
      return data
    }
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

  if (!log) {
    return (
      <Layout>
        <div className="content-container">
          <div className="card" style={{textAlign: 'center', padding: '60px 20px'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>❌</div>
            <h3 style={{color: 'var(--muted)'}}>ไม่พบข้อมูล Audit Log</h3>
            <button className="btn primary" style={{marginTop: '20px'}} onClick={() => navigate('/audit-logs')}>
              ← กลับไปหน้ารายการ
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const oldData = formatJsonData(log.old_values)
  const newData = formatJsonData(log.new_values)

  return (
    <Layout>
      <div className="content-container">
        <div className="card">
          {/* Header */}
          <div style={{marginBottom: '30px'}}>
            <button 
              className="btn secondary" 
              onClick={() => navigate('/audit-logs')}
              style={{marginBottom: '15px'}}
            >
              ← กลับไปหน้ารายการ
            </button>
            <h1 style={{margin: 0}}>รายละเอียด Audit Log #{log.id}</h1>
            <p style={{color: 'var(--muted)', marginTop: '8px'}}>
              {new Date(log.created_at).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>

          {/* Summary Cards */}
          <div style={{marginBottom: '25px', padding: '20px', background: 'var(--bg)', borderRadius: '12px'}}>
          <h3 style={{marginBottom: '20px', color: 'var(--accent)'}}>ข้อมูลทั่วไป</h3>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <tbody>
              <tr style={{borderBottom: '1px solid var(--border)'}}>
                <td style={{padding: '12px', fontWeight: 'bold', width: '200px', color: 'var(--muted)'}}>
                  ผู้ใช้งาน
                </td>
                <td style={{padding: '12px'}}>
                  <strong>{log.username}</strong>
                  {log.user_full_name && ` (${log.user_full_name})`}
                  <span style={{marginLeft: '10px', fontSize: '13px', color: 'var(--muted)'}}>
                    User ID: {log.user_id}
                  </span>
                </td>
              </tr>
              <tr style={{borderBottom: '1px solid var(--border)'}}>
                <td style={{padding: '12px', fontWeight: 'bold', color: 'var(--muted)'}}>
                  การกระทำ
                </td>
                <td style={{padding: '12px'}}>
                  {getActionBadge(log.action)}
                </td>
              </tr>
              <tr style={{borderBottom: '1px solid var(--border)'}}>
                <td style={{padding: '12px', fontWeight: 'bold', color: 'var(--muted)'}}>
                  ตาราง
                </td>
                <td style={{padding: '12px'}}>
                  <strong>{getTableLabel(log.table_name)}</strong>
                  <span style={{marginLeft: '10px', color: 'var(--muted)', fontSize: '13px'}}>
                    ({log.table_name})
                  </span>
                </td>
              </tr>
              <tr style={{borderBottom: '1px solid var(--border)'}}>
                <td style={{padding: '12px', fontWeight: 'bold', color: 'var(--muted)'}}>
                  Record ID
                </td>
                <td style={{padding: '12px'}}>
                  {log.record_id || '-'}
                </td>
              </tr>
              <tr>
                <td style={{padding: '12px', fontWeight: 'bold', color: 'var(--muted)'}}>
                  IP Address
                </td>
                <td style={{padding: '12px'}}>
                  {log.ip_address || '-'}
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          {/* Changes Table for UPDATE */}
          {log.action === 'UPDATE' && oldData && newData && (
            <div style={{marginBottom: '25px', padding: '20px', background: 'var(--bg)', borderRadius: '12px'}}>
            <h3 style={{marginBottom: '20px', color: 'var(--accent)'}}>🔄 การเปลี่ยนแปลง</h3>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{background: 'var(--bg)', borderBottom: '2px solid var(--border)'}}>
                    <th style={{padding: '12px', textAlign: 'left', width: '25%'}}>Field</th>
                    <th style={{padding: '12px', textAlign: 'left', width: '37.5%'}}>ค่าเดิม</th>
                    <th style={{padding: '12px', textAlign: 'center', width: '5%'}}></th>
                    <th style={{padding: '12px', textAlign: 'left', width: '37.5%'}}>ค่าใหม่</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(newData).map(key => {
                    if (oldData[key] === newData[key] || key === 'updated_at' || key === 'password') {
                      return null
                    }
                    return (
                      <tr key={key} style={{borderBottom: '1px solid var(--border)'}}>
                        <td style={{padding: '12px', fontWeight: 'bold', verticalAlign: 'top'}}>
                          {key}
                        </td>
                        <td style={{
                          padding: '12px',
                          background: '#fff3cd',
                          color: '#856404',
                          verticalAlign: 'top',
                          wordBreak: 'break-word'
                        }}>
                          {String(oldData[key]) || '(ว่าง)'}
                        </td>
                        <td style={{padding: '12px', textAlign: 'center', verticalAlign: 'middle'}}>
                          →
                        </td>
                        <td style={{
                          padding: '12px',
                          background: '#d4edda',
                          color: '#155724',
                          verticalAlign: 'top',
                          wordBreak: 'break-word'
                        }}>
                          {String(newData[key]) || '(ว่าง)'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {/* Old Values Table */}
          {oldData && (
            <div style={{marginBottom: '25px', padding: '20px', background: 'var(--bg)', borderRadius: '12px'}}>
            <h3 style={{marginBottom: '20px', color: '#c62828'}}>📋 ข้อมูลเดิม (Before)</h3>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{background: '#ffebee', borderBottom: '2px solid #ffcdd2'}}>
                    <th style={{padding: '12px', textAlign: 'left', width: '30%'}}>Field</th>
                    <th style={{padding: '12px', textAlign: 'left'}}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(oldData).map(([key, value]) => (
                    <tr key={key} style={{borderBottom: '1px solid var(--border)'}}>
                      <td style={{padding: '12px', fontWeight: 'bold'}}>{key}</td>
                      <td style={{padding: '12px', wordBreak: 'break-word'}}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {/* New Values Table */}
          {newData && (
            <div style={{marginBottom: '25px', padding: '20px', background: 'var(--bg)', borderRadius: '12px'}}>
            <h3 style={{marginBottom: '20px', color: '#2e7d32'}}>📝 ข้อมูลใหม่ (After)</h3>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{background: '#e8f5e9', borderBottom: '2px solid #c8e6c9'}}>
                    <th style={{padding: '12px', textAlign: 'left', width: '30%'}}>Field</th>
                    <th style={{padding: '12px', textAlign: 'left'}}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(newData).map(([key, value]) => (
                    <tr key={key} style={{borderBottom: '1px solid var(--border)'}}>
                      <td style={{padding: '12px', fontWeight: 'bold'}}>{key}</td>
                      <td style={{padding: '12px', wordBreak: 'break-word'}}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {/* Back Button */}
          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <button 
              className="btn secondary" 
              onClick={() => navigate('/audit-logs')}
              style={{padding: '12px 40px'}}
            >
              ← กลับไปหน้ารายการ
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
