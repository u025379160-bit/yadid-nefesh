import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Modal, Row, Col, Badge } from 'react-bootstrap';
import { FiSearch, FiPlus, FiBriefcase, FiTrash2, FiFileText, FiUser, FiInfo, FiDollarSign, FiEdit2, FiCalendar } from 'react-icons/fi';
import Select from 'react-select';

function Placements() {
  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]); 
  const [tutors, setTutors] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlacement, setNewPlacement] = useState({
    student: '', tutor: '', startDate: '', paymentMethod: 'גלובלי',
    city: '', yeshiva: '', coordinator: '', placementType: '', 
    paymentAmount: '', studyHours: '', estimatedMonthlyMeetings: '', status: 'פעיל'
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsRes, studentsRes, tutorsRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/api/placements'),
          fetch(import.meta.env.VITE_API_URL + '/api/students'),
          fetch(import.meta.env.VITE_API_URL + '/api/tutors')
        ]);

        if (placementsRes.ok && studentsRes.ok && tutorsRes.ok) {
          setPlacements(await placementsRes.json());
          setStudents(await studentsRes.json());
          setTutors(await tutorsRes.json());
        }
      } catch (error) {
        console.error('שגיאה בשליפת נתונים:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPlacements = placements.filter(placement => {
    const tutorName = placement.tutor ? `${placement.tutor.firstName} ${placement.tutor.lastName}` : '';
    const studentName = placement.student ? `${placement.student.firstName} ${placement.student.lastName}` : '';
    return tutorName.includes(searchTerm) || studentName.includes(searchTerm);
  });

  const handleOpenAdd = () => setShowAddModal(true);
  const handleCloseAdd = () => {
    setShowAddModal(false);
    setNewPlacement({
      student: '', tutor: '', startDate: '', paymentMethod: 'גלובלי',
      city: '', yeshiva: '', coordinator: '', placementType: '', 
      paymentAmount: '', studyHours: '', estimatedMonthlyMeetings: '', status: 'פעיל'
    });
  };

  const handleAddChange = (e) => setNewPlacement({ ...newPlacement, [e.target.name]: e.target.value });

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    if (!newPlacement.student || !newPlacement.tutor) {
      alert("חובה לבחור חונך ותלמיד מהרשימה!");
      return;
    }
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlacement),
      });
      if (response.ok) {
        const placementsRes = await fetch(import.meta.env.VITE_API_URL + '/api/placements');
        setPlacements(await placementsRes.json());
        handleCloseAdd();
      } else {
        alert('שגיאה ביצירת השיבוץ');
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    }
  };

  const handleOpenDetails = (placement) => {
    const placementData = { ...placement };
    if (placementData.startDate) {
      placementData.startDate = new Date(placementData.startDate).toISOString().split('T')[0];
    }
    placementData.studentId = placement.student ? placement.student._id : '';
    placementData.tutorId = placement.tutor ? placement.tutor._id : '';

    setSelectedPlacement(placementData);
    setEditMode(false);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedPlacement(null);
    setEditMode(false);
  };

  const handleDetailsChange = (e) => {
    setSelectedPlacement({ ...selectedPlacement, [e.target.name]: e.target.value });
  };

  const handleUpdatePlacement = async (e) => {
    e.preventDefault();
    
    const cleanPayload = {
      student: selectedPlacement.studentId,
      tutor: selectedPlacement.tutorId,
      status: selectedPlacement.status,
      startDate: selectedPlacement.startDate,
      paymentMethod: selectedPlacement.paymentMethod,
      paymentAmount: selectedPlacement.paymentAmount,
      estimatedMonthlyMeetings: selectedPlacement.estimatedMonthlyMeetings,
      city: selectedPlacement.city,
      yeshiva: selectedPlacement.yeshiva,
      coordinator: selectedPlacement.coordinator,
      studyHours: selectedPlacement.studyHours
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/placements/${selectedPlacement._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });

      if (response.ok) {
        const placementsRes = await fetch(import.meta.env.VITE_API_URL + '/api/placements');
        setPlacements(await placementsRes.json());
        handleCloseDetails();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`שגיאה מהשרת: ${errorData.message || errorData.error || 'לא ניתן לעדכן את השיבוץ'}`);
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    }
  };

  const handleDelete = async (placementId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק שיבוץ זה?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/placements/${placementId}`, { method: 'DELETE' });
      if (response.ok) {
        setPlacements(placements.filter(p => p._id !== placementId));
        if (showDetailsModal && selectedPlacement && selectedPlacement._id === placementId) {
            handleCloseDetails();
        }
      }
    } catch (error) {
      alert('שגיאה במחיקת השיבוץ');
    }
  };

  const studentOptions = students.map(s => ({
    value: s._id,
    label: `${s.firstName} ${s.lastName}`
  }));

  const tutorOptions = tutors.map(t => ({
    value: t._id,
    label: `${t.firstName} ${t.lastName} ${t.city?.name || t.city ? `(${t.city?.name || t.city})` : ''}`
  }));

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: '#2563eb'}} /></Container>;

  return (
    <Container className="mt-5 mb-5" dir="rtl">
      
      {/* כותרת מודרנית */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">ניהול שיבוצים</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">מעקב, עדכון ויצירת חיבורים בין חונכים לתלמידים</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={handleOpenAdd}>
          <FiPlus size={18} /> שיבוץ חדש
        </Button>
      </div>

      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          
          <div className="mb-4" style={{ maxWidth: '400px' }}>
            <InputGroup className="shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <InputGroup.Text style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                <FiSearch color="#94a3b8" />
              </InputGroup.Text>
              <Form.Control
                placeholder="חיפוש לפי שם חונך או תלמיד..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRight: 'none', boxShadow: 'none', padding: '10px' }}
              />
            </InputGroup>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiBriefcase className="me-2" /> חונך</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiUser className="me-2" /> תלמיד</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiCalendar className="me-2" /> תאריך התחלה</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}><FiDollarSign className="me-1" /> סוג תשלום</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סטטוס</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlacements.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">לא נמצאו שיבוצים.</td></tr>
                ) : (
                  filteredPlacements.map((placement) => (
                    <tr key={placement._id}>
                      <td className="fw-bold" style={{ color: '#2563eb', padding: '16px 12px' }}>{placement.tutor ? `${placement.tutor.firstName} ${placement.tutor.lastName}` : 'נמחק'}</td>
                      <td className="fw-bold" style={{ color: '#0f172a', padding: '16px 12px' }}>{placement.student ? `${placement.student.firstName} ${placement.student.lastName}` : 'נמחק'}</td>
                      <td style={{ color: '#64748b', padding: '16px 12px' }}>{placement.startDate ? new Date(placement.startDate).toLocaleDateString('he-IL') : '-'}</td>
                      <td style={{ color: '#475569', padding: '16px 12px' }}>{placement.paymentMethod}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span className="rounded-pill d-inline-block text-center" 
                              style={{ 
                                padding: '4px 12px', fontSize: '0.85rem', fontWeight: '600', 
                                backgroundColor: placement.status === 'פעיל' ? '#d1fae5' : '#f1f5f9', 
                                color: placement.status === 'פעיל' ? '#059669' : '#64748b',
                                border: `1px solid ${placement.status === 'פעיל' ? '#a7f3d0' : '#e2e8f0'}`
                              }}>
                          {placement.status || 'פעיל'}
                        </span>
                      </td>
                      <td className="text-end" style={{ padding: '16px 12px', minWidth: '150px' }}>
                         <Button 
                            variant="light" 
                            size="sm" 
                            className="me-2 rounded-pill shadow-sm"
                            style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}
                            onClick={() => handleOpenDetails(placement)}
                         >
                           <FiFileText className="me-1" /> פרטים
                         </Button>
                         <Button 
                            variant="light" 
                            size="sm" 
                            className="rounded-pill shadow-sm" 
                            style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}
                            onClick={() => handleDelete(placement._id)}
                         >
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

      {/* מודל יצירת שיבוץ */}
      <Modal show={showAddModal} onHide={handleCloseAdd} size="lg" dir="rtl" backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>יצירת שיבוץ חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff', minHeight: '60vh', overflow: 'visible' }}>
          <Form onSubmit={handleAddPlacement}>
            <h6 className="fw-bold mb-3 pb-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>משתתפים (חובה)</h6>
            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>בחר תלמיד *</Form.Label>
                  <Select
                    options={studentOptions}
                    value={studentOptions.find(opt => opt.value === newPlacement.student) || null}
                    placeholder="הקלד שם לחיפוש..."
                    noOptionsMessage={() => "לא נמצאו תלמידים"}
                    isSearchable isClearable isRtl
                    onChange={(selected) => setNewPlacement({ ...newPlacement, student: selected ? selected.value : '' })}
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px', borderColor: '#e2e8f0'}) }}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>בחר חונך *</Form.Label>
                  <Select
                    options={tutorOptions}
                    value={tutorOptions.find(opt => opt.value === newPlacement.tutor) || null}
                    placeholder="הקלד שם לחיפוש..."
                    noOptionsMessage={() => "לא נמצאו חונכים"}
                    isSearchable isClearable isRtl
                    onChange={(selected) => setNewPlacement({ ...newPlacement, tutor: selected ? selected.value : '' })}
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px', borderColor: '#e2e8f0'}) }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטי השיבוץ</h6>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תאריך התחלה *</Form.Label><Form.Control type="date" name="startDate" value={newPlacement.startDate} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סוג תשלום *</Form.Label><Form.Select name="paymentMethod" value={newPlacement.paymentMethod} onChange={handleAddChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}><option value="גלובלי">גלובלי</option><option value="שעתי">שעתי</option><option value="ישן">ישן</option></Form.Select></Form.Group></Col>
            </Row>
            
            <Row className="mb-4">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סכום תשלום ₪</Form.Label><Form.Control type="number" name="paymentAmount" value={newPlacement.paymentAmount} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מפגשים משוערים בחודש</Form.Label><Form.Control type="number" name="estimatedMonthlyMeetings" value={newPlacement.estimatedMonthlyMeetings} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>מידע נוסף (אופציונלי)</h6>
            <Row className="mb-3">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>עיר השיבוץ</Form.Label><Form.Control type="text" name="city" value={newPlacement.city} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>ישיבה</Form.Label><Form.Control type="text" name="yeshiva" value={newPlacement.yeshiva} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <Row className="mb-4">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>רכז אחראי</Form.Label><Form.Control type="text" name="coordinator" value={newPlacement.coordinator} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שעות לימוד</Form.Label><Form.Control type="text" name="studyHours" value={newPlacement.studyHours} onChange={handleAddChange} placeholder="למשל: 16:00-18:00" style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <div className="d-flex justify-content-end pt-4 mt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button variant="light" onClick={handleCloseAdd} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>צור שיבוץ 🔗</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* מודל פרטים / עריכה */}
      <Modal show={showDetailsModal} onHide={handleCloseDetails} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>
            {editMode ? 'עריכת שיבוץ' : 'פרטי שיבוץ'}
          </Modal.Title>
        </Modal.Header>
        
        {selectedPlacement && (
          <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff', minHeight: '50vh', overflow: 'visible' }}>
            
            {!editMode && (
                <div className="text-center mb-4 p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                        <span className="fw-bold fs-4" style={{ color: '#2563eb' }}>{selectedPlacement.tutor ? `${selectedPlacement.tutor.firstName} ${selectedPlacement.tutor.lastName}` : 'נמחק'}</span>
                        <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}>
                          <FiBriefcase style={{ color: '#64748b' }} size={20} />
                        </div>
                        <span className="fw-bold fs-4" style={{ color: '#0f172a' }}>{selectedPlacement.student ? `${selectedPlacement.student.firstName} ${selectedPlacement.student.lastName}` : 'נמחק'}</span>
                    </div>
                    <span className="rounded-pill d-inline-block text-center" 
                          style={{ 
                            padding: '6px 16px', fontSize: '0.9rem', fontWeight: '600', 
                            backgroundColor: selectedPlacement.status === 'פעיל' ? '#d1fae5' : '#f1f5f9', 
                            color: selectedPlacement.status === 'פעיל' ? '#059669' : '#64748b',
                            border: `1px solid ${selectedPlacement.status === 'פעיל' ? '#a7f3d0' : '#e2e8f0'}`
                          }}>
                      {selectedPlacement.status || 'פעיל'}
                    </span>
                </div>
            )}

            <div>
              {editMode ? (
                <Form onSubmit={handleUpdatePlacement}>
                  <h6 className="fw-bold mb-3 pb-2 mt-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>משתתפים וסטטוס</h6>
                  <Row className="mb-4">
                      <Col>
                          <Form.Group>
                              <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תלמיד</Form.Label>
                              <Select
                                  options={studentOptions}
                                  value={studentOptions.find(opt => opt.value === selectedPlacement.studentId) || null}
                                  onChange={(selected) => setSelectedPlacement({ ...selectedPlacement, studentId: selected ? selected.value : '' })}
                                  isSearchable isClearable isRtl
                                  menuPortalTarget={document.body}
                                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px', borderColor: '#e2e8f0'}) }}
                              />
                          </Form.Group>
                      </Col>
                      <Col>
                          <Form.Group>
                              <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>חונך</Form.Label>
                              <Select
                                  options={tutorOptions}
                                  value={tutorOptions.find(opt => opt.value === selectedPlacement.tutorId) || null}
                                  onChange={(selected) => setSelectedPlacement({ ...selectedPlacement, tutorId: selected ? selected.value : '' })}
                                  isSearchable isClearable isRtl
                                  menuPortalTarget={document.body}
                                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px', borderColor: '#e2e8f0'}) }}
                              />
                          </Form.Group>
                      </Col>
                  </Row>
                  <Row className="mb-4">
                      <Col md={6}>
                          <Form.Group>
                              <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סטטוס שיבוץ</Form.Label>
                              <Form.Select name="status" value={selectedPlacement.status || 'פעיל'} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                  <option value="פעיל">פעיל</option>
                                  <option value="לא פעיל">לא פעיל</option>
                              </Form.Select>
                          </Form.Group>
                      </Col>
                  </Row>

                  <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטים כספיים</h6>
                  <Row className="mb-3">
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תאריך התחלה</Form.Label><Form.Control type="date" name="startDate" value={selectedPlacement.startDate || ''} onChange={handleDetailsChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סוג תשלום</Form.Label><Form.Select name="paymentMethod" value={selectedPlacement.paymentMethod || 'גלובלי'} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}><option value="גלובלי">גלובלי</option><option value="שעתי">שעתי</option><option value="ישן">ישן</option></Form.Select></Form.Group></Col>
                  </Row>
                  <Row className="mb-4">
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סכום תשלום ₪</Form.Label><Form.Control type="number" name="paymentAmount" value={selectedPlacement.paymentAmount || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מפגשים בחודש</Form.Label><Form.Control type="number" name="estimatedMonthlyMeetings" value={selectedPlacement.estimatedMonthlyMeetings || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                  </Row>

                  <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>מידע נוסף</h6>
                  <Row className="mb-3">
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>עיר</Form.Label><Form.Control type="text" name="city" value={selectedPlacement.city || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>ישיבה</Form.Label><Form.Control type="text" name="yeshiva" value={selectedPlacement.yeshiva || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                  </Row>
                  <Row className="mb-4">
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>רכז</Form.Label><Form.Control type="text" name="coordinator" value={selectedPlacement.coordinator || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שעות לימוד</Form.Label><Form.Control type="text" name="studyHours" value={selectedPlacement.studyHours || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                  </Row>

                  <div className="d-flex justify-content-end pt-4 mt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
                    <Button variant="light" onClick={() => setEditMode(false)} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
                    <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>שמור שינויים</Button>
                  </div>
                </Form>
              ) : (
                <div>
                  <Row className="g-4 mb-4">
                      <Col md={6}>
                          <div className="p-4 rounded-4 h-100" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}><FiDollarSign style={{ color: '#2563eb' }} /> כספים ותאריכים</h6>
                            <div className="d-flex flex-column gap-3">
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">תאריך התחלה</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.startDate ? new Date(selectedPlacement.startDate).toLocaleDateString('he-IL') : '-'}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">סוג תשלום</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.paymentMethod || '-'}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">סכום תשלום</small><span className="fw-bold" style={{ color: '#059669', fontSize: '1.1rem' }}>₪{selectedPlacement.paymentAmount || 0}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">מפגשים בחודש</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.estimatedMonthlyMeetings || '-'}</span></div>
                            </div>
                          </div>
                      </Col>
                      <Col md={6}>
                          <div className="p-4 rounded-4 h-100" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}><FiInfo style={{ color: '#2563eb' }} /> מידע נוסף</h6>
                            <div className="d-flex flex-column gap-3">
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">עיר</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.city || '-'}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">ישיבה</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.yeshiva || '-'}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">רכז אחראי</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.coordinator || '-'}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">שעות לימוד</small><span className="fw-bold" dir="ltr" style={{ color: '#334155' }}>{selectedPlacement.studyHours || '-'}</span></div>
                            </div>
                          </div>
                      </Col>
                  </Row>
                  <div className="d-flex justify-content-between pt-4 mt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <Button variant="light" className="rounded-pill shadow-sm" style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '8px 20px', fontWeight: '600' }} onClick={() => handleDelete(selectedPlacement._id)}>
                          <FiTrash2 className="me-2" /> מחק שיבוץ
                      </Button>
                      <Button variant="primary" className="rounded-pill shadow-sm" style={{ padding: '8px 24px', fontWeight: '600' }} onClick={() => setEditMode(true)}>
                          <FiEdit2 className="me-2"/> ערוך פרטים
                      </Button>
                  </div>
                </div>
              )}
            </div>
          </Modal.Body>
        )}
      </Modal>

    </Container>
  );
}

export default Placements;