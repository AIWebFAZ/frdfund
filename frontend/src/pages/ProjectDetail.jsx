import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import config from '../config'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [budgetItems, setBudgetItems] = useState([])
  const [plans, setPlans] = useState([])
  const [documents, setDocuments] = useState([])
  const [approvalHistory, setApprovalHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchProjectDetail()
  }, [id])

  async function fetchProjectDetail() {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [projectRes, membersRes, budgetRes, plansRes, docsRes, historyRes] = await Promise.all([
        axios.get(`${config.API_URL}/api/projects/${id}`, { headers }),
        axios.get(`${config.API_URL}/api/projects/${id}/members`, { headers }),
        axios.get(`${config.API_URL}/api/projects/${id}/budget`, { headers }),
        axios.get(`${config.API_URL}/api/projects/${id}/plans`, { headers }),
        axios.get(`${config.API_URL}/api/documents/${id}/documents`, { headers }),
        axios.get(`${config.API_URL}/api/approvals/history/${id}`, { headers })
      ])

      setProject(projectRes.data.data)
      setMembers(membersRes.data.data || [])
      setBudgetItems(budgetRes.data.data || [])
      setPlans(plansRes.data.data || [])
      setDocuments(docsRes.data.data || [])
      setApprovalHistory(historyRes.data.data || [])
    } catch (error) {
      console.error('Fetch project detail error:', error)
      if (error.response?.status === 404) {
        alert('ไม่พบโครงการ')
        navigate('/projects')
      }
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status) {
    const statusMap = {
      'draft': { label: 'ร่าง', class: 'secondary' },
      'pending_provincial': { label: 'รอผู้อำนวยการภูมิภาค', class: 'warning' },
      'pending_secretary': { label: 'รอเลขาธิการ', class: 'warning' },
      'pending_board': { label: 'รอคณะกรรมการ', class: 'warning' },
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

  function getApprovalStatusBadge(status) {
    const statusMap = {
      'pending': { label: 'รอพิจารณา', class: 'warning' },
      'approved': { label: 'อนุมัติ', class: 'success' },
      'rejected': { label: 'ไม่อนุมัติ', class: 'danger' }
    }
    const badge = statusMap[status] || { label: status, class: 'secondary' }
    return <span className={`badge ${badge.class}`}>{badge.label}</span>
  }

  function groupPlansByType(plans) {
    const grouped = {}
    plans.forEach(plan => {
      if (!grouped[plan.plan_type]) {
        grouped[plan.plan_type] = []
      }
      grouped[plan.plan_type].push(plan)
    })
    return grouped
  }

  function formatFileSize(bytes) {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('ไฟล์มีขนาดใหญ่เกิน 10MB')
      return
    }

    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', 'attachment')
      formData.append('description', '')

      await axios.post(
        `${config.API_URL}/api/documents/${id}/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      alert('อัพโหลดไฟล์สำเร็จ')
      fetchProjectDetail() // Refresh to show new document
      e.target.value = '' // Reset file input
    } catch (error) {
      console.error('Upload error:', error)
      alert('เกิดข้อผิดพลาดในการอัพโหลดไฟล์')
    } finally {
      setUploading(false)
    }
  }

  function handleViewDocument(filename) {
    const token = localStorage.getItem('token')
    window.open(`${config.API_URL}/api/documents/view/${filename}?token=${token}`, '_blank')
  }

  async function handleDeleteDocument(docId) {
    if (!confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `${config.API_URL}/api/documents/${docId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      alert('ลบเอกสารสำเร็จ')
      fetchProjectDetail() // Refresh to update document list
    } catch (error) {
      console.error('Delete error:', error)
      alert('เกิดข้อผิดพลาดในการลบเอกสาร')
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

  if (!project) {
    return (
      <Layout>
        <div className="content-container">
          <div className="card" style={{textAlign: 'center', padding: '60px 20px'}}>
            <h3>ไม่พบโครงการ</h3>
          </div>
        </div>
      </Layout>
    )
  }

  const groupedPlans = groupPlansByType(plans)

  return (
    <Layout>
      <div className="content-container">
        <div className="page-header">
          <div>
            <button className="btn secondary" onClick={() => navigate(-1)} style={{marginBottom: '10px'}}>
              ← กลับ
            </button>
            <h1>{project.project_name}</h1>
            <div style={{marginTop: '10px'}}>
              {getStatusBadge(project.status)}
              {project.project_code && (
                <span style={{marginLeft: '10px', color: 'var(--muted)', fontSize: '14px'}}>
                  รหัสโครงการ: {project.project_code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{marginBottom: '20px'}}>
          <button 
            className={activeTab === 'info' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('info')}
          >
            ข้อมูลโครงการ
          </button>
          <button 
            className={activeTab === 'members' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('members')}
          >
            คณะทำงาน ({members.length})
          </button>
          <button 
            className={activeTab === 'budget' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('budget')}
          >
            งบประมาณ
          </button>
          <button 
            className={activeTab === 'plans' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('plans')}
          >
            แผนการดำเนินงาน
          </button>
          <button 
            className={activeTab === 'documents' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('documents')}
          >
            เอกสาร ({documents.length})
          </button>
          <button 
            className={activeTab === 'approval' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('approval')}
          >
            ประวัติการอนุมัติ
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="card">
            <h3 style={{marginBottom: '20px', color: 'var(--accent)'}}>ข้อมูลทั่วไป</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>องค์กร:</label>
                <span>{project.organization_name}</span>
              </div>
              <div className="detail-item">
                <label>ประเภทองค์กร:</label>
                <span>{project.organization_type || '-'}</span>
              </div>
              <div className="detail-item">
                <label>จังหวัด:</label>
                <span>{project.province || '-'}</span>
              </div>
              <div className="detail-item">
                <label>วงเงิน:</label>
                <span className="budget-amount">
                  {parseFloat(project.total_budget).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} บาท
                </span>
              </div>
              <div className="detail-item">
                <label>ระยะเวลา:</label>
                <span>
                  {project.duration_months ? `${project.duration_months} เดือน` : '-'}
                </span>
              </div>
              <div className="detail-item">
                <label>วันที่เริ่มต้น:</label>
                <span>
                  {project.start_date 
                    ? new Date(project.start_date).toLocaleDateString('th-TH')
                    : '-'}
                </span>
              </div>
              <div className="detail-item">
                <label>วันที่สิ้นสุด:</label>
                <span>
                  {project.end_date 
                    ? new Date(project.end_date).toLocaleDateString('th-TH')
                    : '-'}
                </span>
              </div>
              <div className="detail-item">
                <label>สร้างเมื่อ:</label>
                <span>
                  {new Date(project.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="detail-item full-width">
                <label>วัตถุประสงค์:</label>
                <span>{project.objectives || '-'}</span>
              </div>
              <div className="detail-item full-width">
                <label>ผลที่คาดว่าจะได้รับ:</label>
                <span>{project.expected_results || '-'}</span>
              </div>
              <div className="detail-item full-width">
                <label>รายละเอียด:</label>
                <span>{project.project_description || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="card">
            <h3 style={{marginBottom: '20px', color: 'var(--accent)'}}>คณะทำงาน</h3>
            {members.length === 0 ? (
              <p style={{color: 'var(--muted)', textAlign: 'center', padding: '40px'}}>
                ไม่มีข้อมูลคณะทำงาน
              </p>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ชื่อ-สกุล</th>
                      <th>ตำแหน่ง</th>
                      <th>บทบาท</th>
                      <th>เบอร์โทร</th>
                      <th>อีเมล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, index) => (
                      <tr key={index}>
                        <td>{member.member_name}</td>
                        <td>{member.position || '-'}</td>
                        <td>{member.role || '-'}</td>
                        <td>{member.phone || '-'}</td>
                        <td>{member.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="card">
            <h3 style={{marginBottom: '20px', color: 'var(--accent)'}}>งบประมาณ</h3>
            {budgetItems.length === 0 ? (
              <p style={{color: 'var(--muted)', textAlign: 'center', padding: '40px'}}>
                ไม่มีข้อมูลงบประมาณ
              </p>
            ) : (
              <>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>รายการ</th>
                        <th>หมวดหมู่</th>
                        <th style={{textAlign: 'right'}}>จำนวน</th>
                        <th style={{textAlign: 'right'}}>ราคา/หน่วย</th>
                        <th style={{textAlign: 'right'}}>รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{item.item_name}</strong>
                            {item.description && (
                              <div style={{fontSize: '12px', color: 'var(--muted)', marginTop: '4px'}}>
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td>{item.category || '-'}</td>
                          <td style={{textAlign: 'right'}}>{item.quantity} {item.unit || ''}</td>
                          <td style={{textAlign: 'right'}}>
                            {parseFloat(item.unit_price).toLocaleString('th-TH', {
                              minimumFractionDigits: 2
                            })}
                          </td>
                          <td style={{textAlign: 'right'}}>
                            <strong>
                              {parseFloat(item.total_price).toLocaleString('th-TH', {
                                minimumFractionDigits: 2
                              })}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background: 'var(--bg)', fontWeight: 'bold'}}>
                        <td colSpan="4" style={{textAlign: 'right'}}>รวมทั้งหมด:</td>
                        <td style={{textAlign: 'right', color: 'var(--primary)', fontSize: '18px'}}>
                          {budgetItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0)
                            .toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="card">
            <h3 style={{marginBottom: '20px', color: 'var(--accent)'}}>แผนการดำเนินงาน</h3>
            {plans.length === 0 ? (
              <p style={{color: 'var(--muted)', textAlign: 'center', padding: '40px'}}>
                ไม่มีข้อมูลแผนการดำเนินงาน
              </p>
            ) : (
              Object.keys(groupedPlans).map(planType => (
                <div key={planType} style={{marginBottom: '30px'}}>
                  <h4 style={{color: 'var(--primary)', marginBottom: '15px'}}>
                    {planType === 'personnel' && '1. แผนการใช้บุคลากร'}
                    {planType === 'operations' && '2. แผนการดำเนินงาน'}
                    {planType === 'procurement' && '3. แผนการจัดซื้อจัดจ้าง'}
                    {planType === 'location' && '4. สถานที่ดำเนินโครงการ'}
                    {planType === 'output' && '5. ผลผลิตและตัวชี้วัด'}
                  </h4>
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>รายการ</th>
                          <th>รายละเอียด</th>
                          {planType !== 'location' && planType !== 'output' && <th>ระยะเวลา</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {groupedPlans[planType].map((plan, index) => (
                          <tr key={index}>
                            <td><strong>{plan.item_name}</strong></td>
                            <td>{plan.description || '-'}</td>
                            {planType !== 'location' && planType !== 'output' && (
                              <td>{plan.duration || '-'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{color: 'var(--accent)', margin: 0}}>เอกสารประกอบ</h3>
              {project?.status === 'draft' && (
                <button 
                  className="btn-primary"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  + อัพโหลดเอกสาร
                </button>
              )}
            </div>

            <input
              type="file"
              id="fileInput"
              style={{display: 'none'}}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />

            {documents.length === 0 ? (
              <p style={{color: 'var(--muted)', textAlign: 'center', padding: '40px'}}>
                ไม่มีเอกสารประกอบ
              </p>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th style={{width: '40%'}}>ชื่อไฟล์</th>
                      <th style={{width: '15%'}}>ประเภท</th>
                      <th style={{width: '10%'}}>ขนาด</th>
                      <th style={{width: '15%'}}>ผู้อัพโหลด</th>
                      <th style={{width: '15%'}}>วันที่</th>
                      <th style={{width: '5%'}}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, index) => (
                      <tr key={index}>
                        <td>
                          <a 
                            href={`${config.API_URL}/api/documents/download/${doc.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{color: 'var(--accent)', textDecoration: 'none'}}
                          >
                            📄 {doc.file_name}
                          </a>
                        </td>
                        <td>{doc.document_type || '-'}</td>
                        <td>{formatFileSize(doc.file_size)}</td>
                        <td>{doc.uploader_name || '-'}</td>
                        <td>
                          {new Date(doc.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => handleViewDocument(doc.file_path)}
                            title="ดูเอกสาร"
                          >
                            👁️
                          </button>
                          {project?.status === 'draft' && (
                            <button
                              className="btn-icon"
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="ลบ"
                              style={{marginLeft: '5px'}}
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {documents.length > 0 && (
              <div style={{marginTop: '10px', color: 'var(--muted)', fontSize: '0.9em'}}>
                รวม {documents.length} ไฟล์
              </div>
            )}
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="card">
            <h3 style={{marginBottom: '20px', color: 'var(--accent)'}}>ประวัติการอนุมัติ</h3>
            {approvalHistory.length === 0 ? (
              <p style={{color: 'var(--muted)', textAlign: 'center', padding: '40px'}}>
                ยังไม่มีประวัติการอนุมัติ
              </p>
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
                        {getApprovalStatusBadge(history.status)}
                      </div>
                      {history.approver_name && (
                        <div className="timeline-approver">
                          ผู้พิจารณา: {history.approver_name} ({history.approver_role})
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
                      {!history.approved_at && history.status === 'pending' && (
                        <div className="timeline-date" style={{color: 'var(--warning)'}}>
                          รอการพิจารณา
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
    </Layout>
  )
}
