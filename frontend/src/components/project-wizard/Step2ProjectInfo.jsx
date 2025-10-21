import React, { useState, useEffect } from 'react'

export default function Step2ProjectInfo({ data, updateData }){
  const [info, setInfo] = useState(data.projectInfo || {
    project_name: '',
    project_description: '',
    total_budget: '',
    objectives: '',
    expected_results: '',
    start_date: '',
    end_date: '',
    duration_months: ''
  })

  useEffect(() => {
    updateData('projectInfo', info)
  }, [info])

  function handleChange(field, value){
    setInfo(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 2: ข้อมูลโครงการ</h2>
      <p className="step-description">กรอกรายละเอียดโครงการ</p>

      <div className="form-group">
        <label>ชื่อโครงการ <span className="required">*</span></label>
        <input 
          type="text"
          value={info.project_name}
          onChange={e => handleChange('project_name', e.target.value)}
          placeholder="ระบุชื่อโครงการ"
          required
        />
      </div>

      <div className="form-group">
        <label>รายละเอียดโครงการ</label>
        <textarea 
          value={info.project_description}
          onChange={e => handleChange('project_description', e.target.value)}
          placeholder="อธิบายรายละเอียดโครงการ"
          rows="4"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>วงเงินโครงการ (บาท) <span className="required">*</span></label>
          <input 
            type="number"
            value={info.total_budget}
            onChange={e => handleChange('total_budget', e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>ระยะเวลาดำเนินงาน (เดือน)</label>
          <input 
            type="number"
            value={info.duration_months}
            onChange={e => handleChange('duration_months', e.target.value)}
            placeholder="12"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>วันเริ่มต้น</label>
          <input 
            type="date"
            value={info.start_date}
            onChange={e => handleChange('start_date', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>วันสิ้นสุด</label>
          <input 
            type="date"
            value={info.end_date}
            onChange={e => handleChange('end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>วัตถุประสงค์โครงการ</label>
        <textarea 
          value={info.objectives}
          onChange={e => handleChange('objectives', e.target.value)}
          placeholder="ระบุวัตถุประสงค์"
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>ผลที่คาดว่าจะได้รับ</label>
        <textarea 
          value={info.expected_results}
          onChange={e => handleChange('expected_results', e.target.value)}
          placeholder="ระบุผลที่คาดว่าจะได้รับ"
          rows="4"
        />
      </div>
    </div>
  )
}
