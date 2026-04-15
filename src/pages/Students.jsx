import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FiSearch, FiPlus, FiUser, FiFileText, FiTrash2 } from 'react-icons/fi';

function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [payers, setPayers] = useState([]); 
  const [placements, setPlacements] = useState([]); // --- תוספת: שומר את השיבוצים לבדיקת הסטטוס ---
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentsAndData(); // --- שינוי: קורא לפונקציה המאוחדת ---

    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
    };
  }, []);

  // --- תוספת: פונקציה מאוחדת שמושכת הכל יחד (תלמידים, משלמים, ושיבוצים) ---
  const fetchStudentsAndData = async () => {
    setIsLoading(true); 
    try {
      const [studentsRes, payersRes, placementsRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + '/api/students'),
        fetch(import.meta.env.VITE_API_URL + '/api/payers'),
        fetch(import.meta.env.VITE_API_URL + '/api/placements')
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (payersRes.ok) setPayers(await payersRes.json());
      if (placementsRes.ok) setPlacements(await placementsRes.json());
      
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  // --- תוספת: פונקציה חכמה שבודקת אם התלמיד משובץ עכשיו ---
  const getPlacementStatus = (studentId) => {
    // מחפש אם יש לתלמיד הזה שיבוץ שהסטטוס שלו 'פעיל'
    const isActivePlaced = placements.some(p => p.student && p.student._id === studentId && p.status === 'פעיל');
    
    if (isActivePlaced) {
      return { text: 'משובץ', bg: 'success' };
    } else {
      return { text: 'ממתין לשיבוץ', bg: 'warning' }; // צהוב/כתום לממתינים
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${name}?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStudents(students.filter(student => student._id !== id));
      } else {
        alert('🔴 שגיאה במחיקה מול השרת');
      }
    } catch (error) {
      alert('🔴 שגיאה בתקשורת מול השרת');
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`;
    return fullName.includes(searchTerm) || (student.idNumber && student.idNumber.includes(searchTerm));
  });

  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', idNumber: '', birthDate: '',
    phone1: '', fatherName: '', motherName: '', address: '', payer: '',
    city: '507f1f77bcf86cd799439011'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- התיקון: מכינים את הנתונים, ואם אין משלם - מוחקים את השדה כדי לא לבלבל את השרת ---
    const dataToSend = { ...formData };
    if (!dataToSend.payer || dataToSend.payer === "") {
      delete dataToSend.payer;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend), // כאן אנחנו שולחים את המידע ה"נקי"
      });

      if (response.ok) {
        alert('🎉 התלמיד נשמר בהצלחה!');
        setShowModal(false);
        setFormData({ firstName: '', lastName: '', idNumber: '', birthDate: '', phone1: '', fatherName: '', motherName: '', address: '', payer: '', city: '507f1f77bcf86cd799439011' });
        fetchStudentsAndData(); 
      } else {
        const data = await response.json();
        alert('🔴 שגיאה מהשרת: ' + (data.details || data.error || data.message));
      }
    } catch (error) {
      alert('🔴 שגיאה בתקשורת מול השרת');
    }
  };
    e.preventDefault();
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('🎉 התלמיד נשמר בהצלחה!');
        setShowModal(false);
        setFormData({ firstName: '', lastName: '', idNumber: '', birthDate: '', phone1: '', fatherName: '', motherName: '', address: '', payer: '', city: '507f1f77bcf86cd799439011' });
        fetchStudentsAndData(); // --- שינוי קטן: מרענן את כל הנתונים ---
      } else {
        const data = await response.json();
        alert('🔴 שגיאה מהשרת: ' + (data.details || data.error));
      }
    } catch (error) {
      alert('🔴 שגיאה בתקשורת מול השרת');
    }
  };

  return (
    <Container className="mt-4" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">
            ניהול תלמידים
          </h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">
            צפייה, ניהול והוספת תלמידים למערכת
          </p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleShow}>
          <FiPlus /> הוסף תלמיד
        </Button>
      </div>

      <Card className="border-0">
        <Card.Body className="p-4">
          
          <div className="mb-4" style={{ maxWidth: '350px' }}>
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderLeft: 'none' }}>
                <FiSearch color="var(--text-muted)" />
              </InputGroup.Text>
              <Form.Control
                placeholder="חיפוש לפי שם או ת.ז..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRight: 'none', boxShadow: 'none' }}
              />
            </InputGroup>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th><FiUser className="me-2" /> שם התלמיד</th>
                  <th>ת.ז.</th>
                  <th>כתובת</th>
                  <th>סטטוס שיבוץ</th> {/* --- שינוי כותרת --- */}
                  <th className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <Spinner animation="border" variant="primary" role="status" />
                      <div className="mt-2 text-muted fw-bold">טוען נתונים מהענן...</div>
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    // --- תוספת: חישוב הסטטוס לכל תלמיד ---
                    const status = getPlacementStatus(student._id);

                    return (
                      <tr key={student._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/${student._id}`)}>
                        <td className="fw-bold" style={{ color: 'var(--primary-accent)' }}>{student.firstName} {student.lastName}</td>
                        <td className="text-muted">{student.idNumber}</td>
                        <td className="text-muted">{student.address}</td>
                        <td>
                          {/* --- תוספת: הצגת התגית עם הצבע המתאים --- */}
                          <Badge bg={status.bg} style={{ opacity: '0.9', padding: '6px 12px', minWidth: '100px' }}>
                            {status.text}
                          </Badge>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                           <Button variant="light" size="sm" className="me-2 text-primary border" onClick={(e) => { e.stopPropagation(); navigate(`/student/${student._id}`); }}>
                             <FiFileText className="me-1" /> כרטיס
                           </Button>
                           <Button variant="light" size="sm" className="text-danger border" onClick={(e) => handleDelete(e, student._id, student.firstName)}>
                             <FiTrash2 className="me-1" /> מחק
                           </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">לא נמצאו תלמידים התואמים לחיפוש.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
        </Card.Body>
      </Card>

      {/* מודל טופס ההוספה (הכל נשאר במקום) */}
      <Modal show={showModal} onHide={handleClose} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>הוספת תלמיד חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSubmit}>

                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group className="p-3 bg-white border rounded" style={{ borderColor: 'var(--primary-blue)' }}>
                      <Form.Label className="fw-bold text-primary small mb-2 d-flex align-items-center gap-2">
                        <FiUser /> שיוך למשלם קבוע (הורה/ארגון שאחראי על הגבייה)
                      </Form.Label>
                      <Form.Select name="payer" value={formData.payer} onChange={handleChange} style={{ borderRadius: '8px' }}>
                        <option value="">-- ללא משלם קבוע כרגע (ניתן לעדכן מאוחר יותר) --</option>
                        {payers.map(payer => (
                          <option key={payer._id} value={payer._id}>
                            {payer.name} ({payer.identifier}) - {payer.payerType === 'individual' ? 'אדם פרטי' : 'מוסד'}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted small mt-1 d-block">בחר מתוך רשימת המשלמים מי ישלם את המלגות עבור תלמיד זה.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <hr className="text-muted opacity-25 mb-4"/>

                <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">שם פרטי *</Form.Label><Form.Control type="text" name="firstName" required value={formData.firstName} onChange={handleChange} /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">שם משפחה *</Form.Label><Form.Control type="text" name="lastName" required value={formData.lastName} onChange={handleChange} /></Form.Group></Col>
                </Row>
                <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">תעודת זהות *</Form.Label><Form.Control type="text" name="idNumber" required value={formData.idNumber} onChange={handleChange} /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">תאריך לידה *</Form.Label><Form.Control type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} /></Form.Group></Col>
                </Row>
                <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">שם האב *</Form.Label><Form.Control type="text" name="fatherName" required value={formData.fatherName} onChange={handleChange} /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">שם האם *</Form.Label><Form.Control type="text" name="motherName" required value={formData.motherName} onChange={handleChange} /></Form.Group></Col>
                </Row>
                <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">טלפון נייד *</Form.Label><Form.Control type="text" name="phone1" required value={formData.phone1} onChange={handleChange} /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold text-muted small">כתובת (רחוב ומספר) *</Form.Label><Form.Control type="text" name="address" required value={formData.address} onChange={handleChange} /></Form.Group></Col>
                </Row>
                <div className="d-flex justify-content-end mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Button variant="light" onClick={handleClose} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור תלמיד בענן</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Students;