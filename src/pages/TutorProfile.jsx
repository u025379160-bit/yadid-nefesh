import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, ListGroup, Spinner, Modal, Form } from 'react-bootstrap';
import { FiArrowRight, FiEdit2, FiUser, FiInfo, FiBriefcase, FiList, FiPhone, FiMail, FiCreditCard, FiUserPlus } from 'react-icons/fi';

function TutorProfile() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]); // --- שומר את רשימת התלמידים לשיבוץ ---
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  // --- ניהול מודל השיבוץ המהיר ---
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementData, setPlacementData] = useState({
    student: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    paymentMethod: 'credit_card',
    status: 'פעיל'
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // מנקה רקעים אפורים תקועים
  useEffect(() => {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
  }, [showEditModal, showPlacementModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // שולף גם חונך, גם שיבוצים וגם את כל התלמידים במקביל!
        const [tutorRes, placementsRes, studentsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/tutors/${id}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/placements`),
          fetch(`${import.meta.env.VITE_API_URL}/api/students`)
        ]);

        if (tutorRes.ok) setTutor(await tutorRes.json());
        if (studentsRes.ok) setStudents(await studentsRes.json());

        if (placementsRes.ok) {
          const allPlacements = await placementsRes.json();
          const tutorPlacements = allPlacements.filter(p => p.tutor && p.tutor._id === id);
          setPlacements(tutorPlacements);
        }
      } catch (error) {
        console.error('שגיאה:', error);
      } finally {
        setLoading(false); 
      }
    };
    fetchData();
  }, [id]);

  const filteredPlacements = placements.filter(p => {
    if (!p.startDate) return false;
    const pDate = new Date(p.startDate);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);
    const isStartedBySelectedMonth = pDate.getFullYear() < sYear || (pDate.getFullYear() === sYear && pDate.getMonth() + 1 <= sMonth);
    return isStartedBySelectedMonth && p.status !== 'לא פעיל';
  });

  const totalMonthlyPayment = filteredPlacements.reduce((sum, placement) => {
    return sum + (Number(placement.paymentAmount) || 0);
  }, 0);

  // --- פונקציות העריכה של החונך ---
  const handleOpenEdit = () => {
    setFormData(tutor);
    setShowEditModal(true);
  };
  const handleCloseEdit = () => setShowEditModal(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdateTutor = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tutors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedTutor = await response.json();
        setTutor(updatedTutor);
        setShowEditModal(false);
      } else {
        alert('שגיאה בעדכון החונך');
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    }
  };

  // --- פונקציות השיבוץ המהיר ---
  const handleOpenPlacement = () => setShowPlacementModal(true);
  const handleClosePlacement = () => setShowPlacementModal(false);
  const handlePlacementChange = (e) => setPlacementData({ ...placementData, [e.target.name]: e.target.value });

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    try {
      // מוסיפים את ה-ID של החונך לנתונים (כי אנחנו בפרופיל שלו)
      const dataToSend = { ...placementData, tutor: id };
      
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        alert('🎉 השיבוץ נוצר בהצלחה!');
        setShowPlacementModal(false);
        setPlacementData({ student: '', startDate: new Date().toISOString().split('T')[0], paymentAmount: '', paymentMethod: 'credit_card', status: 'פעיל' });
        
        // מרעננים את רשימת השיבוצים כדי לראות את השיבוץ החדש בטבלה
        const placementsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/placements`);
        if (placementsRes.ok) {
          const allPlacements = await placementsRes.json();
          const tutorPlacements = allPlacements.filter(p => p.tutor && p.tutor._id === id);
          setPlacements(tutorPlacements);
        }
      } else {
        const err = await response.json();
        alert('🔴 שגיאה ביצירת שיבוץ: ' + err.message);
      }
    } catch (error) {
      alert('🔴 שגיאת תקשורת ביצירת השיבוץ');
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: 'var(--primary-accent)'}} /></Container>;
  if (!tutor) return <Container className="mt-5 text-center"><h3>חונך לא נמצא 😕</h3></Container>;

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="border shadow-sm text-muted p-2" onClick={() => navigate('/tutors')} title="חזרה לרשימה">
            <FiArrowRight size={20} />
          </Button>
          <div>
            <h3 style={{ color: 'var(--text-main)', fontWeight: '800' }} className="mb-0">
              {tutor.firstName} {tutor.lastName}
            </h3>
            <p className="text-muted mb-0">פרופיל חונך</p>
          </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={handleOpenEdit}>
          <FiEdit2 /> ערוך פרטים
        </Button>
      </div>
      
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 p-md-5">
              <Row className="g-4">
                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiUser /> פרטים אישיים
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="text-muted d-block">תעודת זהות</small><span className="fw-bold" style={{ color: 'var(--text-main)' }}>{tutor.idNumber}</span></div>
                    <div className="d-flex align-items-center gap-2"><FiPhone className="text-muted" /><span dir="ltr" className="fw-bold">{tutor.phone1}</span></div>
                    {tutor.phone2 && <div className="d-flex align-items-center gap-2"><FiPhone className="text-muted" /><span dir="ltr">{tutor.phone2}</span></div>}
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiInfo /> מידע מערכתי
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="text-muted d-block mb-1">סטטוס פעילות</small>
                      <Badge bg={tutor.status === 'לא פעיל' ? 'secondary' : 'success'} className="px-3 py-2 rounded-pill">
                        {tutor.status || 'פעיל'}
                      </Badge>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <FiMail className="text-muted" />
                      <span className={tutor.email ? 'fw-bold' : 'text-muted fst-italic'}>{tutor.email || 'לא הוזן מייל'}</span>
                    </div>
                    {tutor.notes && (
                      <div className="bg-light p-3 rounded mt-2 border">
                        <small className="text-muted fw-bold d-block mb-1">הערות רכז:</small>
                        <span style={{ fontSize: '0.9rem' }}>{tutor.notes}</span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center text-center">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <span className="fw-bold text-muted small">בחר חודש לסיכום:</span>
                <Form.Control
                  type="month"
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '140px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>

              <div className="mb-3 mx-auto shadow-sm" style={{ backgroundColor: '#fff', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>
                <FiCreditCard size={28} />
              </div>
              <h6 className="fw-bold text-muted mb-2">סה"כ תשלום לחודש זה</h6>
              <h2 className="display-5 fw-bold mb-1" style={{ color: 'var(--primary-accent)' }}>
                ₪{totalMonthlyPayment.toLocaleString()}
              </h2>
              <p className="text-muted small mb-0">מבוסס על {filteredPlacements.length} שיבוצים פעילים</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        
        {/* שיבוצים שרלוונטים לחודש שנבחר */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            {/* --- שינוי: הוספת הכפתור לשורת הכותרת --- */}
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--text-main)' }}>
                <FiBriefcase className="text-primary" /> פירוט התשלום החודשי
              </h5>
              <Button variant="outline-primary" size="sm" className="fw-bold rounded-pill px-3 d-flex align-items-center gap-1" onClick={handleOpenPlacement}>
                <FiUserPlus /> שבץ תלמיד
              </Button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-muted fw-bold border-0 rounded-start">שם התלמיד</th>
                      <th className="text-muted fw-bold border-0">תאריך התחלה</th>
                      <th className="text-muted fw-bold border-0">סכום</th>
                      <th className="text-muted fw-bold border-0 rounded-end text-end">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlacements.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">אין שיבוצים פעילים בחודש זה.</td>
                      </tr>
                    ) : (
                      filteredPlacements.map((placement) => (
                        <tr key={placement._id}>
                          <td className="fw-bold" style={{ color: 'var(--text-main)' }}>
                            {placement.student ? `${placement.student.firstName} ${placement.student.lastName}` : 'תלמיד נמחק'}
                          </td>
                          <td className="text-muted">{new Date(placement.startDate).toLocaleDateString('he-IL')}</td>
                          <td className="fw-bold text-primary">₪{Number(placement.paymentAmount || 0).toLocaleString()}</td>
                          <td className="text-end">
                            <Button 
                              variant="light" 
                              size="sm"
                              className="text-primary border fw-bold"
                              onClick={() => placement.student && navigate(`/student/${placement.student._id}`)}
                            >
                              לפרופיל
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* משימות ודיווחי שעות (סטטי כרגע) */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--text-main)' }}>
                <FiList className="text-warning" /> משימות ודיווחים
              </h5>
              <Button variant="outline-primary" size="sm" className="fw-bold rounded-pill px-3">+ דיווח חדש</Button>
            </Card.Header>
            <Card.Body className="p-4">
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0 py-3 border-bottom d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto">
                    <div className="fw-bold" style={{ color: 'var(--text-main)' }}>אישור נסיעות</div>
                    <small className="text-muted">צריך לאשר את קבלות הנסיעה של חודש קודם</small>
                  </div>
                  <Badge bg="warning" text="dark" className="rounded-pill">השבוע</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-3 border-bottom d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto">
                    <div className="fw-bold" style={{ color: 'var(--text-main)' }}>שיחת חתך עם רכז</div>
                    <small className="text-muted">לבצע שיחת טלפון לבדיקת מצב השיבוץ</small>
                  </div>
                  <Badge bg="danger" className="rounded-pill">דחוף</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* מודל עריכת חונך */}
      <Modal show={showEditModal} onHide={handleCloseEdit} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>עריכת פרטי חונך</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleUpdateTutor}>
                
                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-2">פרטים בסיסיים</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שם פרטי</Form.Label><Form.Control type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שם משפחה</Form.Label><Form.Control type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} required /></Form.Group></Col>
                </Row>
                
                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">יצירת קשר</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">טלפון (ראשי)</Form.Label><Form.Control type="text" name="phone1" value={formData.phone1 || ''} onChange={handleChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">אימייל</Form.Label><Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} /></Form.Group></Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">הגדרות מערכת</h6>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">סטטוס פעילות</Form.Label>
                      <Form.Select name="status" value={formData.status || 'פעיל'} onChange={handleChange}>
                        <option value="פעיל">פעיל</option>
                        <option value="לא פעיל">לא פעיל</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">הערות רכז (פנימי)</Form.Label>
                  <Form.Control as="textarea" rows={3} name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="הכנס הערות לשימור אישי..." />
                </Form.Group>

                <div className="d-flex justify-content-end pt-3 border-top">
                  <Button variant="light" onClick={handleCloseEdit} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור שינויים</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

      {/* --- תוספת: חלון הוספת שיבוץ מהיר לחונך --- */}
      <Modal show={showPlacementModal} onHide={handleClosePlacement} dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>שיבוץ תלמיד לחונך</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleAddPlacement}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">בחר תלמיד מרשימת התלמידים *</Form.Label>
                  <Form.Select name="student" required value={placementData.student} onChange={handlePlacementChange}>
                    <option value="">-- בחר תלמיד --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName} (ת.ז: {s.idNumber})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">תאריך התחלה *</Form.Label>
                      <Form.Control type="date" name="startDate" required value={placementData.startDate} onChange={handlePlacementChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">סכום חיוב חודשי (₪) *</Form.Label>
                      <Form.Control type="number" name="paymentAmount" required placeholder="לדוגמה: 1500" value={placementData.paymentAmount} onChange={handlePlacementChange} />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end pt-3 border-top mt-2">
                  <Button variant="light" onClick={handleClosePlacement} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm d-flex align-items-center gap-2">
                    <FiUserPlus /> צור שיבוץ עכשיו
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default TutorProfile;