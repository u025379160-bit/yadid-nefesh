import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Row, Col, Modal, InputGroup, Form, Badge } from 'react-bootstrap';
import { FiDollarSign, FiCreditCard, FiUsers, FiSend, FiFileText, FiSearch, FiCalendar, FiCheckCircle } from 'react-icons/fi';

function Billing() {
  const [billingList, setBillingList] = useState([]);
  const [totalExpected, setTotalExpected] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showDetails, setShowDetails] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState(null);

  // סטייט עבור תיבות סימון (V) לפעולות קבוצתיות
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchBillingRecords();
  }, [selectedMonth]);

  const fetchBillingRecords = async () => {
    setIsLoading(true);
    setSelectedIds([]); // איפוס בחירות במעבר חודש
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        processRecords(data);
      }
    } catch (error) {
      console.error('שגיאה בשליפת הגבייה:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // פעולה יזומה - יצירת טבלת הגבייה לחודש ונעילת המלגות
  const handleGenerateBilling = async () => {
    if(!window.confirm(`שים לב! יצירת טבלת הגבייה תנעל סופית את טבלת המלגות לחודש ${selectedMonth}. לא יהיה ניתן לעדכן שינויים. האם להמשיך?`)) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });
      
      if (response.ok) {
        fetchBillingRecords(); // רענון הטבלה
      } else {
        const errorData = await response.json();
        alert(`שגיאה: ${errorData.error || 'הטבלה כבר נוצרה'}`);
      }
    } catch (error) {
      console.error('שגיאה ביצירת הגבייה:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // עיבוד הנתונים שהגיעו מהשרת
  const processRecords = (records) => {
    const grouped = {};
    let totalSum = 0;

    records.forEach(record => {
      if (!record.payer) return;

      const payerId = record.payer._id;
      const amount = record.totalAmount || 0;

      if (!grouped[payerId]) {
        grouped[payerId] = {
          payerId,
          payerName: record.payer.name || 'משלם לא ידוע',
          payerType: record.payer.payerType || 'individual',
          totalAmount: 0,
          carriedBalance: 0,
          studentNames: new Set(),
          recordsList: [] 
        };
      }

      grouped[payerId].totalAmount += amount;
      grouped[payerId].carriedBalance += (record.carriedBalance || 0);
      totalSum += amount;
      
      // איסוף שמות התלמידים מתוך רשימת השיבוצים המקושרת (includedPlacements)
      if (record.includedPlacements && record.includedPlacements.length > 0) {
        record.includedPlacements.forEach(placement => {
           if(placement.student) {
             grouped[payerId].studentNames.add(`${placement.student.firstName} ${placement.student.lastName}`);
           }
        });
      }
      
      grouped[payerId].recordsList.push(record);
    });

    const finalList = Object.values(grouped).map(group => ({
      ...group,
      studentNamesArray: Array.from(group.studentNames)
    }));

    finalList.sort((a, b) => b.totalAmount - a.totalAmount);
    setBillingList(finalList);
    setTotalExpected(totalSum);
  };

  // ניהול צ'קבוקסים
  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(billingList.map(item => item.payerId));
    } else {
      setSelectedIds([]);
    }
  };

  // פעולה קבוצתית לשינוי סטטוס
  const handleMarkAsPaid = async () => {
    if (selectedIds.length === 0) return;
    
    // מכינים רשימה של ה- IDs האמיתיים של רשומות החיוב (לא של המשלמים)
    const recordIdsToUpdate = [];
    billingList.forEach(group => {
      if(selectedIds.includes(group.payerId)) {
        group.recordsList.forEach(record => recordIdsToUpdate.push(record._id));
      }
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/bulk-pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: recordIdsToUpdate, isPaid: true })
      });
      if (response.ok) {
        fetchBillingRecords(); 
      }
    } catch (error) {
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const handleShowDetails = (payerGroup) => {
    setSelectedPayer(payerGroup);
    setShowDetails(true);
  };

  const handleChargeNedarim = (payerName, amount) => {
    alert(`סימולציה: מעבר לנדרים פלוס לחיוב מיידי!\nמשלם: ${payerName}\nסכום: ₪${amount}`);
  };

  const filteredBillingList = billingList.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.payerName.toLowerCase().includes(searchLower) ||
      item.studentNamesArray.some(studentName => studentName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Container className="mt-5 mb-5" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">ניהול גבייה</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">חיוב משלמים, יתרות עבר וחיבור לנדרים פלוס</p>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <Button 
            variant="primary" 
            className="rounded-pill fw-bold shadow-sm"
            onClick={handleGenerateBilling}
            disabled={isGenerating}
          >
            {isGenerating ? <Spinner size="sm" animation="border" /> : 'הפק טבלת גבייה ונעל מלגות'}
          </Button>

          <div className="d-flex align-items-center gap-2 bg-white p-2 rounded-pill shadow-sm border">
            <span className="fw-bold text-muted small ms-2 ps-2 border-start d-flex align-items-center gap-1">
              <FiCalendar /> חודש:
            </span>
            <Form.Control
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none', boxShadow: 'none', backgroundColor: 'transparent' }}
            />
          </div>
        </div>
      </div>

      <Row className="g-4 mb-5">
        <Col md={6} lg={4}>
          <Card className="border-0 h-100 p-3" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}>
            <Card.Body className="d-flex flex-column justify-content-center">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px' }}>
                  <FiDollarSign size={28} />
                </div>
              </div>
              <h6 className="fw-normal mb-1" style={{ color: '#bfdbfe', fontSize: '1.1rem' }}>צפי גבייה ({selectedMonth})</h6>
              <h1 className="fw-bold mb-0" style={{ fontSize: '3rem', letterSpacing: '-1px' }}>₪{totalExpected.toLocaleString()}</h1>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card className="border-0 h-100 p-3" style={{ borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Body className="d-flex flex-column justify-content-center">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '16px', color: '#64748b' }}>
                  <FiUsers size={28} />
                </div>
              </div>
              <h6 className="fw-bold mb-1" style={{ color: '#64748b', fontSize: '1.1rem' }}>סך משלמים לחיוב</h6>
              <h1 className="fw-bold mb-0" style={{ color: '#0f172a', fontSize: '3rem', letterSpacing: '-1px' }}>{billingList.length}</h1>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* אזור פעולות קבוצתיות */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-light rounded border d-flex align-items-center justify-content-between shadow-sm">
          <span className="fw-bold text-primary">{selectedIds.length} משלמים נבחרו</span>
          <Button variant="success" className="rounded-pill fw-bold" onClick={handleMarkAsPaid}>
            <FiCheckCircle className="me-2" /> סמן כ"בוצע / שולם"
          </Button>
        </div>
      )}

      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          
          <div className="mb-4" style={{ maxWidth: '400px' }}>
            <InputGroup className="shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <InputGroup.Text style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                <FiSearch color="#94a3b8" />
              </InputGroup.Text>
              <Form.Control
                placeholder="חיפוש משלם או תלמיד..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRight: 'none', boxShadow: 'none', padding: '10px' }}
              />
            </InputGroup>
          </div>

          <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', padding: '16px 12px', position: 'sticky', top: 0, borderBottom: '2px solid #e2e8f0' }}>
                    <Form.Check type="checkbox" onChange={toggleAll} checked={billingList.length > 0 && selectedIds.length === billingList.length} />
                  </th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '16px 12px', position: 'sticky', top: 0, borderBottom: '2px solid #e2e8f0' }}>שם המשלם</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '16px 12px', position: 'sticky', top: 0, borderBottom: '2px solid #e2e8f0' }}>תלמידים משויכים</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '16px 12px', position: 'sticky', top: 0, borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>פרטי אשראי</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '16px 12px', position: 'sticky', top: 0, borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>בסיס + חובות עבר</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '16px 12px', position: 'sticky', top: 0, borderBottom: '2px solid #e2e8f0' }} className="text-end">סה"כ לחיוב</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '16px 12px', position: 'sticky', top: 0, borderBottom: '2px solid #e2e8f0' }} className="text-end">פעולות סליקה</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" style={{ color: '#2563eb' }} /></td></tr>
                ) : filteredBillingList.length > 0 ? (
                  filteredBillingList.map((item) => {
                    const isSelected = selectedIds.includes(item.payerId);
                    // נבדוק האם כל סעיפי החיוב שולמו
                    const allPaid = item.recordsList.every(r => r.isPaid);

                    return (
                      <tr key={item.payerId} className={isSelected ? 'bg-light' : ''}>
                        <td className="px-3">
                          <Form.Check type="checkbox" checked={isSelected} onChange={() => toggleSelection(item.payerId)} />
                        </td>
                        <td className="fw-bold" style={{ color: '#2563eb', padding: '16px 12px', fontSize: '1.05rem' }}>{item.payerName}</td>
                        <td style={{ color: '#64748b', padding: '16px 12px', maxWidth: '200px' }} className="text-truncate">
                          {item.studentNamesArray.join(', ')}
                        </td>
                        <td className="text-center" style={{ padding: '16px 12px' }}>
                           <Button variant="link" className="text-muted p-0" title="אשראי מסתיים ב-4567 (תוקף 12/26)"><FiCreditCard size={20}/></Button>
                        </td>
                        <td className="text-center text-muted" style={{ padding: '16px 12px' }}>
                          ₪{item.totalAmount.toLocaleString()}
                          {item.carriedBalance > 0 && <Badge bg="danger" className="ms-2">כולל חוב</Badge>}
                        </td>
                        <td className="text-end fw-bold fs-5" style={{ color: '#059669', padding: '16px 12px' }}>₪{item.totalAmount.toLocaleString()}</td>
                        <td className="text-end" style={{ padding: '16px 12px', minWidth: '260px' }}>
                          {allPaid ? (
                            <Badge bg="success" className="px-3 py-2 rounded-pill shadow-sm fs-6 me-2"><FiCheckCircle className="me-1"/>שולם</Badge>
                          ) : (
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="rounded-pill shadow-sm d-inline-flex align-items-center justify-content-center me-2" 
                              style={{ padding: '6px 16px', fontWeight: '600' }} 
                              onClick={() => handleChargeNedarim(item.payerName, item.totalAmount)}
                            >
                              <FiSend className="me-2" /> סליקה בנדרים
                            </Button>
                          )}
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="rounded-pill shadow-sm" 
                            style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 16px', fontWeight: '600' }} 
                            onClick={() => handleShowDetails(item)}
                          >
                            <FiFileText className="me-1" /> פירוט
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="mb-3"><FiDollarSign size={40} className="opacity-25" /></div>
                      <h5 style={{ color: '#64748b' }}>לא נמצאו חיובים לחודש {selectedMonth}</h5>
                      <p className="small mb-0">לחץ על הפקת הטבלה למעלה, או ודא שיש שיבוצים פעילים.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* מודל פירוט חיוב חכם */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" dir="rtl" centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>
            פירוט חיוב - חודש {selectedMonth}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0" style={{ backgroundColor: '#f1f5f9' }}>
          {selectedPayer && (
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-white rounded-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
                <div>
                  <h4 className="fw-bold mb-1" style={{ color: '#2563eb' }}>{selectedPayer.payerName}</h4>
                  <div style={{ color: '#64748b' }}>סך חיובים מרוכזים: {selectedPayer.recordsList.length} סעיפים</div>
                </div>
                <div className="text-end">
                  <div className="small fw-bold text-muted mb-1">סה"כ לתשלום</div>
                  <h2 className="fw-bold mb-0" style={{ color: '#059669' }}>₪{selectedPayer.totalAmount.toLocaleString()}</h2>
                </div>
              </div>

              <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Table hover className="mb-0 align-middle">
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>תלמיד</th>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>הסבר (פירוט)</th>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>סטטוס פנימי</th>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }} className="text-end">סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayer.recordsList.map((record, idx) => {
                      const studentName = record.includedPlacements?.[0]?.student ? `${record.includedPlacements[0].student.firstName} ${record.includedPlacements[0].student.lastName}` : 'מרכז';
                      
                      return (
                        <tr key={idx}>
                          <td className="fw-bold" style={{ color: '#0f172a', padding: '16px' }}>{studentName}</td>
                          <td style={{ color: '#475569', padding: '16px' }}>
                            {record.amountBreakdown?.map((b, i) => (
                              <div key={i} className={b.amount > 0 ? "text-danger" : "text-success"}>
                                {b.description}: ₪{b.amount}
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {record.isPaid ? 
                              <span className="badge bg-success">שולם</span> : 
                              <span className="badge bg-warning text-dark">ממתין לתשלום</span>
                            }
                          </td>
                          <td className="text-end fw-bold" style={{ color: '#059669', padding: '16px', fontSize: '1.1rem' }}>₪{record.totalAmount.toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </Card>

              <div className="d-flex justify-content-end mt-4">
                <Button variant="light" onClick={() => setShowDetails(false)} className="rounded-pill shadow-sm" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #cbd5e1', padding: '8px 24px' }}>
                  סגור פירוט
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Billing;