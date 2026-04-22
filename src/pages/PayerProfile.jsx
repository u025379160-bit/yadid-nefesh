import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, Spinner, Modal, Form } from 'react-bootstrap';
import { FiArrowRight, FiEdit2, FiCreditCard, FiUser, FiInfo, FiFileText } from 'react-icons/fi';

function PayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payer, setPayer] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payersRes, studentsRes, placementsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/payers`),
        fetch(`${import.meta.env.VITE_API_URL}/api/students`),
        fetch(`${import.meta.env.VITE_API_URL}/api/placements`)
      ]);

      if (payersRes.ok) {
        const allPayers = await payersRes.json();
        const foundPayer = allPayers.find(p => p._id === id);
        
        if (foundPayer) {
          setPayer(foundPayer);
          setFormData(foundPayer);
        }
      }

      let relevantStudents = [];
      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();
        relevantStudents = allStudents.filter(s => s.payer?._id === id || s.payer === id);
        setLinkedStudents(relevantStudents);
      }

      if (placementsRes.ok) {
        const allPlacements = await placementsRes.json();
        const studentIds = relevantStudents.map(s => s._id);
        const relevantPlacements = allPlacements.filter(p => p.student && studentIds.includes(p.student._id));
        setPlacements(relevantPlacements);
      }

    } catch (error) {
      console.error('שגיאה בשליפת נתוני משלם:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdatePayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert('פרטי המשלם עודכנו בהצלחה!');
        setShowEditModal(false);
        fetchData();
      } else {
        alert('שגיאה בעדכון המשלם');
      }
    } catch (error) {
      alert('שגיאת תקשורת עם השרת');
    }
  };

  const getStudentCostForMonth = (studentId) => {
    const studentPlacements = placements.filter(p => p.student._id === studentId);
    return studentPlacements.reduce((sum, p) => {
      if (!p.startDate) return sum;
      const pDate = new Date(p.startDate);
      const [sYear, sMonth] = selectedMonth.split('-').map(Number);
      const isActive = (pDate.getFullYear() < sYear || (pDate.getFullYear() === sYear && pDate.getMonth() + 1 <= sMonth)) && p.status !== 'לא פעיל';
      return isActive ? sum + (Number(p.paymentAmount) || 0) : sum;
    }, 0);
  };

  const totalMonthlyCost = linkedStudents.reduce((sum, student) => sum + getStudentCostForMonth(student._id), 0);

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: '#2563eb'}} /></Container>;
  if (!payer) return <Container className="mt-5 text-center"><h3>משלם לא נמצא 😕</h3></Container>;

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="border shadow-sm text-muted p-2" onClick={() => navigate('/payers')} title="חזרה לרשימת משלמים">
            <FiArrowRight size={20} />
          </Button>
          <div>
            <h3 style={{ color: '#0f172a', fontWeight: '800' }} className="mb-0">
              {payer.name}
            </h3>
            <p className="text-muted mb-0">כרטיס משלם (ארנק חיוב)</p>
          </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold rounded-pill" onClick={() => setShowEditModal(true)}>
          <FiEdit2 /> ערוך פרטי גבייה
        </Button>
      </div>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4 p-md-5">
              <Row className="g-4">
                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiInfo /> פרטי הגורם המשלם
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="text-muted d-block">תעודת זהות / ח.פ</small><span className="fw-bold fs-5">{payer.identifier}</span></div>
                    <div><small className="text-muted d-block">סוג</small><span className="fw-bold">{payer.payerType === 'individual' ? 'אדם פרטי (הורה)' : 'ארגון / מוסד'}</span></div>
                    <div><small className="text-muted d-block">טלפון ליצירת קשר</small><span className="fw-bold" dir="ltr">{payer.phone || 'לא הוזן'}</span></div>
                    <div><small className="text-muted d-block">אימייל לקבלות</small><span className="fw-bold">{payer.email || 'לא הוזן'}</span></div>
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiCreditCard /> הגדרות גבייה
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="text-muted d-block mb-1">אמצעי תשלום ראשי</small>
                      <Badge bg={payer.paymentMethod === 'credit_card' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill fs-6">
                        {payer.paymentMethod === 'credit_card' ? '💳 כרטיס אשראי (נדרים פלוס)' : payer.paymentMethod === 'bank_transfer' ? '🏦 העברה בנקאית' : payer.paymentMethod}
                      </Badge>
                    </div>
                    {payer.receiptNotes && (
                      <div>
                        <small className="text-muted d-block">טקסט להדפסה על קבלה</small>
                        <div className="p-2 bg-light rounded border mt-1">
                          <span className="text-muted fw-bold">{payer.receiptNotes}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <small className="text-muted d-block">הערות פנימיות</small>
                      <div className="p-2 bg-light rounded border mt-1">
                        <span className="text-muted">{payer.notes || 'אין הערות פנימיות.'}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center text-center">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <span className="fw-bold text-muted small">סיכום חודש חיוב:</span>
                <Form.Control
                  type="month"
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '140px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>
              <div className="mb-3 mx-auto shadow-sm" style={{ backgroundColor: '#e0f2fe', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <FiFileText size={28} />
              </div>
              <h6 className="fw-bold text-muted mb-2">סה"כ לחיוב בחודש זה</h6>
              <h1 className="display-4 fw-bold mb-1" style={{ color: '#0f172a' }}>
                ₪{totalMonthlyCost.toLocaleString()}
              </h1>
              <p className="text-muted small mb-0">עבור {linkedStudents.length} תלמידים משויכים</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4">
          <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: '#0f172a' }}>
            <FiUser className="text-primary" /> ממה מורכב סכום החיוב? (פירוט תלמידים)
          </h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Table hover className="align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 rounded-start text-muted">שם התלמיד</th>
                <th className="border-0 text-muted">תעודת זהות</th>
                <th className="border-0 text-muted">סכום חיוב החודש</th>
                <th className="text-end border-0 rounded-end text-muted">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {linkedStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">אין תלמידים שמשויכים למשלם זה כרגע.</td>
                </tr>
              ) : (
                linkedStudents.map((student) => {
                  const cost = getStudentCostForMonth(student._id);
                  return (
                    <tr key={student._id}>
                      <td className="fw-bold text-primary" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/${student._id}`)}>{student.firstName} {student.lastName}</td>
                      <td className="text-muted">{student.idNumber}</td>
                      <td className="fw-bold" style={{ color: cost > 0 ? '#0f172a' : '#94a3b8' }}>
                        ₪{cost.toLocaleString()}
                      </td>
                      <td className="text-end">
                        <Button 
                          variant="light" 
                          size="sm"
                          className="rounded-pill border shadow-sm fw-bold px-3"
                          onClick={() => navigate(`/student/${student._id}`)}
                        >
                          לפרופיל תלמיד
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* חלון עריכת משלם המעוצב שלנו */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" dir="rtl" backdrop="static">
        
        {/* כותרת מותאמת אישית שדוחפת את האיקס שמאלה */}
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>עריכת פרטי משלם</h4>
          <button type="button" onClick={() => setShowEditModal(false)} className="btn-close" aria-label="Close" style={{ margin: 0 }}></button>
        </div>

        <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleUpdatePayer}>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>סוג המשלם *</Form.Label>
                  <Form.Select name="payerType" value={formData.payerType || 'individual'} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <option value="individual">אדם פרטי (הורה)</option>
                    <option value="organization">ארגון / עמותה / מוסד</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>אמצעי תשלום מועדף</Form.Label>
                  <Form.Select name="paymentMethod" value={formData.paymentMethod || 'credit_card'} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <option value="credit_card">כרטיס אשראי (נדרים פלוס)</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="standing_order">הוראת קבע</option>
                    <option value="check">צ'ק</option>
                    <option value="cash">מזומן</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם מלא / שם המוסד *</Form.Label>
                  <Form.Control type="text" name="name" required value={formData.name || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>ת.ז / ח.פ / ע.מ *</Form.Label>
                  <Form.Control type="text" name="identifier" required value={formData.identifier || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטי התקשרות</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>טלפון נייד</Form.Label>
                  <Form.Control type="text" name="phone" value={formData.phone || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>אימייל למשלוח קבלות</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>

            {/* הגדרות נדרים פלוס לקבלה */}
            <h6 className="fw-bold pb-2 mb-3 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הגדרות קבלה (נדרים פלוס)</h6>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>טקסט להדפסה על הקבלה (הקדשה / עבור מי)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    name="receiptNotes" 
                    value={formData.receiptNotes || ''}
                    onChange={handleChange}
                    placeholder="לדוגמה: תרומת משפחת כהן לעילוי נשמת... / עבור שכר לימוד של משה"
                    style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} 
                  />
                  <Form.Text className="text-muted small">
                    טקסט זה יצורף אוטומטית לקבלה שתופק במערכת נדרים פלוס.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הערות למנהל</h6>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>הערות פנימיות (יצוץ בדוחות)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    name="notes" 
                    value={formData.notes || ''}
                    onChange={handleChange}
                    style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} 
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* אזור הזנת אשראי שמופיע רק אם בחרו אשראי */}
            {formData.paymentMethod === 'credit_card' && (
              <>
                <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הזנת פרטי אשראי</h6>
                <div className="p-4 rounded-4 mb-4 text-center shadow-sm" style={{ backgroundColor: '#f0fdf4', border: '1px dashed #22c55e' }}>
                  <p className="mb-3 text-success fw-bold" style={{ fontSize: '1.05rem' }}>המערכת מוכנה לעדכון כרטיס אשראי</p>
                  <Button 
                    variant="success" 
                    className="rounded-pill shadow-sm px-4 py-2" 
                    style={{ fontWeight: '600' }}
                    onClick={(e) => {
                      e.preventDefault();
                      alert('כאן יפתח בעתיד iFrame מאובטח של נדרים פלוס להזנת כרטיס אשראי שמקושר למשלם זה.');
                    }}
                  >
                    💳 הוסף / החלף כרטיס אשראי
                  </Button>
                  <p className="small text-muted mt-3 mb-0">
                    הפרטים נשמרים בצורה מאובטחת ומוצפנת בשרתי נדרים פלוס (באמצעות טוקן).
                  </p>
                </div>
              </>
            )}

            <div className="d-flex justify-content-end pt-4 mt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button variant="light" onClick={() => setShowEditModal(false)} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>שמור שינויים</Button>
            </div>
            
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default PayerProfile;