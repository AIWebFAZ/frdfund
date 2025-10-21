import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Step3Members({ data, updateData }){
  const [allMembers, setAllMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState(data.members || [])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data.organization) {
      fetchMembers()
    }
  }, [])

  useEffect(() => {
    updateData('members', selectedMembers)
  }, [selectedMembers])

  async function fetchMembers(){
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${config.API_URL}/api/groups/${data.organization.id}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAllMembers(res.data.data)
    } catch (error) {
      console.error('Fetch members error:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleMember(member){
    const exists = selectedMembers.find(m => m.id === member.id)
    if (exists) {
      setSelectedMembers(prev => prev.filter(m => m.id !== member.id))
    } else {
      setSelectedMembers(prev => [...prev, member])
    }
  }

  if (!data.organization) {
    return (
      <div className="step-content">
        <h2>ขั้นตอนที่ 3: เลือกสมาชิกที่เข้าร่วมโครงการ</h2>
        <div className="warning-box">กรุณาเลือกองค์กรในขั้นตอนที่ 1 ก่อน</div>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">กำลังโหลดรายชื่อสมาชิก...</div>
  }

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 3: เลือกสมาชิกที่เข้าร่วมโครงการ</h2>
      <p className="step-description">
        เลือกสมาชิกจากองค์กร: <strong>{data.organization.name}</strong> 
        <span className="info-badge">เลือกแล้ว {selectedMembers.length} คน</span>
      </p>

      <div className="members-grid">
        {allMembers.map(member => {
          const isSelected = selectedMembers.find(m => m.id === member.id)
          return (
            <div 
              key={member.id}
              className={`member-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleMember(member)}
            >
              <input 
                type="checkbox" 
                checked={!!isSelected}
                onChange={() => {}}
              />
              <div className="member-info">
                <h4>{member.name}</h4>
                <p>เลขบัตร: {member.id_card}</p>
                <p>ตำแหน่ง: {member.position}</p>
              </div>
            </div>
          )
        })}
      </div>

      {selectedMembers.length < 1 && (
        <div className="warning-box">⚠️ กรุณาเลือกสมาชิกอย่างน้อย 1 คน</div>
      )}
    </div>
  )
}
