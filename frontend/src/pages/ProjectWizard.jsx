import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import Layout from '../components/Layout'
import Step1SelectOrg from '../components/project-wizard/Step1SelectOrg'
import Step2ProjectInfo from '../components/project-wizard/Step2ProjectInfo'
import Step3Members from '../components/project-wizard/Step3Members'
import Step4Budget from '../components/project-wizard/Step4Budget'
import Step5Plans from '../components/project-wizard/Step5Plans'
import Step6Assets from '../components/project-wizard/Step6Assets'
import Step7Documents from '../components/project-wizard/Step7Documents'
import Step8Summary from '../components/project-wizard/Step8Summary'

export default function ProjectWizard({ editMode = false }){
  const navigate = useNavigate()
  const { id } = useParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(editMode)
  const [projectData, setProjectData] = useState({
    organization: null,
    projectInfo: {},
    members: [],
    budgetItems: [],
    plans: [],
    assets: {},
    documents: []
  })
  const [saving, setSaving] = useState(false)

  // โหลดข้อมูลโครงการเมื่ออยู่ในโหมดแก้ไข
  useEffect(() => {
    if (editMode && id) {
      loadProjectData()
    }
  }, [editMode, id])

  async function loadProjectData() {
    try {
      const token = localStorage.getItem('token')
      
      // โหลดข้อมูลโครงการ
      const projectRes = await axios.get(`${config.API_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const project = projectRes.data

      // โหลดสมาชิก งบประมาณ แผนงาน
      const [membersRes, budgetRes, plansRes] = await Promise.all([
        axios.get(`${config.API_URL}/api/projects/${id}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${config.API_URL}/api/projects/${id}/budget`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${config.API_URL}/api/projects/${id}/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      // ตั้งค่าข้อมูลที่โหลดมา
      setProjectData({
        organization: {
          id: project.organization_id,
          name: project.organization_name,
          type: project.organization_type,
          province: project.province
        },
        projectInfo: {
          project_name: project.project_name,
          project_description: project.project_description,
          total_budget: project.total_budget,
          objectives: project.objectives,
          expected_results: project.expected_results,
          start_date: project.start_date,
          end_date: project.end_date,
          duration_months: project.duration_months
        },
        members: membersRes.data || [],
        budgetItems: budgetRes.data || [],
        plans: plansRes.data || [],
        assets: {},
        documents: []
      })

      setLoading(false)
    } catch (error) {
      console.error('Error loading project:', error)
      alert('ไม่สามารถโหลดข้อมูลโครงการได้')
      navigate('/projects')
    }
  }

  const steps = [
    { num: 1, title: 'เลือกองค์กร', component: Step1SelectOrg },
    { num: 2, title: 'ข้อมูลโครงการ', component: Step2ProjectInfo },
    { num: 3, title: 'สมาชิกเข้าร่วม', component: Step3Members },
    { num: 4, title: 'งบประมาณ', component: Step4Budget },
    { num: 5, title: 'แผนงาน (5 แผน)', component: Step5Plans },
    { num: 6, title: 'สินทรัพย์/หนี้สิน', component: Step6Assets },
    { num: 7, title: 'แนบเอกสาร', component: Step7Documents },
    { num: 8, title: 'สรุปและส่งเรื่อง', component: Step8Summary }
  ]

  function updateData(key, value){
    setProjectData(prev => ({ ...prev, [key]: value }))
  }

  function canGoNext(){
    switch(currentStep){
      case 1: return projectData.organization !== null
      case 2: return projectData.projectInfo.project_name && projectData.projectInfo.total_budget
      case 3: return projectData.members.length >= 1
      case 4: return projectData.budgetItems.length >= 1
      case 5: return projectData.plans.length >= 1
      case 6: return true // Assets optional
      case 7: return true // Documents optional
      case 8: return true
      default: return false
    }
  }

  function handleNext(){
    if (canGoNext() && currentStep < 8) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  function handlePrevious(){
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  async function handleSaveDraft(){
    // บันทึกร่าง - ไม่ต้องเช็คว่าข้อมูลครบหรือไม่
    // อย่างน้อยต้องเลือกองค์กร
    if (!projectData.organization) {
      alert('กรุณาเลือกองค์กรก่อน')
      return
    }

    // ตรวจสอบให้มีชื่อโครงการและงบประมาณ
    if (!projectData.projectInfo.project_name) {
      alert('กรุณากรอกชื่อโครงการก่อน (ขั้นตอนที่ 2)')
      return
    }
    if (!projectData.projectInfo.total_budget) {
      alert('กรุณากรอกงบประมาณก่อน (ขั้นตอนที่ 2)')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const payload = {
        project_name: projectData.projectInfo.project_name,
        project_description: projectData.projectInfo.project_description,
        organization_id: projectData.organization?.id,
        organization_name: projectData.organization?.name,
        organization_type: projectData.organization?.type,
        province: projectData.organization?.province,
        total_budget: projectData.projectInfo.total_budget,
        objectives: projectData.projectInfo.objectives,
        expected_results: projectData.projectInfo.expected_results,
        start_date: projectData.projectInfo.start_date,
        end_date: projectData.projectInfo.end_date,
        duration_months: projectData.projectInfo.duration_months,
        members: projectData.members.map((m, i) => ({
          member_id: m.id,
          member_name: m.name,
          id_card: m.id_card,
          position: m.position
        })),
        budget_items: projectData.budgetItems.map((item, i) => ({
          item_no: i + 1,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          note: item.note
        })),
        plans: projectData.plans.map((plan, i) => ({
          plan_number: i + 1,
          plan_name: plan.name,
          objectives: plan.objectives,
          activities: plan.activities,
          budget: plan.budget,
          expected_results: plan.expected_results
        }))
      }

      if (editMode && id) {
        // Update existing draft
        await axios.put(`${config.API_URL}/api/projects/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('แก้ไขแบบร่างสำเร็จ')
      } else {
        // Create new draft
        await axios.post(`${config.API_URL}/api/projects`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('บันทึกแบบร่างสำเร็จ')
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Save draft error:', error)
      alert('บันทึกไม่สำเร็จ: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(){
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      // First save the project
      const payload = {
        project_name: projectData.projectInfo.project_name,
        project_description: projectData.projectInfo.project_description,
        organization_id: projectData.organization?.id,
        organization_name: projectData.organization?.name,
        organization_type: projectData.organization?.type,
        province: projectData.organization?.province,
        total_budget: projectData.projectInfo.total_budget,
        objectives: projectData.projectInfo.objectives,
        expected_results: projectData.projectInfo.expected_results,
        start_date: projectData.projectInfo.start_date,
        end_date: projectData.projectInfo.end_date,
        duration_months: projectData.projectInfo.duration_months,
        members: projectData.members.map(m => ({
          member_id: m.id,
          member_name: m.name,
          id_card: m.id_card,
          position: m.position
        })),
        budget_items: projectData.budgetItems.map((item, i) => ({
          item_no: i + 1,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          note: item.note
        })),
        plans: projectData.plans.map((plan, i) => ({
          plan_number: i + 1,
          plan_name: plan.name,
          objectives: plan.objectives,
          activities: plan.activities,
          budget: plan.budget,
          expected_results: plan.expected_results
        }))
      }

      const createRes = await axios.post(`${config.API_URL}/api/projects`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const projectId = createRes.data.data.id

      // Then submit for approval
      await axios.post(`${config.API_URL}/api/projects/${projectId}/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('ส่งโครงการเพื่ออนุมัติสำเร็จ')
      navigate('/dashboard')
    } catch (error) {
      console.error('Submit error:', error)
      alert('ส่งโครงการไม่สำเร็จ: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  const StepComponent = steps[currentStep - 1].component

  if (loading) {
    return (
      <Layout>
        <div className="wizard">
          <div className="wizard-header">
            <h1>กำลังโหลดข้อมูล...</h1>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="wizard">
        <div className="wizard-header">
          <h1>{editMode ? 'แก้ไขโครงการ (ร่าง)' : 'เพิ่มโครงการใหม่'}</h1>
          <div className="progress-bar">
            {steps.map(step => (
              <div 
                key={step.num} 
                className={`progress-step ${currentStep >= step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}
                onClick={() => currentStep > step.num && setCurrentStep(step.num)}
              >
                <div className="step-number">{step.num}</div>
                <div className="step-title">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="wizard-body">
          <StepComponent 
            data={projectData} 
            updateData={updateData}
          />
        </div>

        <div className="wizard-footer">
          <button 
            className="btn secondary" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            ← ย้อนกลับ
          </button>

          <button 
            className="btn" 
            onClick={handleSaveDraft}
            disabled={saving || !canGoNext()}
          >
            บันทึกแบบร่าง
          </button>

          {currentStep < 8 ? (
            <button 
              className="btn primary" 
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              ถัดไป →
            </button>
          ) : (
            <button 
              className="btn success" 
              onClick={handleSubmit}
              disabled={saving || !canGoNext()}
            >
              {saving ? 'กำลังส่ง...' : 'ส่งเรื่องเพื่ออนุมัติ'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
