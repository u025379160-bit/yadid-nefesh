import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner } from 'react-bootstrap';
import { FiSearch, FiPlus, FiUser, FiFileText, FiTrash2 } from 'react-icons/fi';

function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [payers, setPayers] = useState([]); 
  const [placements, setPlacements] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentsAndData(); 

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

  const getPlacementStatus = (studentId) => {
    const isActivePlaced = placements.some(p => p.student && p.student._id === studentId && p.status === 'פעיל');
    
    if (isActivePlaced) {
      return { text: 'משובץ', style: { backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0' } };
    } else {
      return { text: 'ממתין לשיבוץ', style: { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } };
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
    
    const dataToSend = { ...formData };
    if (!dataToSend.payer || dataToSend.payer === "") {
      delete dataToSend.payer;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend), 
      });

      if (response.ok) {
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

  return (
    <Container className="pt-3 mb-5" dir="rtl">
      
      {/* אזור עליון דביק הכולל את הכותרת + כפתור + שורת חיפוש */}
      <div 
        className="pb-4 pt-3 mb-4"
        style={{
          position: 'sticky',
          top: '68px',
          backgroundColor: '#f8fafc',
          zIndex: 100,
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">
              ניהול תלמידים
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">
              צפייה, ניהול והוספת תלמידים למערכת
            </p>
          </div>
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={handleShow}>
            <FiPlus size={18} /> הוסף תלמיד
          </Button>
        </div>

        {/* שורת החיפוש הוכנסה לאזור הדביק */}
        <div style={{ maxWidth: '350px' }}>
          <InputGroup className="shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <InputGroup.Text style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
              <FiSearch color="#94a3b8" />
            </InputGroup.Text>
            <Form.Control
              placeholder="חיפוש לפי שם או ת.ז..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRight: 'none', boxShadow: 'none' }}
            />
          </InputGroup>
        </div>
      </div>

      {/* כרטיסיית הטבלה (מחליקה מתחת לאזור הדביק בגלילה) */}
      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          <div className="table-responsive">
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiUser className="me-2" /> שם התלמיד</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>ת.ז.</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>כתובת</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סטטוס שיבוץ</th> 
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <Spinner animation="border" style={{color: '#2563eb'}} />
                      <div className="mt-2 text-muted fw-bold">טוען נתונים מהענן...</div>
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const status = getPlacementStatus(student._id);

                    return (
                      <tr key={student._id} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onClick={() => navigate(`/student/${student._id}`)}>
                        <td className="fw-bold" style={{ color: '#2563eb', padding: '16px 12px' }}>{student.firstName} {student.lastName}</td>
                        <td style={{ color: '#475569', padding: '16px 12px' }}>{student.idNumber}</td>
                        <td style={{ color: '#475569', padding: '16px 12px' }}>{student.address}</td>
                        <td style={{ padding: '16px 12px' }}>
                          <span className="rounded-pill d-inline-block text-center" style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: '600', ...status.style }}>
                            {status.text}
                          </span>
                        </td>
                        <td className="text-end" style={{ padding: '16px 12px' }} onClick={(e) => e.stopPropagation()}>
                           <Button variant="light" size="sm" className="me-2 rounded-pill shadow-sm" style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', fontWeight: '500' }} onClick={(e) => { e.stopPropagation(); navigate(`/student/${student._id}`); }}>
                             <FiFileText className="me-1" /> כרטיס
                           </Button>
                           <Button variant="light" size="sm" className="rounded-pill shadow-sm" style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', fontWeight: '500' }} onClick={(e) => handleDelete(e, student._id, student.firstName)}>
                             <FiTrash2 className="me-1" /> מחק
                           </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">לא נמצאו תלמידים התואמים לחיפוש.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* חלון מודל הוספת תלמיד */}
      <Modal show={showModal} onHide={handleClose} size="lg" dir="rtl" backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>הוספת תלמיד חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleSubmit}>

            <div className="p-3 mb-4" style={{ backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <Form.Group>
                <Form.Label className="fw-bold small mb-2 d-flex align-items-center gap-2" style={{ color: '#0284c7' }}>
                  <FiUser /> שיוך למשלם קבוע (הורה/ארגון שאחראי על הגבייה)
                </Form.Label>
                <Form.Select name="payer" value={formData.payer || ''} onChange={handleChange} style={{ borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <option value="">-- ללא משלם קבוע כרגע (ניתן לעדכן מאוחר יותר) --</option>
                  {payers.map(payer => (
                    <option key={payer._id} value={payer._id}>
                      {payer.name} ({payer.identifier}) - {payer.payerType === 'individual' ? 'אדם פרטי' : 'מוסד'}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="small mt-2 d-block" style={{ color: '#0369a1' }}>בחר מתוך רשימת המשלמים מי ישלם את המלגות עבור תלמיד זה.</Form.Text>
              </Form.Group>
            </div>

            <h6 className="fw-bold pb-2 mb-3 mt-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטים אישיים</h6>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם פרטי *</Form.Label><Form.Control type="text" name="firstName" required value={formData.firstName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם משפחה *</Form.Label><Form.Control type="text" name="lastName" required value={formData.lastName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>תעודת זהות *</Form.Label><Form.Control type="text" name="idNumber" required value={formData.idNumber} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>תאריך לידה *</Form.Label><Form.Control type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטי משפחה והתקשרות</h6>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם האב *</Form.Label><Form.Control type="text" name="fatherName" required value={formData.fatherName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם האם *</Form.Label><Form.Control type="text" name="motherName" required value={formData.motherName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>טלפון נייד *</Form.Label><Form.Control type="text" name="phone1" required value={formData.phone1} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>כתובת (רחוב ומספר) *</Form.Label><Form.Control type="text" name="address" required value={formData.address} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <div className="d-flex justify-content-end pt-4 mt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button variant="light" onClick={handleClose} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>שמור תלמיד בענן</Button>
            </div>
            
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Students;