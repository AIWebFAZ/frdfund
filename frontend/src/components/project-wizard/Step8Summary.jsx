import React from 'react'

export default function Step8Summary({ data }){
  const totalBudget = data.budgetItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0)
  const totalPlanBudget = data.plans.reduce((sum, plan) => sum + (parseFloat(plan.budget) || 0), 0)

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 8: สรุปและยืนยันส่งเรื่อง</h2>
      <p className="step-description">ตรวจสอบข้อมูลให้ครบถ้วนก่อนส่งเรื่องเพื่ออนุมัติ</p>

      <div className="summary-sections">
        <div className="summary-card">
          <h3>1. ข้อมูลองค์กร</h3>
          {data.organization ? (
            <>
              <p><strong>ชื่อองค์กร:</strong> {data.organization.name}</p>
              <p><strong>รหัส:</strong> {data.organization.id}</p>
              <p><strong>ประเภท:</strong> {data.organization.type}</p>
              <p><strong>จังหวัด:</strong> {data.organization.province}</p>
            </>
          ) : (
            <p className="warning">⚠️ ยังไม่ได้เลือกองค์กร</p>
          )}
        </div>

        <div className="summary-card">
          <h3>2. ข้อมูลโครงการ</h3>
          {data.projectInfo.project_name ? (
            <>
              <p><strong>ชื่อโครงการ:</strong> {data.projectInfo.project_name}</p>
              <p><strong>วงเงิน:</strong> {parseFloat(data.projectInfo.total_budget || 0).toLocaleString()} บาท</p>
              <p><strong>ระยะเวลา:</strong> {data.projectInfo.duration_months} เดือน</p>
              {data.projectInfo.start_date && (
                <p><strong>เริ่ม:</strong> {data.projectInfo.start_date} <strong>สิ้นสุด:</strong> {data.projectInfo.end_date}</p>
              )}
            </>
          ) : (
            <p className="warning">⚠️ ยังไม่ได้กรอกข้อมูลโครงการ</p>
          )}
        </div>

        <div className="summary-card">
          <h3>3. สมาชิกที่เข้าร่วม</h3>
          {data.members.length > 0 ? (
            <>
              <p><strong>จำนวน:</strong> {data.members.length} คน</p>
              <ul className="member-list">
                {data.members.slice(0, 5).map((member, i) => (
                  <li key={i}>{member.name} ({member.position})</li>
                ))}
                {data.members.length > 5 && <li>...และอีก {data.members.length - 5} คน</li>}
              </ul>
            </>
          ) : (
            <p className="warning">⚠️ ยังไม่ได้เลือกสมาชิก</p>
          )}
        </div>

        <div className="summary-card">
          <h3>4. งบประมาณ</h3>
          {data.budgetItems.length > 0 ? (
            <>
              <p><strong>จำนวนรายการ:</strong> {data.budgetItems.length} รายการ</p>
              <p><strong>รวมงบประมาณ:</strong> {totalBudget.toLocaleString()} บาท</p>
            </>
          ) : (
            <p className="warning">⚠️ ยังไม่ได้เพิ่มรายการงบประมาณ</p>
          )}
        </div>

        <div className="summary-card">
          <h3>5. แผนงาน</h3>
          {data.plans.filter(p => p.name).length > 0 ? (
            <>
              <p><strong>จำนวนแผน:</strong> {data.plans.filter(p => p.name).length} / 5 แผน</p>
              <p><strong>งบประมาณแผน:</strong> {totalPlanBudget.toLocaleString()} บาท</p>
              <ul className="plan-list">
                {data.plans.filter(p => p.name).map((plan, i) => (
                  <li key={i}>แผนที่ {i + 1}: {plan.name}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="warning">⚠️ ยังไม่ได้กรอกแผนงาน</p>
          )}
        </div>

        <div className="summary-card">
          <h3>6. สินทรัพย์/หนี้สิน</h3>
          {data.assets && data.assets.total_assets > 0 ? (
            <>
              <p><strong>ทรัพย์สิน:</strong> {data.assets.total_assets.toLocaleString()} บาท</p>
              <p><strong>หนี้สิน:</strong> {data.assets.total_liabilities.toLocaleString()} บาท</p>
              <p><strong>สินทรัพย์สุทธิ:</strong> {(data.assets.total_assets - data.assets.total_liabilities).toLocaleString()} บาท</p>
            </>
          ) : (
            <p className="info">ไม่ได้กรอกข้อมูล (ไม่บังคับ)</p>
          )}
        </div>

        <div className="summary-card">
          <h3>7. เอกสารแนบ</h3>
          {data.documents && data.documents.length > 0 ? (
            <>
              <p><strong>จำนวนไฟล์:</strong> {data.documents.length} ไฟล์</p>
            </>
          ) : (
            <p className="info">ไม่มีเอกสารแนบ (ไม่บังคับ)</p>
          )}
        </div>
      </div>

      <div className="confirmation-box">
        <h3>⚠️ ยืนยันการส่งเรื่อง</h3>
        <p>เมื่อกดปุ่ม "ส่งเรื่องเพื่ออนุมัติ" โครงการจะถูกส่งไปยังผู้อำนวยการจังหวัดเพื่อพิจารณา</p>
        <p>กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนส่ง</p>
      </div>
    </div>
  )
}
