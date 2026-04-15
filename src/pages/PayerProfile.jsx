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
      // מביא את המשלם, כל התלמידים וכל השיבוצים
      const [payerRes, studentsRes, placementsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/payers/${id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/students`),
        fetch(`${import.meta.env.VITE_API_URL}/api/placements`)
      ]);

      if (payerRes.ok) {
        const payerData = await payerRes.json();
        setPayer(payerData);
        setFormData(payerData);
      }

      let relevantStudents = [];
      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();
        // מוצא רק תלמידים שמשויכים למשלם הזה
        relevantStudents = allStudents.filter(s => s.payer?._id === id || s.payer === id);
        setLinkedStudents(relevantStudents);
      }

      if (placementsRes.ok) {
        const allPlacements = await placementsRes.json();
        // מוצא רק שיבוצים של התלמידים שקשורים למשלם הזה
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

  // חישוב העלות לכל תלמיד בחודש הנבחר
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

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: 'var(--primary-accent)'}} /></Container>;
  if (!payer) return <Container className="mt-5 text-center"><h3>משלם לא נמצא 😕</h3></Container>;

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      
      {/* --- כותרת וכפתור חזרה --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="border shadow-sm text-muted p-2" onClick={() => navigate('/payers')} title="חזרה לרשימת משלמים">
            <FiArrowRight size={20} />
          </Button>
          <div>
            <h3 style={{ color: 'var(--text-main)', fontWeight: '800' }} className="mb-0">
              {payer.name}
            </h3>
            <p className="text-muted mb-0">כרטיס משלם (ארנק חיוב)</p>
          </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={() => setShowEditModal(true)}>
          <FiEdit2 /> ערוך פרטי גבייה
        </Button>
      </div>

      <Row className="g-4 mb-4">
        {/* --- כרטיס פרטי המשלם --- */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
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
                      <Badge bg="success" className="px-3 py-2 rounded-pill fs-6">
                        {payer.paymentMethod === 'credit_card' ? '💳 כרטיס אשראי (נדרים פלוס)' : payer.paymentMethod === 'bank_transfer' ? '🏦 העברה בנקאית' : payer.paymentMethod}
                      </Badge>
                    </div>
                    <div>
                      <small className="text-muted d-block">הערות לגביה</small>
                      <div className="p-3 bg-light rounded border mt-1">
                        <span className="text-muted">{payer.notes || 'אין הערות מיוחדות בכרטיס זה.'}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* --- כרטיס סכום חיוב חודשי --- */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
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
              <div className="mb-3 mx-auto shadow-sm" style={{ backgroundColor: '#fff', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                <FiFileText size={28} />
              </div>
              <h6 className="fw-bold text-muted mb-2">סה"כ לחיוב בחודש זה</h6>
              <h1 className="display-4 fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
                ₪{totalMonthlyCost.toLocaleString()}
              </h1>
              <p className="text-muted small mb-0">עבור {linkedStudents.length} תלמידים משויכים</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- פירוט התלמידים המרכיבים את הסכום --- */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4">
          <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--text-main)' }}>
            <FiUser className="text-primary" /> ממה מורכב סכום החיוב? (פירוט תלמידים)
          </h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Table hover className="align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 rounded-start">שם התלמיד</th>
                <th className="border-0">תעודת זהות</th>
                <th className="border-0">סכום חיוב החודש</th>
                <th className="text-end border-0 rounded-end">פעולות</th>
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
                      <td className="fw-bold text-primary">{student.firstName} {student.lastName}</td>
                      <td className="text-muted">{student.idNumber}</td>
                      <td className="fw-bold" style={{ color: cost > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        ₪{cost.toLocaleString()}
                      </td>
                      <td className="text-end">
                        <Button 
                          variant="light" 
                          size="sm"
                          className="border fw-bold"
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

      {/* --- מודל עריכת משלם --- */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700' }}>עריכת פרטי משלם</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleUpdatePayer}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">סוג המשלם</Form.Label>
                      <Form.Select name="payerType" value={formData.payerType || ''} onChange={handleChange}>
                        <option value="individual">אדם פרטי (הורה)</option>
                        <option value="organization">ארגון / עמותה / מוסד</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">אמצעי תשלום מועדף</Form.Label>
                      <Form.Select name="paymentMethod" value={formData.paymentMethod || ''} onChange={handleChange}>
                        <option value="credit_card">כרטיס אשראי</option>
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
                      <Form.Label className="fw-bold text-muted small">שם מלא / שם הארגון</Form.Label>
                      <Form.Control type="text" name="name" required value={formData.name || ''} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">ת.ז / ח.פ</Form.Label>
                      <Form.Control type="text" name="identifier" required value={formData.identifier || ''} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">טלפון נייד</Form.Label>
                      <Form.Control type="text" name="phone" value={formData.phone || ''} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">אימייל לקבלות</Form.Label>
                      <Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">הערות נוספות (יצוץ בדוחות)</Form.Label>
                      <Form.Control as="textarea" rows={3} name="notes" value={formData.notes || ''} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end mt-3 pt-3 border-top">
                  <Button variant="light" onClick={() => setShowEditModal(false)} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור שינויים</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default PayerProfile;