import React, { useState, useEffect } from 'react'

export default function Step4Budget({ data, updateData }){
  const [items, setItems] = useState(data.budgetItems || [])

  useEffect(() => {
    updateData('budgetItems', items)
  }, [items])

  function addItem(){
    setItems(prev => [...prev, {
      name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      note: ''
    }])
  }

  function removeItem(index){
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index, field, value){
    setItems(prev => {
      const newItems = [...prev]
      newItems[index][field] = value
      
      // Auto calculate total
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price
      }
      
      return newItems
    })
  }

  const totalBudget = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0)

  return (
    <div className="step-content">
      <h2>ขั้นตอนที่ 4: รายละเอียดงบประมาณ</h2>
      <p className="step-description">กรอกรายการค่าใช้จ่ายของโครงการ</p>

      <div className="budget-table">
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รายการ</th>
              <th>จำนวน</th>
              <th>ราคา/หน่วย</th>
              <th>รวมเป็นเงิน</th>
              <th>หมายเหตุ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">ยังไม่มีรายการ</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input 
                      type="text"
                      value={item.name}
                      onChange={e => updateItem(index, 'name', e.target.value)}
                      placeholder="ชื่อรายการ"
                    />
                  </td>
                  <td>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number"
                      value={item.unit_price}
                      onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      style={{ width: '100px' }}
                    />
                  </td>
                  <td className="text-right">{item.total_price.toLocaleString()}</td>
                  <td>
                    <input 
                      type="text"
                      value={item.note}
                      onChange={e => updateItem(index, 'note', e.target.value)}
                      placeholder="หมายเหตุ"
                    />
                  </td>
                  <td>
                    <button className="btn-icon danger" onClick={() => removeItem(index)}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="text-right"><strong>รวมทั้งสิ้น:</strong></td>
              <td className="text-right"><strong>{totalBudget.toLocaleString()} บาท</strong></td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button className="btn secondary" onClick={addItem}>+ เพิ่มรายการ</button>

      {items.length < 1 && (
        <div className="warning-box">⚠️ กรุณาเพิ่มรายการงบประมาณอย่างน้อย 1 รายการ</div>
      )}
    </div>
  )
}
