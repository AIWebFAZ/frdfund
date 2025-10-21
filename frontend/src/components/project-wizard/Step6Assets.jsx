import React, { useState, useEffect } from 'react'

export default function Step6Assets({ data, updateData }){
  const [assetType, setAssetType] = useState('corporate')
  const [assets, setAssets] = useState(data.assets || {
    type: 'corporate',
    total_assets: 0,
    total_liabilities: 0,
    asset_details: '',
    liability_details: ''
  })

  useEffect(() => {
    updateData('assets', assets)
  }, [assets])

  function handleChange(field, value){
    setAssets(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 6: สินทรัพย์และหนี้สิน</h2>
      <p className="step-description">กรอกข้อมูลสินทรัพย์และภาระหนี้สินขององค์กร</p>

      <div className="tabs">
        <button 
          className={assetType === 'corporate' ? 'tab active' : 'tab'}
          onClick={() => { setAssetType('corporate'); handleChange('type', 'corporate') }}
        >
          นิติบุคคล
        </button>
        <button 
          className={assetType === 'non-corporate' ? 'tab active' : 'tab'}
          onClick={() => { setAssetType('non-corporate'); handleChange('type', 'non-corporate') }}
        >
          ไม่เป็นนิติบุคคล
        </button>
      </div>

      <div className="asset-form">
        <div className="form-row">
          <div className="form-group">
            <label>ยอดรวมทรัพย์สิน (บาท)</label>
            <input 
              type="number"
              value={assets.total_assets}
              onChange={e => handleChange('total_assets', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>ยอดรวมหนี้สิน (บาท)</label>
            <input 
              type="number"
              value={assets.total_liabilities}
              onChange={e => handleChange('total_liabilities', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-group">
          <label>รายละเอียดทรัพย์สิน</label>
          <textarea 
            value={assets.asset_details}
            onChange={e => handleChange('asset_details', e.target.value)}
            placeholder="ระบุรายละเอียดทรัพย์สิน เช่น ที่ดิน อาคาร เครื่องจักร ฯลฯ"
            rows="5"
          />
        </div>

        <div className="form-group">
          <label>รายละเอียดหนี้สิน</label>
          <textarea 
            value={assets.liability_details}
            onChange={e => handleChange('liability_details', e.target.value)}
            placeholder="ระบุรายละเอียดหนี้สิน เช่น เงินกู้ หนี้บุคคล หนี้สถาบัน ฯลฯ"
            rows="5"
          />
        </div>

        <div className="summary-box">
          <h4>สรุปฐานะการเงิน</h4>
          <p>ทรัพย์สิน: <strong>{assets.total_assets.toLocaleString()} บาท</strong></p>
          <p>หนี้สิน: <strong>{assets.total_liabilities.toLocaleString()} บาท</strong></p>
          <p>สินทรัพย์สุทธิ: <strong>{(assets.total_assets - assets.total_liabilities).toLocaleString()} บาท</strong></p>
        </div>
      </div>

      <div className="info-box">
        💡 ขั้นตอนนี้เป็นข้อมูลเสริม สามารถข้ามไปขั้นตอนถัดไปได้
      </div>
    </div>
  )
}
