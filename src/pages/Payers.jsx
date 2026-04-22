import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FiSearch, FiPlus, FiCreditCard, FiTrash2, FiUserCheck, FiUser, FiBriefcase } from 'react-icons/fi';

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
    payer.name?.includes(searchTerm) || payer.identifier?.includes(searchTerm)
  );

  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  // 🔥 הוספתי פה את receiptNotes לתוך הסטייט של הטופס 🔥
  const [formData, setFormData] = useState({
    name: '', identifier: '', payerType: 'individual', 
    phone: '', email: '', paymentMethod: 'credit_card', notes: '', receiptNotes: ''
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
        handleClose();
        // 🔥 איפסתי גם את ההערות לקבלה בסיום 🔥
        setFormData({ name: '', identifier: '', payerType: 'individual', phone: '', email: '', paymentMethod: 'credit_card', notes: '', receiptNotes: '' });
        fetchPayers(); 
      } else {
        const errorData = await response.json();
        alert('שגיאה: ' + (errorData.message || 'לא ניתן לשמור את המשלם'));
      }
    } catch (error) {
      alert('שגיאת תקשורת מול השרת');
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
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

  const handleOpenNedarimPlus = (e, payer) => {
    e.stopPropagation();
    alert(`כאן ייפתח בהמשך חלון ה-iFrame של נדרים פלוס עבור: ${payer.name}\nהמערכת תשמור את הטוקן שיתקבל לחיובים עתידיים.`);
  };

  const getLinkedStudentsCount = (payerId) => {
    return students.filter(s => (s.payer?._id === payerId) || (s.payer === payerId)).length;
  };

  return (
    <Container className="pt-3 mb-5" dir="rtl">
      
      {/* כותרת דביקה (Sticky) */}
      <div 
        className="pb-4 pt-3 mb-4"
        style={{ position: 'sticky', top: '68px', backgroundColor: '#f8fafc', zIndex: 100, borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">ניהול משלמים</h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">ריכוז כל הגורמים המשלמים - הורים ומוסדות</p>
          </div>
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={handleShow}>
            <FiPlus size={18} /> הוסף משלם חדש
          </Button>
        </div>

        <div style={{ maxWidth: '350px' }}>
          <InputGroup className="shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <InputGroup.Text style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
              <FiSearch color="#94a3b8" />
            </InputGroup.Text>
            <Form.Control 
              placeholder="חיפוש לפי שם או ת.ז/ח.פ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRight: 'none', boxShadow: 'none' }} 
            />
          </InputGroup>
        </div>
      </div>

      {/* כרטיסיית הטבלה */}
      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          <div className="table-responsive">
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiCreditCard className="me-2" /> שם המשלם</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>ת.ז / ח.פ</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>פרטים ומשויכים</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סטטוס אשראי</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" style={{color: '#2563eb'}} /></td></tr>
                ) : filteredPayers.length > 0 ? (
                  filteredPayers.map((payer) => (
                    <tr key={payer._id} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onClick={() => navigate(`/payer/${payer._id}`)}>
                      <td className="fw-bold" style={{ color: '#2563eb', padding: '16px 12px' }}>
                        {payer.name}
                      </td>
                      <td style={{ color: '#475569', padding: '16px 12px' }}>{payer.identifier}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <div className="d-flex flex-column gap-2">
                          {payer.payerType === 'individual' ? (
                            <Badge bg="light" text="dark" className="border w-auto align-self-start"><FiUserCheck className="me-1"/> פרטי</Badge>
                          ) : (
                            <Badge bg="light" text="primary" className="border border-primary w-auto align-self-start"><FiBriefcase className="me-1"/> מוסד</Badge>
                          )}
                          <Badge bg="info" className="rounded-pill w-auto align-self-start" style={{ padding: '4px 8px' }}>
                            <FiUser className="me-1"/> {getLinkedStudentsCount(payer._id)} תלמידים
                          </Badge>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        {payer.creditCardToken ? (
                          <span className="rounded-pill d-inline-block text-center" style={{ padding: '4px 12px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0' }}>
                            אשראי מעודכן
                          </span>
                        ) : (
                          <span className="rounded-pill d-inline-block text-center" style={{ padding: '4px 12px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                            חסר אשראי
                          </span>
                        )}
                      </td>
                      <td className="text-end" style={{ padding: '16px 12px' }} onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="me-2 rounded-pill shadow-sm fw-bold" 
                          style={{ color: '#0284c7', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd' }} 
                          onClick={(e) => handleOpenNedarimPlus(e, payer)}
                        >
                          <FiCreditCard className="me-1" /> נדרים פלוס
                        </Button>
                        <Button variant="light" size="sm" className="rounded-pill shadow-sm" style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }} onClick={(e) => handleDelete(e, payer._id, payer.name)}>
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

      {/* חלון הוספת משלם מעוצב מחדש */}
      <Modal show={showModal} onHide={handleClose} size="lg" dir="rtl" backdrop="static">
        
        {/* 🔥 תיקון האיקס: יצרנו הדר מותאם אישית שדוחף את האיקס שמאלה עד הסוף בחזקה 🔥 */}
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>הוספת משלם חדש</h4>
          <button onClick={handleClose} className="btn-close" aria-label="Close" style={{ margin: 0 }}></button>
        </div>

        <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleSubmit}>

            {/* בלוק שליפה מהירה */}
            <div className="p-3 mb-4 shadow-sm" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
              <Form.Group>
                <Form.Label className="fw-bold small mb-2 d-flex align-items-center gap-2" style={{ color: '#b45309' }}>
                  <FiUserCheck /> שליפה מהירה: יבוא פרטי הורים מכרטיס תלמיד קיים
                </Form.Label>
                <Form.Select onChange={handleAutoFill} style={{ borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <option value="">-- בחר תלמיד מהרשימה כדי לשאוב את הנתונים --</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} (הורים: {student.fatherName} ו{student.motherName})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="small mt-2 d-block" style={{ color: '#92400e' }}>
                  טיפ: בחירה של תלמיד תמלא אוטומטית את שם המשלם והטלפון בטופס למטה.
                </Form.Text>
              </Form.Group>
            </div>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>סוג המשלם *</Form.Label>
                  <Form.Select name="payerType" value={formData.payerType} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <option value="individual">אדם פרטי (הורה)</option>
                    <option value="organization">ארגון / עמותה / מוסד</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>אמצעי תשלום מועדף</Form.Label>
                  <Form.Select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
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
                  <Form.Control type="text" name="name" required value={formData.name} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>ת.ז / ח.פ / ע.מ *</Form.Label>
                  <Form.Control type="text" name="identifier" required value={formData.identifier} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטי התקשרות</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>טלפון נייד</Form.Label>
                  <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>אימייל למשלוח קבלות</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>

            {/* 🔥 חדש: הגדרות נדרים פלוס לקבלה 🔥 */}
            <h6 className="fw-bold pb-2 mb-3 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הגדרות קבלה (נדרים פלוס)</h6>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>טקסט להדפסה על הקבלה (הקדשה / עבור מי)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    name="receiptNotes" 
                    value={formData.receiptNotes}
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

            {/* 🔥 חדש: אזור הזנת אשראי שמופיע רק אם בחרו אשראי! 🔥 */}
            {formData.paymentMethod === 'credit_card' && (
              <>
                <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הזנת פרטי אשראי</h6>
                <div className="p-4 rounded-4 mb-4 text-center shadow-sm" style={{ backgroundColor: '#f0fdf4', border: '1px dashed #22c55e' }}>
                  <p className="mb-3 text-success fw-bold" style={{ fontSize: '1.05rem' }}>המערכת מוכנה לקליטת כרטיס אשראי</p>
                  <Button 
                    variant="success" 
                    className="rounded-pill shadow-sm px-4 py-2" 
                    style={{ fontWeight: '600' }}
                    onClick={(e) => {
                      e.preventDefault();
                      alert('כאן יפתח בעתיד iFrame מאובטח של נדרים פלוס להזנת כרטיס אשראי שמקושר למשלם זה.');
                    }}
                  >
                    💳 הוסף כרטיס לחיוב (מסוף נדרים)
                  </Button>
                  <p className="small text-muted mt-3 mb-0">
                    הפרטים נשמרים בצורה מאובטחת ומוצפנת בשרתי נדרים פלוס (באמצעות טוקן).
                  </p>
                </div>
              </>
            )}

            <div className="d-flex justify-content-end pt-4 mt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button variant="light" onClick={handleClose} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>שמור משלם בענן</Button>
            </div>
            
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Payers;