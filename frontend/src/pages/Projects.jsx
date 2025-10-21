import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import config from '../config'

export default function Projects(){
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchProjects()
  }, [filter])

  async function fetchProjects(){
    try {
      const token = localStorage.getItem('token')
      const url = filter === 'all' 
        ? `${config.API_URL}/api/projects`
        : `${config.API_URL}/api/projects?status=${filter}`
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProjects(res.data.data)
    } catch (error) {
      console.error('Fetch projects error:', error)
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
      <div className="content-container">
        <div className="projects-page">
          <div className="page-header">
            <h1>รายการโครงการทั้งหมด</h1>
            <button className="btn primary" onClick={() => navigate('/projects/new')}>
              + เพิ่มโครงการใหม่
            </button>
          </div>

        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('all')}
          >
            ทั้งหมด ({projects.length})
          </button>
          <button 
            className={filter === 'draft' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('draft')}
          >
            แบบร่าง
          </button>
          <button 
            className={filter === 'pending_provincial' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('pending_provincial')}
          >
            รอจังหวัด
          </button>
          <button 
            className={filter === 'pending_secretary' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('pending_secretary')}
          >
            รอเลขาธิการ
          </button>
          <button 
            className={filter === 'approved' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('approved')}
          >
            อนุมัติ
          </button>
          <button 
            className={filter === 'rejected' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('rejected')}
          >
            ไม่อนุมัติ
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">ไม่พบโครงการ</div>
        ) : (
          <div className="projects-table">
            <table>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อโครงการ</th>
                  <th>องค์กร</th>
                  <th>จังหวัด</th>
                  <th>วงเงิน</th>
                  <th>สถานะ</th>
                  <th>วันที่สร้าง</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id}>
                    <td>{project.project_code || project.id}</td>
                    <td>{project.project_name}</td>
                    <td>{project.organization_name}</td>
                    <td>{project.province}</td>
                    <td className="text-right">{parseFloat(project.total_budget).toLocaleString()}</td>
                    <td>{getStatusBadge(project.status)}</td>
                    <td>{new Date(project.created_at).toLocaleDateString('th-TH')}</td>
                    <td>
                      <button 
                        className="btn-icon"
                        onClick={() => navigate(project.status === 'draft' ? `/projects/${project.id}/edit` : `/projects/${project.id}`)}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </Layout>
  )
}
