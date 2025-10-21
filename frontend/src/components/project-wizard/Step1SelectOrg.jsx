import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Step1SelectOrg({ data, updateData }){
  const [search, setSearch] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(data.organization)

  async function handleSearch(){
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${config.API_URL}/api/groups?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setGroups(res.data.data)
    } catch (error) {
      console.error('Search error:', error)
      alert('ค้นหาไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(group){
    setSelectedGroup(group)
    updateData('organization', group)
  }

  useEffect(() => {
    handleSearch()
  }, [])

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 1: เลือกองค์กรเกษตรกร</h2>
      <p className="step-description">ค้นหาและเลือกองค์กรเกษตรกรจาก Big Data</p>

      <div className="search-box">
        <input 
          type="text" 
          placeholder="ค้นหาชื่อองค์กร หรือ รหัสองค์กร" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn primary" onClick={handleSearch} disabled={loading}>
          {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
      </div>

      {selectedGroup && (
        <div className="selected-org">
          <h3>✓ เลือกแล้ว: {selectedGroup.name}</h3>
          <p>รหัส: {selectedGroup.id} | จังหวัด: {selectedGroup.province}</p>
        </div>
      )}

      <div className="groups-list">
        {groups.length === 0 ? (
          <div className="empty-state">ไม่พบข้อมูลองค์กร</div>
        ) : (
          groups.map(group => (
            <div 
              key={group.id} 
              className={`group-card ${selectedGroup?.id === group.id ? 'selected' : ''}`}
              onClick={() => handleSelect(group)}
            >
              <div className="group-info">
                <h4>{group.name}</h4>
                <p>รหัส: {group.id} | ประเภท: {group.type}</p>
                <p>จังหวัด: {group.province} | อำเภอ: {group.district}</p>
                <p>จำนวนสมาชิก: {group.total_members} คน</p>
              </div>
              {selectedGroup?.id === group.id && (
                <div className="selected-badge">✓ เลือกแล้ว</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
