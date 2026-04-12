import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Modal, Row, Col } from 'react-bootstrap';
import { FiSearch, FiPlus, FiUserCheck, FiMoreHorizontal, FiTrash2, FiFileText } from 'react-icons/fi';

function Tutors() {
  const navigate = useNavigate();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  
  // השדות של מסד הנתונים נשמרו כפי שהיו
  const [newTutor, setNewTutor] = useState({
    firstName: '', lastName: '', idNumber: '', birthDate: '', 
    phone1: '', phone2: '', email: '', address: '', city: '', sector: '',
    yeshiva: '', interviewedBy: '', languages: '', recommendations: '', notes: '',
    bankName: '', branch: '', accountNumber: '' 
  });

  // שליפת הנתונים מהשרת (לא נגעתי)
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await fetch('https://yadid-nefesh-server.onrender.com/api/tutors');
        if (response.ok) {
          const data = await response.json();
          setTutors(data);
        }
      } catch (error) {
        console.error('שגיאה בשליפת חונכים:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter(tutor => {
    const fullName = `${tutor.firstName} ${tutor.lastName}`;
    return fullName.includes(searchTerm) || tutor.idNumber?.includes(searchTerm);
  });

  const handleOpenAdd = () => setShowAddModal(true);
  const handleCloseAdd = () => {
    setShowAddModal(false);
    setNewTutor({
      firstName: '', lastName: '', idNumber: '', birthDate: '', 
      phone1: '', phone2: '', email: '', address: '', city: '', sector: '',
      yeshiva: '', interviewedBy: '', languages: '', recommendations: '', notes: '',
      bankName: '', branch: '', accountNumber: ''
    });
  };
  
  const handleAddChange = (e) => setNewTutor({ ...newTutor, [e.target.name]: e.target.value });

  const handleAddTutor = async (e) => {
    e.preventDefault();
    const payload = {
      ...newTutor,
      languages: newTutor.languages ? newTutor.languages.split(',').map(lang => lang.trim()) : [],
      bankAccount: { bankName: newTutor.bankName, branch: newTutor.branch, accountNumber: newTutor.accountNumber }
    };

    try {
      const response = await fetch('https://yadid-nefesh-server.onrender.com/api/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setTutors([...tutors, data.tutor]); 
        handleCloseAdd();
      } else {
        const errorData = await response.json();
        alert(`שגיאה ביצירת החונך: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    }
  };

  const handleDelete = async (e, tutorId, name) => {
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את החונך ${name}? (פעולה זו לא ניתנת לביטול)`)) return;
    try {
      const response = await fetch(`https://yadid-nefesh-server.onrender.com/api/tutors/${tutorId}`, { method: 'DELETE' });
      if (response.ok) setTutors(tutors.filter(t => t._id !== tutorId));
    } catch (error) {
      alert('שגיאה במחיקת החונך');
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: 'var(--primary-accent)'}} /></Container>;

  return (
    <Container className="mt-4" dir="rtl">
      
      {/* כותרת העמוד - עיצוב הייטק */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">
            ניהול חונכים
          </h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">
            צפייה, סינון והוספת חונכים למערכת
          </p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleOpenAdd}>
          <FiPlus /> הוסף חונך
        </Button>
      </div>

      {/* אזור החיפוש והטבלה המרחפת */}
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
                  <th><FiUserCheck className="me-2" /> שם החונך</th>
                  <th>ת.ז.</th>
                  <th>טלפון</th>
                  <th>עיר</th>
                  <th>סטטוס</th>
                  <th className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredTutors.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">לא נמצאו חונכים התואמים לחיפוש.</td></tr>
                ) : (
                  filteredTutors.map((tutor) => (
                    <tr key={tutor._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tutor/${tutor._id}`)}>
                      <td className="fw-bold" style={{ color: 'var(--primary-accent)' }}>{tutor.firstName} {tutor.lastName}</td>
                      <td className="text-muted">{tutor.idNumber}</td>
                      <td className="text-muted" dir="ltr" style={{ textAlign: 'right' }}>{tutor.phone1}</td>
                      <td className="text-muted">{tutor.city?.name || tutor.city || '-'}</td>
                      <td>
                        <span className={`badge ${tutor.status === 'לא פעיל' ? 'bg-secondary' : 'bg-success'}`} style={{ opacity: '0.9', padding: '6px 12px' }}>
                          {tutor.status || 'פעיל'}
                        </span>
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                         <Button variant="light" size="sm" className="me-2 text-primary border" onClick={(e) => { e.stopPropagation(); navigate(`/tutor/${tutor._id}`); }}>
                           <FiFileText className="me-1" /> כרטיס
                         </Button>
                         <Button variant="light" size="sm" className="text-danger border" onClick={(e) => handleDelete(e, tutor._id, tutor.firstName)}>
                           <FiTrash2 className="me-1" /> מחק
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

      {/* --- חלון ההוספה המעוצב --- */}
      <Modal show={showAddModal} onHide={handleCloseAdd} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>הוספת חונך חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleAddTutor}>
                
                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-2">פרטים אישיים</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שם פרטי *</Form.Label><Form.Control type="text" name="firstName" value={newTutor.firstName} onChange={handleAddChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שם משפחה *</Form.Label><Form.Control type="text" name="lastName" value={newTutor.lastName} onChange={handleAddChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">ת.ז *</Form.Label><Form.Control type="text" name="idNumber" value={newTutor.idNumber} onChange={handleAddChange} required /></Form.Group></Col>
                </Row>
                <Row className="mb-4">
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">תאריך לידה *</Form.Label><Form.Control type="date" name="birthDate" value={newTutor.birthDate} onChange={handleAddChange} required /></Form.Group></Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">פרטי התקשרות ומגורים</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">טלפון 1 *</Form.Label><Form.Control type="text" name="phone1" value={newTutor.phone1} onChange={handleAddChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">טלפון 2</Form.Label><Form.Control type="text" name="phone2" value={newTutor.phone2} onChange={handleAddChange} /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">אימייל</Form.Label><Form.Control type="email" name="email" value={newTutor.email} onChange={handleAddChange} /></Form.Group></Col>
                </Row>
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">עיר *</Form.Label><Form.Control type="text" name="city" value={newTutor.city} onChange={handleAddChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">כתובת *</Form.Label><Form.Control type="text" name="address" value={newTutor.address} onChange={handleAddChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">מגזר</Form.Label><Form.Control type="text" name="sector" value={newTutor.sector} onChange={handleAddChange} /></Form.Group></Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">רקע מקצועי</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">ישיבה *</Form.Label><Form.Control type="text" name="yeshiva" value={newTutor.yeshiva} onChange={handleAddChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">רואיין ע"י</Form.Label><Form.Control type="text" name="interviewedBy" value={newTutor.interviewedBy} onChange={handleAddChange} /></Form.Group></Col>
                </Row>
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שפות (מופרד בפסיקים)</Form.Label><Form.Control type="text" name="languages" placeholder="עברית, אנגלית..." value={newTutor.languages} onChange={handleAddChange} /></Form.Group></Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">פרטי חשבון בנק</h6>
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שם בנק</Form.Label><Form.Control type="text" name="bankName" value={newTutor.bankName} onChange={handleAddChange} /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">סניף</Form.Label><Form.Control type="text" name="branch" value={newTutor.branch} onChange={handleAddChange} /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">מספר חשבון</Form.Label><Form.Control type="text" name="accountNumber" value={newTutor.accountNumber} onChange={handleAddChange} /></Form.Group></Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">הערות והמלצות</h6>
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">המלצות</Form.Label><Form.Control as="textarea" rows={2} name="recommendations" value={newTutor.recommendations} onChange={handleAddChange} /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">הערות</Form.Label><Form.Control as="textarea" rows={2} name="notes" value={newTutor.notes} onChange={handleAddChange} /></Form.Group></Col>
                </Row>

                <div className="d-flex justify-content-end pt-3 border-top">
                  <Button variant="light" onClick={handleCloseAdd} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור חונך בענן</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Tutors;