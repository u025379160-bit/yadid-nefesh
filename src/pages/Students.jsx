import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { FiSearch, FiPlus, FiUser, FiMoreHorizontal, FiTrash2, FiFileText } from 'react-icons/fi';

function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // --- לוגיקה מקורית שלך: שליפה מהשרת ---
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('שגיאה בשליפת תלמידים:', error);
    }
  };

  // --- לוגיקה מקורית שלך: מחיקת תלמיד ---
  const handleDelete = async (e, id, name) => {
    e.stopPropagation(); // מונע מעבר לפרופיל בעת לחיצה על כפתור המחיקה
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${name}?`)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
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

  // סינון
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`;
    return fullName.includes(searchTerm) || (student.idNumber && student.idNumber.includes(searchTerm));
  });

  // --- לוגיקה מקורית שלך: ניהול המודל (טופס הוספה) ---
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', idNumber: '', birthDate: '',
    phone1: '', fatherName: '', motherName: '', address: '',
    city: '507f1f77bcf86cd799439011'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('🎉 התלמיד נשמר בהצלחה!');
        setShowModal(false);
        setFormData({ firstName: '', lastName: '', idNumber: '', birthDate: '', phone1: '', fatherName: '', motherName: '', address: '', city: '507f1f77bcf86cd799439011' });
        fetchStudents();
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
      
      {/* כותרת העמוד - העיצוב החדש והנקי */}
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

      {/* אזור החיפוש והטבלה על גבי כרטיסייה לבנה ונקייה */}
      <Card className="border-0">
        <Card.Body className="p-4">
          
          {/* שורת חיפוש מודרנית */}
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

          {/* הטבלה המעוצבת */}
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th><FiUser className="me-2" /> שם התלמיד</th>
                  <th>ת.ז.</th>
                  <th>כתובת</th>
                  <th>סטטוס</th>
                  <th className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/${student._id}`)}>
                      <td className="fw-bold" style={{ color: 'var(--primary-accent)' }}>{student.firstName} {student.lastName}</td>
                      <td className="text-muted">{student.idNumber}</td>
                      <td className="text-muted">{student.address}</td>
                      <td>
                        <span className="badge bg-success" style={{ opacity: '0.9', padding: '6px 12px' }}>
                          פעיל
                        </span>
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
                  ))
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

      {/* --- המודל המקורי שלך (טופס ההוספה) --- */}
      <Modal show={showModal} onHide={handleClose} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>הוספת תלמיד חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
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