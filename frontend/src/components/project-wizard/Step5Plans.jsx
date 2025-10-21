import React, { useState, useEffect } from 'react'

export default function Step5Plans({ data, updateData }){
  const [plans, setPlans] = useState(data.plans || [])
  const [activePlan, setActivePlan] = useState(0)

  useEffect(() => {
    // Initialize with 5 empty plans if none exist
    if (plans.length === 0) {
      setPlans([
        { name: '', objectives: '', activities: '', budget: 0, expected_results: '' },
        { name: '', objectives: '', activities: '', budget: 0, expected_results: '' },
        { name: '', objectives: '', activities: '', budget: 0, expected_results: '' },
        { name: '', objectives: '', activities: '', budget: 0, expected_results: '' },
        { name: '', objectives: '', activities: '', budget: 0, expected_results: '' }
      ])
    }
  }, [])

  useEffect(() => {
    updateData('plans', plans)
  }, [plans])

  function updatePlan(index, field, value){
    setPlans(prev => {
      const newPlans = [...prev]
      newPlans[index][field] = value
      return newPlans
    })
  }

  const planLabels = [
    'แผนที่ 1: แผนฟื้นฟูบำบัดหนี้และพัฒนาทางเศรษฐกิจ',
    'แผนที่ 2: แผนการพัฒนาคุณภาพชีวิตหรือสวัสดิการ',
    'แผนที่ 3: แผนการส่งเสริมสวัสดิ์',
    'แผนที่ 4: แผนการตลาด',
    'แผนที่ 5: แผนอื่นๆ'
  ]

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 5: แผนงาน (5 แผน)</h2>
      <p className="step-description">กรอกรายละเอียดแผนงานทั้ง 5 แผน</p>

      <div className="plans-tabs">
        {planLabels.map((label, index) => (
          <button
            key={index}
            className={`plan-tab ${activePlan === index ? 'active' : ''}`}
            onClick={() => setActivePlan(index)}
          >
            แผนที่ {index + 1}
          </button>
        ))}
      </div>

      <div className="plan-form">
        <h3>{planLabels[activePlan]}</h3>

        <div className="form-group">
          <label>ชื่อแผน</label>
          <input 
            type="text"
            value={plans[activePlan]?.name || ''}
            onChange={e => updatePlan(activePlan, 'name', e.target.value)}
            placeholder="ระบุชื่อแผน"
          />
        </div>

        <div className="form-group">
          <label>วัตถุประสงค์</label>
          <textarea 
            value={plans[activePlan]?.objectives || ''}
            onChange={e => updatePlan(activePlan, 'objectives', e.target.value)}
            placeholder="ระบุวัตถุประสงค์ของแผน"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>กิจกรรม/วิธีการดำเนินงาน</label>
          <textarea 
            value={plans[activePlan]?.activities || ''}
            onChange={e => updatePlan(activePlan, 'activities', e.target.value)}
            placeholder="ระบุกิจกรรมและวิธีการดำเนินงาน"
            rows="5"
          />
        </div>

        <div className="form-group">
          <label>งบประมาณ (บาท)</label>
          <input 
            type="number"
            value={plans[activePlan]?.budget || 0}
            onChange={e => updatePlan(activePlan, 'budget', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>ผลที่คาดว่าจะได้รับ</label>
          <textarea 
            value={plans[activePlan]?.expected_results || ''}
            onChange={e => updatePlan(activePlan, 'expected_results', e.target.value)}
            placeholder="ระบุผลที่คาดว่าจะได้รับ"
            rows="4"
          />
        </div>
      </div>

      <div className="plan-navigation">
        <button 
          className="btn secondary"
          onClick={() => setActivePlan(Math.max(0, activePlan - 1))}
          disabled={activePlan === 0}
        >
          ← แผนก่อนหน้า
        </button>
        <span className="plan-indicator">แผนที่ {activePlan + 1} / 5</span>
        <button 
          className="btn secondary"
          onClick={() => setActivePlan(Math.min(4, activePlan + 1))}
          disabled={activePlan === 4}
        >
          แผนถัดไป →
        </button>
      </div>

      {plans.filter(p => p.name).length < 1 && (
        <div className="warning-box">⚠️ กรุณากรอกข้อมูลอย่างน้อย 1 แผน</div>
      )}
    </div>
  )
}
