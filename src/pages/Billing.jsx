import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Row, Col, Modal } from 'react-bootstrap';
import { FiDollarSign, FiCreditCard, FiUsers, FiSend, FiFileText } from 'react-icons/fi';

function Billing() {
  const [billingList, setBillingList] = useState([]);
  const [totalExpected, setTotalExpected] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // לניהול המודל שמציג את פירוט החיוב
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState(null);

  useEffect(() => {
    fetchDataAndCalculate();
  }, []);

  const fetchDataAndCalculate = async () => {
    setIsLoading(true);
    try {
      // מושכים במקביל גם את השיבוצים וגם את המשלמים
      const [placementsRes, payersRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + '/api/placements'),
        fetch(import.meta.env.VITE_API_URL + '/api/payers')
      ]);

      if (placementsRes.ok && payersRes.ok) {
        const placementsData = await placementsRes.json();
        const payersData = await payersRes.json();
        
        // --- מנוע הקיבוץ (Group By) ---
        const grouped = {};
        let totalSum = 0;

        placementsData.forEach(placement => {
          // לוקחים רק שיבוצים פעילים, שיש להם תלמיד, ולתלמיד יש משלם!
          if (placement.status !== 'פעיל' || !placement.student || !placement.student.payer) return;

          const payerId = placement.student.payer;
          const amount = Number(placement.paymentAmount) || 0; // אם אין סכום, נחשב כ-0

          if (!grouped[payerId]) {
            grouped[payerId] = {
              payerId,
              totalAmount: 0,
              studentNames: new Set(),
              placementsList: []
            };
          }

          // מוסיפים את הסכום והנתונים למשלם הספציפי הזה
          grouped[payerId].totalAmount += amount;
          totalSum += amount;
          grouped[payerId].studentNames.add(`${placement.student.firstName} ${placement.student.lastName}`);
          grouped[payerId].placementsList.push(placement);
        });

        // משדכים את התוצאה לשמות האמיתיים של המשלמים מתוך השרת
        const finalList = Object.values(grouped).map(group => {
          const payerObj = payersData.find(p => p._id === group.payerId);
          return {
            ...group,
            studentNamesArray: Array.from(group.studentNames),
            payerName: payerObj ? payerObj.name : 'משלם לא ידוע',
            payerType: payerObj ? payerObj.payerType : 'individual',
            payerPhone: payerObj ? payerObj.phone : ''
          };
        });

        // מסדרים לפי הסכום הגבוה לנמוך
        finalList.sort((a, b) => b.totalAmount - a.totalAmount);
        
        setBillingList(finalList);
        setTotalExpected(totalSum);
      }
    } catch (error) {
      console.error('שגיאה בחישוב הגבייה:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetails = (payerGroup) => {
    setSelectedPayer(payerGroup);
    setShowDetails(true);
  };

  const handleChargeNedarim = (payerName, amount) => {
    // כאן בעתיד נכניס את הקוד שמתחבר ל-API של נדרים פלוס
    alert(`סימולציה: נשלחה בקשת חיוב לנדרים פלוס!\nמשלם: ${payerName}\nסכום: ₪${amount}\n\n(כאן יתבצע החיבור האמיתי לסליקה בעתיד)`);
  };

  return (
    <Container className="mt-5 mb-5" dir="rtl">
      
      {/* כותרת מודרנית */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">ריכוז חיובים חודשי</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">המערכת סורקת את כל השיבוצים הפעילים ומאחדת חיובים אוטומטית לפי משלם</p>
        </div>
        <Button variant="outline-primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={fetchDataAndCalculate}>
          רענן נתונים
        </Button>
      </div>

      {/* כרטיסיות תקציר מודרניות */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={4}>
          <Card className="border-0 h-100 p-3" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}>
            <Card.Body className="d-flex flex-column justify-content-center">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px' }}>
                  <FiDollarSign size={28} />
                </div>
              </div>
              <h6 className="fw-normal mb-1" style={{ color: '#bfdbfe', fontSize: '1.1rem' }}>צפי גבייה כולל לחודש זה</h6>
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

      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          <div className="table-responsive">
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiCreditCard className="me-2" /> שם המשלם</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סוג</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>תלמידים משויכים</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>מס' שיבוצים</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סה"כ לחיוב</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-end">פעולות סליקה</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" style={{ color: '#2563eb' }} /></td></tr>
                ) : billingList.length > 0 ? (
                  billingList.map((item) => (
                    <tr key={item.payerId}>
                      <td className="fw-bold" style={{ color: '#2563eb', padding: '16px 12px', fontSize: '1.05rem' }}>{item.payerName}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span className="rounded-pill d-inline-block text-center" 
                              style={{ 
                                padding: '4px 12px', fontSize: '0.85rem', fontWeight: '600', 
                                backgroundColor: item.payerType === 'organization' ? '#e0f2fe' : '#f1f5f9', 
                                color: item.payerType === 'organization' ? '#0284c7' : '#475569',
                                border: `1px solid ${item.payerType === 'organization' ? '#bae6fd' : '#e2e8f0'}`
                              }}>
                          {item.payerType === 'organization' ? 'ארגון / מוסד' : 'אדם פרטי'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', padding: '16px 12px', maxWidth: '250px' }} className="text-truncate">
                        {item.studentNamesArray.join(', ')}
                      </td>
                      <td style={{ color: '#475569', padding: '16px 12px', fontWeight: '500' }}>{item.placementsList.length} חונכים</td>
                      <td className="fw-bold fs-5" style={{ color: '#059669', padding: '16px 12px' }}>₪{item.totalAmount.toLocaleString()}</td>
                      <td className="text-end" style={{ padding: '16px 12px', minWidth: '220px' }}>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="me-2 rounded-pill shadow-sm" 
                          style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 16px', fontWeight: '600' }} 
                          onClick={() => handleShowDetails(item)}
                        >
                          <FiFileText className="me-1" /> פירוט
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="rounded-pill shadow-sm d-inline-flex align-items-center justify-content-center" 
                          style={{ padding: '6px 16px', fontWeight: '600' }} 
                          onClick={() => handleChargeNedarim(item.payerName, item.totalAmount)}
                        >
                          <FiSend className="me-2" /> חייב עכשיו
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <div className="mb-3"><FiDollarSign size={40} className="opacity-25" /></div>
                      <h5 style={{ color: '#64748b' }}>לא נמצאו חיובים החודש</h5>
                      <p className="small mb-0">ודא שיש שיבוצים פעילים עם סכום, ושהתלמידים משויכים למשלם.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* מודל פירוט חיוב - מעוצב מחדש כקבלה דיגיטלית */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" dir="rtl" centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>
            פירוט חיוב למשלם
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0" style={{ backgroundColor: '#f1f5f9' }}>
          {selectedPayer && (
            <div className="p-4">
              {/* כותרת הקבלה */}
              <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-white rounded-4 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
                <div>
                  <h4 className="fw-bold mb-1" style={{ color: '#2563eb' }}>{selectedPayer.payerName}</h4>
                  <div style={{ color: '#64748b' }}>סך חיובים מרוכזים: {selectedPayer.placementsList.length} שיבוצים</div>
                </div>
                <div className="text-end">
                  <div className="small fw-bold text-muted mb-1">סה"כ לתשלום</div>
                  <h2 className="fw-bold mb-0" style={{ color: '#059669' }}>₪{selectedPayer.totalAmount.toLocaleString()}</h2>
                </div>
              </div>

              {/* טבלת הפירוט הפנימית */}
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Table hover className="mb-0 align-middle">
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>תלמיד</th>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>חונך מלווה</th>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>סוג תשלום</th>
                      <th style={{ color: '#64748b', fontWeight: '600', padding: '16px', borderBottom: '1px solid #e2e8f0' }} className="text-end">סכום שחויב</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayer.placementsList.map((p, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold" style={{ color: '#0f172a', padding: '16px' }}>{p.student.firstName} {p.student.lastName}</td>
                        <td style={{ color: '#475569', padding: '16px' }}>{p.tutor ? `${p.tutor.firstName} ${p.tutor.lastName}` : 'לא צוין'}</td>
                        <td style={{ padding: '16px' }}>
                          <span className="badge bg-light text-secondary border" style={{ fontWeight: '500' }}>{p.paymentMethod}</span>
                        </td>
                        <td className="text-end fw-bold" style={{ color: '#059669', padding: '16px', fontSize: '1.1rem' }}>₪{p.paymentAmount || 0}</td>
                      </tr>
                    ))}
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