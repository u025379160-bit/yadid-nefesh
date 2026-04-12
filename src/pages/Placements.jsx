import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Modal, Row, Col, Badge } from 'react-bootstrap';
import { FiSearch, FiPlus, FiBriefcase, FiTrash2, FiFileText, FiUser, FiInfo, FiDollarSign, FiEdit2 } from 'react-icons/fi';
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
          fetch('https://yadid-nefesh-server.onrender.com/api/placements'),
          fetch('https://yadid-nefesh-server.onrender.com/api/students'),
          fetch('https://yadid-nefesh-server.onrender.com/api/tutors')
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
      const response = await fetch('https://yadid-nefesh-server.onrender.com/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlacement),
      });
      if (response.ok) {
        const placementsRes = await fetch('https://yadid-nefesh-server.onrender.com/api/placements');
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
    
    // התיקון שלנו: יוצרים אובייקט נקי שכולל רק את מה שהשרת אמור לקבל
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
      const response = await fetch(`https://yadid-nefesh-server.onrender.com/api/placements/${selectedPlacement._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });

      if (response.ok) {
        const placementsRes = await fetch('https://yadid-nefesh-server.onrender.com/api/placements');
        setPlacements(await placementsRes.json());
        handleCloseDetails();
      } else {
        // שיפרנו את הודעת השגיאה כדי לדעת מה השרת רוצה
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
      const response = await fetch(`https://yadid-nefesh-server.onrender.com/api/placements/${placementId}`, { method: 'DELETE' });
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

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: 'var(--primary-accent)'}} /></Container>;

  return (
    <Container className="mt-4" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">
            ניהול שיבוצים
          </h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">
            מעקב, עדכון ויצירת חיבורים בין חונכים לתלמידים
          </p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleOpenAdd}>
          <FiPlus /> צור שיבוץ חדש
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
                placeholder="חיפוש לפי שם חונך או תלמיד..."
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
                  <th><FiBriefcase className="me-2" /> שם החונך</th>
                  <th>שם התלמיד</th>
                  <th>תאריך התחלה</th>
                  <th>סוג תשלום</th>
                  <th>סטטוס</th>
                  <th className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlacements.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">לא נמצאו שיבוצים.</td></tr>
                ) : (
                  filteredPlacements.map((placement) => (
                    <tr key={placement._id}>
                      <td className="fw-bold" style={{ color: 'var(--primary-accent)' }}>{placement.tutor ? `${placement.tutor.firstName} ${placement.tutor.lastName}` : 'נמחק'}</td>
                      <td className="fw-bold" style={{ color: 'var(--text-main)' }}>{placement.student ? `${placement.student.firstName} ${placement.student.lastName}` : 'נמחק'}</td>
                      <td className="text-muted">{placement.startDate ? new Date(placement.startDate).toLocaleDateString('he-IL') : '-'}</td>
                      <td className="text-muted">{placement.paymentMethod}</td>
                      <td>
                        <span className={`badge ${placement.status === 'פעיל' ? 'bg-success' : 'bg-secondary'}`} style={{ opacity: '0.9', padding: '6px 12px' }}>
                          {placement.status || 'פעיל'}
                        </span>
                      </td>
                      <td className="text-end">
                         <Button 
                            variant="light" 
                            size="sm" 
                            className="me-2 text-primary border"
                            onClick={() => handleOpenDetails(placement)}
                         >
                           <FiFileText className="me-1" /> פרטים
                         </Button>
                         <Button variant="light" size="sm" className="text-danger border" onClick={() => handleDelete(placement._id)}>
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

      <Modal show={showAddModal} onHide={handleCloseAdd} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>יצירת שיבוץ חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light" style={{ minHeight: '60vh', overflow: 'visible' }}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleAddPlacement}>
                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-2">משתתפים (חובה)</h6>
                <Row className="mb-4">
                  <Col>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">בחר תלמיד *</Form.Label>
                      <Select
                        options={studentOptions}
                        value={studentOptions.find(opt => opt.value === newPlacement.student) || null}
                        placeholder="הקלד שם לחיפוש..."
                        noOptionsMessage={() => "לא נמצאו תלמידים"}
                        isSearchable isClearable isRtl
                        onChange={(selected) => setNewPlacement({ ...newPlacement, student: selected ? selected.value : '' })}
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px'}) }}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">בחר חונך *</Form.Label>
                      <Select
                        options={tutorOptions}
                        value={tutorOptions.find(opt => opt.value === newPlacement.tutor) || null}
                        placeholder="הקלד שם לחיפוש..."
                        noOptionsMessage={() => "לא נמצאו חונכים"}
                        isSearchable isClearable isRtl
                        onChange={(selected) => setNewPlacement({ ...newPlacement, tutor: selected ? selected.value : '' })}
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px'}) }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">פרטי השיבוץ</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">תאריך התחלה *</Form.Label><Form.Control type="date" name="startDate" value={newPlacement.startDate} onChange={handleAddChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">סוג תשלום *</Form.Label><Form.Select name="paymentMethod" value={newPlacement.paymentMethod} onChange={handleAddChange} required><option value="גלובלי">גלובלי</option><option value="שעתי">שעתי</option><option value="ישן">ישן</option></Form.Select></Form.Group></Col>
                </Row>
                
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">סכום תשלום ₪</Form.Label><Form.Control type="number" name="paymentAmount" value={newPlacement.paymentAmount} onChange={handleAddChange} /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">מפגשים משוערים בחודש</Form.Label><Form.Control type="number" name="estimatedMonthlyMeetings" value={newPlacement.estimatedMonthlyMeetings} onChange={handleAddChange} /></Form.Group></Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">מידע נוסף (אופציונלי)</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">עיר השיבוץ</Form.Label><Form.Control type="text" name="city" value={newPlacement.city} onChange={handleAddChange} /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">ישיבה</Form.Label><Form.Control type="text" name="yeshiva" value={newPlacement.yeshiva} onChange={handleAddChange} /></Form.Group></Col>
                </Row>
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">רכז אחראי</Form.Label><Form.Control type="text" name="coordinator" value={newPlacement.coordinator} onChange={handleAddChange} /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שעות לימוד</Form.Label><Form.Control type="text" name="studyHours" value={newPlacement.studyHours} onChange={handleAddChange} placeholder="למשל: 16:00-18:00" /></Form.Group></Col>
                </Row>

                <div className="d-flex justify-content-end pt-3 border-top">
                  <Button variant="light" onClick={handleCloseAdd} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">צור שיבוץ 🔗</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

      <Modal show={showDetailsModal} onHide={handleCloseDetails} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>
            {editMode ? 'עריכת שיבוץ' : 'פרטי שיבוץ'}
          </Modal.Title>
        </Modal.Header>
        
        {selectedPlacement && (
          <Modal.Body className="bg-light p-4" style={{ minHeight: '50vh', overflow: 'visible' }}>
            
            {!editMode && (
                <div className="text-center mb-4">
                    <div className="d-flex justify-content-center align-items-center gap-3 mb-2">
                        <span className="fw-bold fs-5 text-primary">{selectedPlacement.tutor ? `${selectedPlacement.tutor.firstName} ${selectedPlacement.tutor.lastName}` : 'נמחק'}</span>
                        <FiBriefcase className="text-muted" size={20} />
                        <span className="fw-bold fs-5">{selectedPlacement.student ? `${selectedPlacement.student.firstName} ${selectedPlacement.student.lastName}` : 'נמחק'}</span>
                    </div>
                    <Badge bg={selectedPlacement.status === 'פעיל' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill">
                        {selectedPlacement.status || 'פעיל'}
                    </Badge>
                </div>
            )}

            <Card className="border-0 shadow-sm">
              <Card.Body>
                {editMode ? (
                  <Form onSubmit={handleUpdatePlacement}>
                    <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-2">משתתפים וסטטוס</h6>
                    <Row className="mb-4">
                        <Col>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">תלמיד</Form.Label>
                                <Select
                                    options={studentOptions}
                                    value={studentOptions.find(opt => opt.value === selectedPlacement.studentId) || null}
                                    onChange={(selected) => setSelectedPlacement({ ...selectedPlacement, studentId: selected ? selected.value : '' })}
                                    isSearchable isClearable isRtl
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px'}) }}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">חונך</Form.Label>
                                <Select
                                    options={tutorOptions}
                                    value={tutorOptions.find(opt => opt.value === selectedPlacement.tutorId) || null}
                                    onChange={(selected) => setSelectedPlacement({ ...selectedPlacement, tutorId: selected ? selected.value : '' })}
                                    isSearchable isClearable isRtl
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px'}) }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">סטטוס שיבוץ</Form.Label>
                                <Form.Select name="status" value={selectedPlacement.status || 'פעיל'} onChange={handleDetailsChange}>
                                    <option value="פעיל">פעיל</option>
                                    <option value="לא פעיל">לא פעיל</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">פרטים כספיים</h6>
                    <Row className="mb-3">
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">תאריך התחלה</Form.Label><Form.Control type="date" name="startDate" value={selectedPlacement.startDate || ''} onChange={handleDetailsChange} required /></Form.Group></Col>
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">סוג תשלום</Form.Label><Form.Select name="paymentMethod" value={selectedPlacement.paymentMethod || 'גלובלי'} onChange={handleDetailsChange}><option value="גלובלי">גלובלי</option><option value="שעתי">שעתי</option><option value="ישן">ישן</option></Form.Select></Form.Group></Col>
                    </Row>
                    <Row className="mb-4">
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">סכום תשלום ₪</Form.Label><Form.Control type="number" name="paymentAmount" value={selectedPlacement.paymentAmount || ''} onChange={handleDetailsChange} /></Form.Group></Col>
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">מפגשים בחודש</Form.Label><Form.Control type="number" name="estimatedMonthlyMeetings" value={selectedPlacement.estimatedMonthlyMeetings || ''} onChange={handleDetailsChange} /></Form.Group></Col>
                    </Row>

                    <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">מידע נוסף</h6>
                    <Row className="mb-3">
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">עיר</Form.Label><Form.Control type="text" name="city" value={selectedPlacement.city || ''} onChange={handleDetailsChange} /></Form.Group></Col>
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">ישיבה</Form.Label><Form.Control type="text" name="yeshiva" value={selectedPlacement.yeshiva || ''} onChange={handleDetailsChange} /></Form.Group></Col>
                    </Row>
                    <Row className="mb-4">
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">רכז</Form.Label><Form.Control type="text" name="coordinator" value={selectedPlacement.coordinator || ''} onChange={handleDetailsChange} /></Form.Group></Col>
                      <Col><Form.Group><Form.Label className="small fw-bold text-muted">שעות לימוד</Form.Label><Form.Control type="text" name="studyHours" value={selectedPlacement.studyHours || ''} onChange={handleDetailsChange} /></Form.Group></Col>
                    </Row>

                    <div className="d-flex justify-content-end pt-3 border-top">
                      <Button variant="light" onClick={() => setEditMode(false)} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                      <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור שינויים</Button>
                    </div>
                  </Form>
                ) : (
                  <div>
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <h6 className="fw-bold text-muted mb-3 d-flex align-items-center gap-2 border-bottom pb-2"><FiDollarSign /> כספים ותאריכים</h6>
                            <div className="d-flex flex-column gap-2">
                                <div><small className="text-muted d-block">תאריך התחלה</small><span className="fw-bold">{selectedPlacement.startDate ? new Date(selectedPlacement.startDate).toLocaleDateString('he-IL') : '-'}</span></div>
                                <div><small className="text-muted d-block">סוג תשלום</small><span className="fw-bold">{selectedPlacement.paymentMethod || '-'}</span></div>
                                <div><small className="text-muted d-block">סכום תשלום</small><span className="fw-bold text-primary">₪{selectedPlacement.paymentAmount || 0}</span></div>
                                <div><small className="text-muted d-block">מפגשים בחודש</small><span className="fw-bold">{selectedPlacement.estimatedMonthlyMeetings || '-'}</span></div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <h6 className="fw-bold text-muted mb-3 d-flex align-items-center gap-2 border-bottom pb-2"><FiInfo /> מידע נוסף</h6>
                            <div className="d-flex flex-column gap-2">
                                <div><small className="text-muted d-block">עיר</small><span className="fw-bold">{selectedPlacement.city || '-'}</span></div>
                                <div><small className="text-muted d-block">ישיבה</small><span className="fw-bold">{selectedPlacement.yeshiva || '-'}</span></div>
                                <div><small className="text-muted d-block">רכז אחראי</small><span className="fw-bold">{selectedPlacement.coordinator || '-'}</span></div>
                                <div><small className="text-muted d-block">שעות לימוד</small><span className="fw-bold" dir="ltr">{selectedPlacement.studyHours || '-'}</span></div>
                            </div>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-between pt-3 border-top">
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(selectedPlacement._id)}>
                            <FiTrash2 className="me-1" /> מחק שיבוץ
                        </Button>
                        <Button variant="primary" className="px-4 fw-bold" onClick={() => setEditMode(true)}>
                            <FiEdit2 className="me-2"/> ערוך פרטים
                        </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Modal.Body>
        )}
      </Modal>

    </Container>
  );
}

export default Placements;