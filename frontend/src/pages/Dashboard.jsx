import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import config from '../config'

export default function Dashboard(){
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData(){
    try {
      const token = localStorage.getItem('token')
      const headers = { headers: { Authorization: `Bearer ${token}` } }

      const [statsRes, projectsRes] = await Promise.all([
        axios.get(`${config.API_URL}/api/dashboard/stats`, headers),
        axios.get(`${config.API_URL}/api/dashboard/recent-projects`, headers)
      ])

      setStats(statsRes.data.data || {})
      setProjects(projectsRes.data.data || [])
    } catch (error) {
      console.error('Fetch dashboard error:', error)
      if (error.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status){
    const statusMap = {
      draft: { text: 'แบบร่าง', class: 'status-draft' },
      pending_provincial: { text: 'รออนุมัติจังหวัด', class: 'status-pending' },
      pending_secretary: { text: 'รออนุมัติเลขาธิการ', class: 'status-pending' },
      pending_board: { text: 'รออนุมัติบอร์ด', class: 'status-pending' },
      approved: { text: 'อนุมัติ', class: 'status-approved' },
      rejected: { text: 'ไม่อนุมัติ', class: 'status-rejected' }
    }
    const s = statusMap[status] || { text: status, class: '' }
    return <span className={`status-badge ${s.class}`}>{s.text}</span>
  }

  if (loading) {
    return <Layout><div className="loading">กำลังโหลด...</div></Layout>
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>สำนักงาน{user.province ? ` จังหวัด${user.province}` : ' ส่วนกลาง'}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">แผน/โครงการทั้งหมด</div>
            <div className="stat-value">{stats?.total_projects || 0}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">รอการอนุมัติ</div>
            <div className="stat-value">{stats?.pending || 0}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">อนุมัติ</div>
            <div className="stat-value">{stats?.approved || 0}</div>
          </div>
          <div className="stat-card info">
            <div className="stat-label">งบประมาณที่อนุมัติ</div>
            <div className="stat-value">{(stats?.total_budget || 0).toLocaleString()} บาท</div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>แผน/โครงการล่าสุด</h2>
            <button className="btn primary" onClick={() => navigate('/projects/new')}>
              + เพิ่มโครงการ
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">ยังไม่มีโครงการ</div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                  <div className="project-info">
                    <h3>{project.project_name}</h3>
                    <p className="project-org">{project.organization_name}</p>
                    <p className="project-budget">งบประมาณ: {parseFloat(project.total_budget).toLocaleString()} บาท</p>
                  </div>
                  <div className="project-status">
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-header">
            <h2>ดูโครงการทั้งหมด</h2>
            <button className="btn secondary" onClick={() => navigate('/projects')}>
              ดูทั้งหมด →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
