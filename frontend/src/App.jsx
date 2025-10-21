import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectWizard from './pages/ProjectWizard'
import ProjectDetail from './pages/ProjectDetail'
import Approvals from './pages/Approvals'
import Users from './pages/Users'
import UserRoles from './pages/UserRoles'
import AuditLogs from './pages/AuditLogs'
import AuditLogDetail from './pages/AuditLogDetail'

function PrivateRoute({ children }){
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/forgot-password" element={<ForgotPassword/>} />
      <Route path="/change-password" element={<PrivateRoute><ChangePassword/></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute><Projects/></PrivateRoute>} />
      <Route path="/projects/new" element={<PrivateRoute><ProjectWizard/></PrivateRoute>} />
      <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail/></PrivateRoute>} />
      <Route path="/approvals" element={<PrivateRoute><Approvals/></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users/></PrivateRoute>} />
      <Route path="/user-roles" element={<PrivateRoute><UserRoles/></PrivateRoute>} />
      <Route path="/audit-logs" element={<PrivateRoute><AuditLogs/></PrivateRoute>} />
      <Route path="/audit-logs/:id" element={<PrivateRoute><AuditLogDetail/></PrivateRoute>} />
    </Routes>
  )
}
