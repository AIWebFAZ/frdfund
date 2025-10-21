import React, { useState, useEffect } from 'react'

export default function Step7Documents({ data, updateData }){
  const [documents, setDocuments] = useState(data.documents || [])

  useEffect(() => {
    updateData('documents', documents)
  }, [documents])

  function handleFileSelect(type, event){
    const files = Array.from(event.target.files)
    
    files.forEach(file => {
      // In real implementation, upload file to server
      // For now, just store file info
      setDocuments(prev => [...prev, {
        type,
        name: file.name,
        size: file.size,
        file: file // This would be replaced with uploaded URL
      }])
    })
  }

  function removeDocument(index){
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const docTypes = [
    { id: 'proposal', label: 'เอกสารข้อเสนอโครงการ', required: true },
    { id: 'budget', label: 'แผนงบประมาณ', required: true },
    { id: 'member_list', label: 'รายชื่อสมาชิก', required: false },
    { id: 'asset_proof', label: 'หลักฐานทรัพย์สิน/หนี้สิน', required: false },
    { id: 'other', label: 'เอกสารอื่นๆ', required: false }
  ]

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 7: แนบเอกสารประกอบ</h2>
      <p className="step-description">อัพโหลดเอกสารที่เกี่ยวข้องกับโครงการ</p>

      <div className="document-upload">
        {docTypes.map(docType => (
          <div key={docType.id} className="upload-section">
            <h4>
              {docType.label} 
              {docType.required && <span className="required">*</span>}
            </h4>
            
            <div className="file-input-wrapper">
              <input 
                type="file"
                id={`file-${docType.id}`}
                onChange={e => handleFileSelect(docType.id, e)}
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <label htmlFor={`file-${docType.id}`} className="btn secondary">
                📎 เลือกไฟล์
              </label>
              <span className="file-hint">รองรับ: PDF, Word, Excel, รูปภาพ (สูงสุด 10MB)</span>
            </div>

            <div className="uploaded-files">
              {documents
                .filter(doc => doc.type === docType.id)
                .map((doc, index) => (
                  <div key={index} className="file-item">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{doc.name}</span>
                    <span className="file-size">({(doc.size / 1024).toFixed(1)} KB)</span>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => removeDocument(documents.indexOf(doc))}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="info-box">
        💡 ขั้นตอนนี้เป็นการแนบเอกสารเสริม สามารถข้ามไปขั้นตอนถัดไปได้
      </div>
    </div>
  )
}
