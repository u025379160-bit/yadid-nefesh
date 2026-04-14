import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Row, Col, Modal, Badge } from 'react-bootstrap';
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
    <Container className="mt-4" dir="rtl">
      
      <div className="mb-4 text-center">
        <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-2">ריכוז חיובים חודשי</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          המערכת סורקת את כל השיבוצים הפעילים ומאחדת חיובים אוטומטית לפי משלם.
        </p>
      </div>

      <Row className="g-4 mb-4 justify-content-center">
        <Col md={5}>
          <Card className="border-0 shadow-sm text-center h-100" style={{ backgroundColor: 'var(--primary-blue)', color: 'white' }}>
            <Card.Body className="py-4">
              <FiDollarSign size={32} className="mb-2 opacity-75" />
              <h5 className="fw-normal opacity-75">צפי גבייה כולל לחודש זה</h5>
              <h1 className="fw-bold display-4 mb-0">₪{totalExpected.toLocaleString()}</h1>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <FiUsers size={32} color="var(--primary-accent)" className="mb-2" />
              <h5 className="text-muted fw-normal">משלמים לחיוב</h5>
              <h1 style={{ color: 'var(--text-main)' }} className="fw-bold display-4 mb-0">{billingList.length}</h1>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th><FiCreditCard className="me-2" /> שם המשלם</th>
                  <th>סוג</th>
                  <th>תלמידים משויכים</th>
                  <th>מס' שיבוצים</th>
                  <th>סה"כ לחיוב</th>
                  <th className="text-end">פעולות סליקה</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                ) : billingList.length > 0 ? (
                  billingList.map((item) => (
                    <tr key={item.payerId}>
                      <td className="fw-bold" style={{ color: 'var(--primary-accent)' }}>{item.payerName}</td>
                      <td>
                        <Badge bg={item.payerType === 'organization' ? 'info' : 'light'} text={item.payerType === 'organization' ? 'white' : 'dark'} className="border">
                          {item.payerType === 'organization' ? 'ארגון/מוסד' : 'אדם פרטי'}
                        </Badge>
                      </td>
                      <td className="text-muted small">
                        {item.studentNamesArray.join(', ')}
                      </td>
                      <td className="text-muted">{item.placementsList.length} חונכים</td>
                      <td className="fw-bold text-success fs-5">₪{item.totalAmount}</td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="me-2 border text-primary" onClick={() => handleShowDetails(item)}>
                          <FiFileText className="me-1" /> פירוט
                        </Button>
                        <Button variant="primary" size="sm" className="fw-bold shadow-sm" onClick={() => handleChargeNedarim(item.payerName, item.totalAmount)}>
                          <FiSend className="me-1" /> חייב עכשיו
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">לא נמצאו חיובים החודש. ודא שיש שיבוצים פעילים עם סכום, ושהתלמידים משויכים למשלם.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* מודל פירוט חיוב */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>
            פירוט חיוב עבור: <span className="text-primary">{selectedPayer?.payerName}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          {selectedPayer && (
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body>
                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">מרכיבי החיוב (סה"כ ₪{selectedPayer.totalAmount})</h6>
                <Table size="sm" borderless hover>
                  <thead className="text-muted border-bottom">
                    <tr>
                      <th>תלמיד</th>
                      <th>חונך</th>
                      <th>סוג תשלום</th>
                      <th className="text-end">סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayer.placementsList.map((p, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td className="fw-bold">{p.student.firstName} {p.student.lastName}</td>
                        <td>{p.tutor ? `${p.tutor.firstName} ${p.tutor.lastName}` : 'לא צוין'}</td>
                        <td className="text-muted small">{p.paymentMethod}</td>
                        <td className="text-end fw-bold text-success">₪{p.paymentAmount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                <div className="d-flex justify-content-end mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Button variant="light" onClick={() => setShowDetails(false)} className="border text-muted fw-bold px-4">סגור</Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Billing;