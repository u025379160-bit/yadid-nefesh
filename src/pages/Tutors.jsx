import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Modal, Row, Col } from 'react-bootstrap';
import { FiSearch, FiPlus, FiUserCheck, FiTrash2, FiFileText } from 'react-icons/fi';

function Tutors() {
  const navigate = useNavigate();

  const [tutors, setTutors] = useState([]);
  const [placements, setPlacements] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTutor, setNewTutor] = useState({
    firstName: '', lastName: '', idNumber: '', birthDate: '', 
    phone1: '', phone2: '', email: '', address: '', city: '', sector: '',
    yeshiva: '', interviewedBy: '', languages: '', recommendations: '', notes: '',
    bankName: '', branch: '', accountNumber: '' 
  });

  useEffect(() => {
    const fetchTutorsAndPlacements = async () => {
      try {
        const [tutorsRes, placementsRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/api/tutors'),
          fetch(import.meta.env.VITE_API_URL + '/api/placements')
        ]);

        if (tutorsRes.ok) setTutors(await tutorsRes.json());
        if (placementsRes.ok) setPlacements(await placementsRes.json());

      } catch (error) {
        console.error('שגיאה בשליפת נתונים:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutorsAndPlacements();
  }, []);

  const filteredTutors = tutors.filter(tutor => {
    const fullName = `${tutor.firstName} ${tutor.lastName}`;
    return fullName.includes(searchTerm) || tutor.idNumber?.includes(searchTerm);
  });

  // החלפנו את ה-Badge הפשוט בעיצוב פסטלי-מודרני
  const getPlacementStatus = (tutorId) => {
    if (!tutorId) return { text: 'פנוי לשיבוץ', style: { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } };

    const isActivePlaced = placements.some(p => {
      if (!p.tutor) return false;
      const pTutorStr = p.tutor._id ? String(p.tutor._id) : String(p.tutor);
      const currentTutorStr = String(tutorId);
      return pTutorStr === currentTutorStr && p.status !== 'לא פעיל';
    });

    if (isActivePlaced) {
      return { text: 'משובץ', style: { backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0' } };
    } else {
      return { text: 'פנוי לשיבוץ', style: { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } };
    }
  };

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
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/tutors', {
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
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את החונך ${name}?`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tutors/${tutorId}`, { method: 'DELETE' });
      if (response.ok) setTutors(tutors.filter(t => t._id !== tutorId));
    } catch (error) {
      alert('שגיאה במחיקת החונך');
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: '#2563eb'}} /></Container>;

  return (
    <Container className="mt-5 mb-5" dir="rtl">
      
      {/* כותרת מודרנית */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">
            ניהול חונכים
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">
            צפייה, סינון והוספת חונכים למערכת
          </p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={handleOpenAdd}>
          <FiPlus size={18} /> הוסף חונך
        </Button>
      </div>

      {/* כרטיסיית הטבלה המרחפת */}
      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          
          <div className="mb-4" style={{ maxWidth: '350px' }}>
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

          <div className="table-responsive">
            <Table hover className="align-middle border-light" style={{ color: '#334155' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiUserCheck className="me-2" /> שם החונך</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>ת.ז.</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>טלפון</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>עיר</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סטטוס שיבוץ</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredTutors.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">לא נמצאו חונכים התואמים לחיפוש.</td></tr>
                ) : (
                  filteredTutors.map((tutor) => {
                    const status = getPlacementStatus(tutor._id);

                    return (
                      <tr key={tutor._id} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onClick={() => navigate(`/tutor/${tutor._id}`)}>
                        <td className="fw-bold" style={{ color: '#2563eb', padding: '16px 12px' }}>{tutor.firstName} {tutor.lastName}</td>
                        <td style={{ color: '#475569', padding: '16px 12px' }}>{tutor.idNumber}</td>
                        <td style={{ color: '#475569', padding: '16px 12px' }} dir="ltr" className="text-end">{tutor.phone1}</td>
                        <td style={{ color: '#475569', padding: '16px 12px' }}>{tutor.city?.name || tutor.city || '-'}</td>
                        <td style={{ padding: '16px 12px' }}>
                          <span className="rounded-pill d-inline-block text-center" style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: '600', ...status.style }}>
                            {status.text}
                          </span>
                        </td>
                        <td className="text-end" style={{ padding: '16px 12px' }} onClick={(e) => e.stopPropagation()}>
                           <Button variant="light" size="sm" className="me-2 rounded-pill shadow-sm" style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', fontWeight: '500' }} onClick={(e) => { e.stopPropagation(); navigate(`/tutor/${tutor._id}`); }}>
                             <FiFileText className="me-1" /> כרטיס
                           </Button>
                           <Button variant="light" size="sm" className="rounded-pill shadow-sm" style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', fontWeight: '500' }} onClick={(e) => handleDelete(e, tutor._id, tutor.firstName)}>
                             <FiTrash2 className="me-1" /> מחק
                           </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
          
        </Card.Body>
      </Card>

      {/* חלון מודל הוספת חונך משודרג */}
      <Modal show={showAddModal} onHide={handleCloseAdd} size="lg" dir="rtl" backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>הוספת חונך חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleAddTutor}>
            
            <h6 className="fw-bold pb-2 mb-3 mt-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטים אישיים</h6>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שם פרטי *</Form.Label><Form.Control type="text" name="firstName" value={newTutor.firstName} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שם משפחה *</Form.Label><Form.Control type="text" name="lastName" value={newTutor.lastName} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>ת.ז *</Form.Label><Form.Control type="text" name="idNumber" value={newTutor.idNumber} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <Row className="mb-4">
              <Col md={4}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תאריך לידה *</Form.Label><Form.Control type="date" name="birthDate" value={newTutor.birthDate} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטי התקשרות ומגורים</h6>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>טלפון 1 *</Form.Label><Form.Control type="text" name="phone1" value={newTutor.phone1} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>טלפון 2</Form.Label><Form.Control type="text" name="phone2" value={newTutor.phone2} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>אימייל</Form.Label><Form.Control type="email" name="email" value={newTutor.email} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <Row className="mb-4">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>עיר *</Form.Label><Form.Control type="text" name="city" value={newTutor.city} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>כתובת *</Form.Label><Form.Control type="text" name="address" value={newTutor.address} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מגזר</Form.Label><Form.Control type="text" name="sector" value={newTutor.sector} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>רקע מקצועי</h6>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>ישיבה *</Form.Label><Form.Control type="text" name="yeshiva" value={newTutor.yeshiva} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>רואיין ע"י</Form.Label><Form.Control type="text" name="interviewedBy" value={newTutor.interviewedBy} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <Row className="mb-4">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שפות (מופרד בפסיקים)</Form.Label><Form.Control type="text" name="languages" placeholder="עברית, אנגלית..." value={newTutor.languages} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטי חשבון בנק</h6>
            <Row className="mb-4">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שם בנק</Form.Label><Form.Control type="text" name="bankName" value={newTutor.bankName} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סניף</Form.Label><Form.Control type="text" name="branch" value={newTutor.branch} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מספר חשבון</Form.Label><Form.Control type="text" name="accountNumber" value={newTutor.accountNumber} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הערות והמלצות</h6>
            <Row className="mb-4">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>המלצות</Form.Label><Form.Control as="textarea" rows={2} name="recommendations" value={newTutor.recommendations} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>הערות</Form.Label><Form.Control as="textarea" rows={2} name="notes" value={newTutor.notes} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <div className="d-flex justify-content-end pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button variant="light" onClick={handleCloseAdd} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>שמור חונך בענן</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Tutors;