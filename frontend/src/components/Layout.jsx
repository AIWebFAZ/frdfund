import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Layout({ children }){
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function handleLogout(){
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const roleText = {
    admin: 'ผู้ดูแลระบบ',
    staff: 'เจ้าหน้าที่',
    provincial_director: 'ผู้อำนวยการจังหวัด',
    secretary_general: 'เลขาธิการสำนักฟื้นฟู',
    board: 'คณะกรรมการบริหาร'
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <img src="/logo.png" alt="logo" className="navbar-logo" />
          <span>กองทุนฟื้นฟูฯ</span>
        </div>
        <div className="navbar-menu">
          <button className="nav-link" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="nav-link" onClick={() => navigate('/projects')}>
            โครงการ
          </button>
          <button className="nav-link" onClick={() => navigate('/approvals')}>
            พิจารณาอนุมัติ
          </button>
          {(user.role === 'admin' || user.roles?.includes('admin')) && (
            <>
              <button className="nav-link" onClick={() => navigate('/users')}>
                จัดการผู้ใช้
              </button>
              <button className="nav-link" onClick={() => navigate('/user-roles')}>
                จัดการ Roles
              </button>
              <button className="nav-link" onClick={() => navigate('/audit-logs')}>
                บันทึกการใช้งาน
              </button>
            </>
          )}
        </div>
        <div className="navbar-user" style={{
          borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
          paddingLeft: '20px',
          marginLeft: '20px'
        }}>
          <div className="user-badge">{roleText[user.role] || 'ผู้ใช้'}</div>
          <span className="user-name">{user.full_name}</span>
          <button 
            className="nav-link" 
            onClick={() => navigate('/change-password')}
            style={{marginRight: '10px'}}
          >
            🔐 เปลี่ยนรหัสผ่าน
          </button>
          <button className="btn-logout" onClick={handleLogout}>ออกจากระบบ</button>
        </div>
      </nav>
      <main className="content">
        {children}
      </main>
    </div>
  )
}
