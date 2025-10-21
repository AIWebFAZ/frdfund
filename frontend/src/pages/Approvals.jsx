import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import config from '../config'

export default function Approvals(){
  const navigate = useNavigate()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectDetail, setProjectDetail] = useState(null)
  const [comments, setComments] = useState('')
  const [processing, setProcessing] = useState(false)
  const [viewHistory, setViewHistory] = useState(false)
  const [approvalHistory, setApprovalHistory] = useState([])

  useEffect(() => {
    fetchPending()
  }, [])

  async function fetchPending(){
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${config.API_URL}/api/approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPending(res.data.data || [])
    } catch (error) {
      console.error('Fetch pending error:', error)
      setPending([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchProjectDetail(projectId) {
    try {
      const token = localStorage.getItem('token')
      const [projectRes, historyRes] = await Promise.all([
        axios.get(`${config.API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${config.API_URL}/api/approvals/history/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setProjectDetail(projectRes.data.data)
      setApprovalHistory(historyRes.data.data || [])
    } catch (error) {
      console.error('Fetch project detail error:', error)
    }
  }

  async function handleAction(projectId, action){
    if (!confirm(`ยืนยันการ${action === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}โครงการ?`)) {
      return
    }

    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${config.API_URL}/api/approvals/${projectId}`, 
        { action, comments },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert(`${action === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}โครงการสำเร็จ`)
      setSelectedProject(null)
      setProjectDetail(null)
      setComments('')
      setViewHistory(false)
      fetchPending()
    } catch (error) {
      console.error('Action error:', error)
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message))
    } finally {
      setProcessing(false)
    }
  }

  function openProjectModal(project) {
    setSelectedProject(project)
    setViewHistory(false)
    fetchProjectDetail(project.id)
  }

  function getStatusBadge(status) {
    const statusMap = {
      'pending': { label: 'รอพิจารณา', class: 'warning' },
      'approved': { label: 'อนุมัติ', class: 'success' },
      'rejected': { label: 'ไม่อนุมัติ', class: 'danger' }
    }
    const badge = statusMap[status] || { label: status, class: 'secondary' }
    return <span className={`badge ${badge.class}`}>{badge.label}</span>
  }

  function getApprovalLevelLabel(level) {
    const levelMap = {
      'provincial': 'ผู้อำนวยการส่วนภูมิภาค',
      'secretary': 'เลขาธิการ',
      'board': 'คณะกรรมการบริหาร'
    }
    return levelMap[level] || level
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
        <div className="page-header">
          <div>
            <h1>พิจารณาอนุมัติโครงการ</h1>
            <p style={{color: 'var(--muted)', marginTop: '8px'}}>
              โครงการที่รอการพิจารณาอนุมัติ ({pending.length} รายการ)
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="card" style={{textAlign: 'center', padding: '60px 20px'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>📋</div>
            <h3 style={{color: 'var(--muted)', marginBottom: '10px'}}>ไม่มีโครงการรอพิจารณา</h3>
            <p style={{color: 'var(--muted)'}}>ขณะนี้ไม่มีโครงการที่รอการพิจารณาอนุมัติจากคุณ</p>
          </div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>ชื่อโครงการ</th>
                  <th>องค์กร</th>
                  <th>จังหวัด</th>
                  <th>วงเงิน (บาท)</th>
                  <th>ส่งเมื่อ</th>
                  <th>ระดับการอนุมัติ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(project => (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.project_name}</strong>
                      {parseFloat(project.total_budget) > 500000 && (
                        <div style={{marginTop: '5px'}}>
                          <span className="badge warning" style={{fontSize: '11px'}}>
                            วงเงินเกิน 500K (ต้องผ่านบอร์ด)
                          </span>
                        </div>
                      )}
                    </td>
                    <td>{project.organization_name}</td>
                    <td>{project.province}</td>
                    <td style={{textAlign: 'right'}}>
                      {parseFloat(project.total_budget).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td>
                      {new Date(project.submitted_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <span className="badge secondary">
                        {getApprovalLevelLabel(project.approval_level)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm"
                        onClick={() => openProjectModal(project)}
                      >
                        พิจารณา
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedProject && (
          <div className="modal-overlay" onClick={() => {
            setSelectedProject(null)
            setProjectDetail(null)
            setComments('')
            setViewHistory(false)
          }}>
            <div className="modal modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>พิจารณาอนุมัติโครงการ</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setSelectedProject(null)
                    setProjectDetail(null)
                    setComments('')
                    setViewHistory(false)
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-tabs">
                  <button 
                    className={!viewHistory ? 'active' : ''}
                    onClick={() => setViewHistory(false)}
                  >
                    ข้อมูลโครงการ
                  </button>
                  <button 
                    className={viewHistory ? 'active' : ''}
                    onClick={() => setViewHistory(true)}
                  >
                    ประวัติการอนุมัติ
                  </button>
                </div>

                {!viewHistory ? (
                  <div className="project-detail">
                    <div className="detail-section">
                      <h3>{selectedProject.project_name}</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>องค์กร:</label>
                          <span>{selectedProject.organization_name}</span>
                        </div>
                        <div className="detail-item">
                          <label>จังหวัด:</label>
                          <span>{selectedProject.province}</span>
                        </div>
                        <div className="detail-item">
                          <label>วงเงิน:</label>
                          <span className="budget-amount">
                            {parseFloat(selectedProject.total_budget).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} บาท
                          </span>
                        </div>
                        <div className="detail-item">
                          <label>วันที่ส่ง:</label>
                          <span>
                            {new Date(selectedProject.submitted_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {projectDetail && (
                          <>
                            <div className="detail-item full-width">
                              <label>วัตถุประสงค์:</label>
                              <span>{projectDetail.objectives || '-'}</span>
                            </div>
                            <div className="detail-item full-width">
                              <label>เป้าหมาย:</label>
                              <span>{projectDetail.target_group || '-'}</span>
                            </div>
                            <div className="detail-item full-width">
                              <label>ระยะเวลาดำเนินการ:</label>
                              <span>
                                {projectDetail.start_date && projectDetail.end_date
                                  ? `${new Date(projectDetail.start_date).toLocaleDateString('th-TH')} - ${new Date(projectDetail.end_date).toLocaleDateString('th-TH')}`
                                  : '-'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {parseFloat(selectedProject.total_budget) > 500000 && (
                        <div className="alert alert-warning" style={{marginTop: '20px'}}>
                          <strong>⚠️ หมายเหตุ:</strong> โครงการนี้มีวงเงินเกิน 500,000 บาท ต้องผ่านการอนุมัติจากคณะกรรมการบริหาร
                        </div>
                      )}
                    </div>

                    <div className="detail-section">
                      <h4>การดำเนินการ</h4>
                      <div className="form-group">
                        <label>ความเห็น/หมายเหตุ</label>
                        <textarea 
                          value={comments}
                          onChange={e => setComments(e.target.value)}
                          placeholder="ระบุความเห็นหรือหมายเหตุประกอบการพิจารณา (ถ้ามี)"
                          rows="4"
                          style={{width: '100%'}}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="approval-history">
                    <h4>ประวัติการอนุมัติ</h4>
                    {approvalHistory.length === 0 ? (
                      <p className="empty-state">ยังไม่มีประวัติการอนุมัติ</p>
                    ) : (
                      <div className="timeline">
                        {approvalHistory.map((history, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-marker">
                              {history.status === 'approved' ? '✓' : history.status === 'rejected' ? '✗' : '○'}
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <strong>{getApprovalLevelLabel(history.approval_level)}</strong>
                                {getStatusBadge(history.status)}
                              </div>
                              {history.approver_name && (
                                <div className="timeline-approver">
                                  ผู้พิจารณา: {history.approver_name}
                                </div>
                              )}
                              {history.comments && (
                                <div className="timeline-comments">
                                  ความเห็น: {history.comments}
                                </div>
                              )}
                              {history.approved_at && (
                                <div className="timeline-date">
                                  {new Date(history.approved_at).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="btn secondary"
                  onClick={() => {
                    setSelectedProject(null)
                    setProjectDetail(null)
                    setComments('')
                    setViewHistory(false)
                  }}
                  disabled={processing}
                >
                  ยกเลิก
                </button>
                <button 
                  className="btn danger"
                  onClick={() => handleAction(selectedProject.id, 'reject')}
                  disabled={processing || viewHistory}
                >
                  ไม่อนุมัติ
                </button>
                <button 
                  className="btn success"
                  onClick={() => handleAction(selectedProject.id, 'approve')}
                  disabled={processing || viewHistory}
                >
                  {processing ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
