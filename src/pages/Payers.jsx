import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FiSearch, FiPlus, FiCreditCard, FiTrash2, FiUserCheck, FiUser } from 'react-icons/fi';

function Payers() {
  const navigate = useNavigate();
  const [payers, setPayers] = useState([]);
  const [students, setStudents] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    fetchPayers();
    fetchStudents();
  }, []);

  const fetchPayers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/payers');
      if (response.ok) {
        const data = await response.json();
        setPayers(data);
      }
    } catch (error) {
      console.error('שגיאה בשליפת משלמים:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('שגיאה בשליפת תלמידים:', error);
    }
  };

  const filteredPayers = payers.filter(payer => 
    payer.name.includes(searchTerm) || payer.identifier.includes(searchTerm)
  );

  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const [formData, setFormData] = useState({
    name: '', identifier: '', payerType: 'individual', 
    phone: '', email: '', paymentMethod: 'credit_card', notes: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAutoFill = (e) => {
    const studentId = e.target.value;
    if (!studentId) return;

    const selectedStudent = students.find(s => s._id === studentId);
    if (selectedStudent) {
      const parentName = `משפחת ${selectedStudent.lastName} (${selectedStudent.fatherName} ו${selectedStudent.motherName})`;
      
      setFormData({
        ...formData,
        name: parentName,
        phone: selectedStudent.phone1 || '',
        payerType: 'individual'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/payers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('המשלם נשמר בהצלחה במערכת!');
        handleClose();
        setFormData({ name: '', identifier: '', payerType: 'individual', phone: '', email: '', paymentMethod: 'credit_card', notes: '' });
        fetchPayers(); 
      } else {
        const errorData = await response.json();
        alert('שגיאה: ' + (errorData.message || 'לא ניתן לשמור את המשלם'));
      }
    } catch (error) {
      alert('שגיאת תקשורת מול השרת');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${name}?`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payers/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPayers(payers.filter(p => p._id !== id));
      } else {
        alert('שגיאה במחיקה');
      }
    } catch (error) {
      alert('שגיאת תקשורת');
    }
  };

  // פונקציה לבדיקת מספר התלמידים המשויכים לכל משלם
  const getLinkedStudentsCount = (payerId) => {
    return students.filter(s => (s.payer?._id === payerId) || (s.payer === payerId)).length;
  };

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">ניהול משלמים</h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">ריכוז כל הגורמים המשלמים - הורים ומוסדות</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={handleShow}>
          <FiPlus /> הוסף משלם חדש
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          
          <div className="mb-4" style={{ maxWidth: '350px' }}>
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderLeft: 'none' }}>
                <FiSearch color="var(--text-muted)" />
              </InputGroup.Text>
              <Form.Control 
                placeholder="חיפוש לפי שם או ת.ז/ח.פ..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRight: 'none', boxShadow: 'none' }} 
              />
            </InputGroup>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr className="bg-light">
                  <th className="border-0 rounded-start"><FiCreditCard className="me-2" /> שם המשלם</th>
                  <th className="border-0">ת.ז / ח.פ</th>
                  <th className="border-0">אמצעי תשלום</th>
                  <th className="border-0">תלמידים משויכים</th>
                  <th className="text-end border-0 rounded-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                ) : filteredPayers.length > 0 ? (
                  filteredPayers.map((payer) => (
                    <tr key={payer._id}>
                      <td 
                        className="fw-bold text-primary" 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => navigate(`/payer/${payer._id}`)}
                        title="לחץ לכניסה לכרטיס המשלם"
                      >
                        {payer.name}
                      </td>
                      <td className="text-muted">{payer.identifier}</td>
                      <td>
                        <span className="badge bg-light text-dark border" style={{ padding: '6px 12px' }}>
                          {payer.paymentMethod === 'credit_card' ? 'כרטיס אשראי' : payer.paymentMethod === 'bank_transfer' ? 'העברה בנקאית' : payer.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <Badge bg="info" className="rounded-pill px-3 py-2">
                          <FiUser className="me-1"/> {getLinkedStudentsCount(payer._id)} תלמידים
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="text-primary border fw-bold me-2" 
                          onClick={() => navigate(`/payer/${payer._id}`)}
                        >
                          כרטיס משלם
                        </Button>
                        <Button variant="light" size="sm" className="text-danger border" onClick={() => handleDelete(payer._id, payer.name)}>
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-5 text-muted">לא נמצאו משלמים. לחץ על "הוסף משלם חדש".</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} size="lg" dir="rtl">
        {/* תוכן המודל נשאר זהה למה שהיה לך */}
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700' }}>הוספת משלם חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSubmit}>

                <Row className="mb-4">
                  <Col md={12}>
                    <Form.Group className="p-3 bg-white border rounded shadow-sm" style={{ borderColor: 'var(--accent-gold)' }}>
                      <Form.Label className="fw-bold small mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
                        <FiUserCheck /> שליפה מהירה: יבוא פרטי הורים מכרטיס תלמיד קיים
                      </Form.Label>
                      <Form.Select onChange={handleAutoFill} style={{ borderRadius: '8px' }}>
                        <option value="">-- בחר תלמיד מהרשימה כדי לשאוב את הנתונים --</option>
                        {students.map(student => (
                          <option key={student._id} value={student._id}>
                            {student.firstName} {student.lastName} (הורים: {student.fatherName} ו{student.motherName})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted small mt-1 d-block">
                        טיפ: בחירה של תלמיד תמלא אוטומטית את שם המשלם והטלפון בטופס למטה.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">סוג המשלם *</Form.Label>
                      <Form.Select name="payerType" value={formData.payerType} onChange={handleChange}>
                        <option value="individual">אדם פרטי (הורה)</option>
                        <option value="organization">ארגון / עמותה / מוסד</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">אמצעי תשלום ברירת מחדל</Form.Label>
                      <Form.Select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
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
                      <Form.Label className="fw-bold text-muted small">שם מלא / שם המוסד *</Form.Label>
                      <Form.Control type="text" name="name" required value={formData.name} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">ת.ז / ח.פ / ע.מ *</Form.Label>
                      <Form.Control type="text" name="identifier" required value={formData.identifier} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">טלפון נייד</Form.Label>
                      <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">אימייל למשלוח קבלות</Form.Label>
                      <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Button variant="light" onClick={handleClose} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור משלם בענן</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Payers;