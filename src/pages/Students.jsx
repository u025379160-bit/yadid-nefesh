import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FiSearch, FiPlus, FiUser, FiFileText, FiTrash2, FiLock, FiPlusCircle, FiMinusCircle, FiFilter, FiCalendar } from 'react-icons/fi';

function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [payers, setPayers] = useState([]); 
  const [placements, setPlacements] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstitute, setFilterInstitute] = useState(''); 
  const [filterPlacementStatus, setFilterPlacementStatus] = useState(''); 
  
  const [isLoading, setIsLoading] = useState(true);

  const uniqueInstitutes = [...new Set(students.map(s => s.institute).filter(Boolean))];

  useEffect(() => {
    fetchStudentsAndData(); 

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

  const getPlacementStatus = (hasActivePlacement) => {
    if (hasActivePlacement) {
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
    const matchText = fullName.includes(searchTerm) || (student.idNumber && student.idNumber.includes(searchTerm));
    const matchInstitute = filterInstitute === '' || student.institute === filterInstitute;
    
    let matchPlacement = true;
    if (filterPlacementStatus === 'פעיל') matchPlacement = student.hasActivePlacement === true;
    if (filterPlacementStatus === 'ללא') matchPlacement = student.hasActivePlacement === false;

    return matchText && matchInstitute && matchPlacement;
  });

  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', idNumber: '', birthDate: '',
    fatherName: '', motherName: '', 
    phone1: '', phone2: '', phone3: '', email: '',
    address: '', city: '507f1f77bcf86cd799439011', zipCode: '',
    institute: '', 
    contacts: [], 
    payer: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 פונקציית הקסם להמרת תאריך לועזי לעברי בזמן אמת 👇
  const getHebrewDate = (gregorianDateStr) => {
    if (!gregorianDateStr) return '';
    try {
      const date = new Date(gregorianDateStr);
      return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return '';
    }
  };

  const handleAddContact = () => {
    setFormData({ ...formData, contacts: [...formData.contacts, { name: '', phone: '', relation: '' }] });
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleRemoveContact = (index) => {
    const newContacts = formData.contacts.filter((_, i) => i !== index);
    setFormData({ ...formData, contacts: newContacts });
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
        setFormData({ 
          firstName: '', lastName: '', idNumber: '', birthDate: '', phone1: '', phone2: '', phone3: '', email: '',
          fatherName: '', motherName: '', address: '', zipCode: '', institute: '', contacts: [], payer: '', city: '507f1f77bcf86cd799439011' 
        });
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
      
      <div className="pb-4 pt-3 mb-4" style={{ position: 'sticky', top: '68px', backgroundColor: '#f8fafc', zIndex: 100, borderBottom: '1px solid #e2e8f0' }}>
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

        <Row className="g-3">
          <Col md={5} lg={4}>
            <InputGroup className="shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
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
          </Col>
          <Col md={3} lg={3}>
            <Form.Select 
              className="shadow-sm h-100" 
              style={{ borderRadius: '12px', border: '1px solid #e2e8f0', color: '#475569' }}
              value={filterInstitute}
              onChange={(e) => setFilterInstitute(e.target.value)}
            >
              <option value="">כל המוסדות</option>
              {uniqueInstitutes.map((inst, idx) => (
                <option key={idx} value={inst}>{inst}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4} lg={3}>
            <Form.Select 
              className="shadow-sm h-100" 
              style={{ borderRadius: '12px', border: '1px solid #e2e8f0', color: '#475569' }}
              value={filterPlacementStatus}
              onChange={(e) => setFilterPlacementStatus(e.target.value)}
            >
              <option value="">סטטוס שיבוץ (הכל)</option>
              <option value="פעיל">בעלי שיבוץ פעיל בלבד</option>
              <option value="ללא">ממתינים לשיבוץ בלבד</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          <div className="table-responsive">
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiUser className="me-2" /> שם התלמיד</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>ת.ז.</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>מוסד לימודי</th>
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
                    const status = getPlacementStatus(student.hasActivePlacement);

                    return (
                      <tr key={student._id} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onClick={() => navigate(`/student/${student._id}`)}>
                        <td className="fw-bold" style={{ color: '#2563eb', padding: '16px 12px' }}>{student.firstName} {student.lastName}</td>
                        <td style={{ color: '#475569', padding: '16px 12px' }}>{student.idNumber}</td>
                        <td style={{ color: '#475569', padding: '16px 12px' }}>{student.institute || 'לא הוגדר'}</td>
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
                    <td colSpan="5" className="text-center py-5 text-muted">לא נמצאו תלמידים התואמים לסינון.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} size="xl" dir="rtl" backdrop="static">
        
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>הוספת תלמיד חדש</h4>
          <button type="button" onClick={handleClose} className="btn-close" aria-label="Close" style={{ margin: 0 }}></button>
        </div>

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
              </Form.Group>
            </div>

            <h6 className="fw-bold pb-2 mb-3 mt-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטים אישיים</h6>
            <Row className="align-items-start">
              <Col md={2}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם פרטי *</Form.Label><Form.Control type="text" name="firstName" required value={formData.firstName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={2}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם משפחה *</Form.Label><Form.Control type="text" name="lastName" required value={formData.lastName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold small text-danger" title="שדה זה יישמר כמוצפן במסד הנתונים"><FiLock className="me-1"/> תעודת זהות *</Form.Label><Form.Control type="text" name="idNumber" required value={formData.idNumber} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} /></Form.Group></Col>
              
              {/* 👇 פה הקסם קורה: קובייה לועזית וקובייה עברית צמודות 👇 */}
              <Col md={5}>
                <Form.Label className="fw-bold small text-danger d-block"><FiCalendar className="me-1"/> תאריך לידה *</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control 
                    type="date" 
                    name="birthDate" 
                    required 
                    value={formData.birthDate} 
                    onChange={handleChange} 
                    style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca', flex: 1 }} 
                  />
                  <div 
                    className="d-flex align-items-center justify-content-center px-3" 
                    style={{ 
                      borderRadius: '8px', 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      flex: 1,
                      color: formData.birthDate ? '#0f172a' : '#94a3b8',
                      fontWeight: '600'
                    }}
                  >
                    {getHebrewDate(formData.birthDate) || 'תאריך עברי'}
                  </div>
                </div>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הורים ומוסד לימודים</h6>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם האב</Form.Label><Form.Control type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם האם</Form.Label><Form.Control type="text" name="motherName" value={formData.motherName} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>מוסד לימודי / ישיבה</Form.Label>
                  <Form.Select name="institute" value={formData.institute} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <option value="">-- בחר מוסד --</option>
                    <option value="ישיבת חברון">ישיבת חברון</option>
                    <option value="ישיבת מיר">ישיבת מיר</option>
                    <option value="ישיבת פוניבז'">ישיבת פוניבז'</option>
                    <option value="תלמוד תורה מרכז">תלמוד תורה מרכז</option>
                    <option value="אחר">אחר</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>דרכי התקשרות (מוצפן)</h6>
            <Row>
              <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold small text-danger"><FiLock className="me-1"/> טלפון 1 (ראשי) *</Form.Label><Form.Control type="text" name="phone1" required value={formData.phone1} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} /></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold small text-danger"><FiLock className="me-1"/> טלפון 2 (אופציונלי)</Form.Label><Form.Control type="text" name="phone2" value={formData.phone2} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} /></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold small text-danger"><FiLock className="me-1"/> טלפון 3 (אופציונלי)</Form.Label><Form.Control type="text" name="phone3" value={formData.phone3} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} /></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold small text-danger"><FiLock className="me-1"/> אימייל (אופציונלי)</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} /></Form.Group></Col>
            </Row>

            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>כתובת מגורים</Form.Label><Form.Control type="text" name="address" value={formData.address} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>עיר</Form.Label>
                  <Form.Select name="city" value={formData.city} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <option value="507f1f77bcf86cd799439011">ירושלים</option>
                    <option value="507f1f77bcf86cd799439012">בני ברק</option>
                    <option value="507f1f77bcf86cd799439013">בית שמש</option>
                    <option value="507f1f77bcf86cd799439014">אחר</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold small" style={{ color: '#64748b' }}>מיקוד</Form.Label><Form.Control type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <div className="mt-4 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0" style={{ color: '#334155' }}>אנשי קשר נוספים</h6>
                <Button variant="outline-primary" size="sm" onClick={handleAddContact} className="rounded-pill d-flex align-items-center gap-1">
                  <FiPlusCircle /> הוסף איש קשר
                </Button>
              </div>
              
              {formData.contacts.length === 0 ? (
                <div className="text-muted small text-center py-2">לא הוגדרו אנשי קשר נוספים.</div>
              ) : (
                formData.contacts.map((contact, index) => (
                  <Row key={index} className="mb-2 align-items-end">
                    <Col md={4}>
                      <Form.Label className="small mb-1">שם איש קשר</Form.Label>
                      <Form.Control size="sm" value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} placeholder="לדוגמה: סבא דוד" />
                    </Col>
                    <Col md={3}>
                      <Form.Label className="small mb-1">טלפון</Form.Label>
                      <Form.Control size="sm" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small mb-1">קרבה / תפקיד</Form.Label>
                      <Form.Control size="sm" value={contact.relation} onChange={(e) => handleContactChange(index, 'relation', e.target.value)} />
                    </Col>
                    <Col md={1} className="text-end">
                      <Button variant="link" className="text-danger p-0 mb-1" onClick={() => handleRemoveContact(index)} title="הסר">
                        <FiMinusCircle size={20} />
                      </Button>
                    </Col>
                  </Row>
                ))
              )}
            </div>

            <div className="d-flex justify-content-end pt-4 mt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
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