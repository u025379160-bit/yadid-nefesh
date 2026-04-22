import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Modal, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { FiSearch, FiPlus, FiBriefcase, FiTrash2, FiFileText, FiUser, FiInfo, FiDollarSign, FiEdit2, FiCalendar, FiAlertCircle, FiCheckCircle, FiShield } from 'react-icons/fi';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';

function Placements() {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]); 
  const [tutors, setTutors] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlacement, setNewPlacement] = useState({
    student: '', tutor: '', startDate: '', paymentMethod: 'גלובלי',
    city: '', yeshiva: '', coordinator: '', placementType: '', 
    paymentAmount: '', studyHours: '', estimatedMonthlyMeetings: '', status: 'פעיל',
    guidanceStatus: 'ממתין להדרכה', requireMonthlyGuidance: true
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const [guidancePlacement, setGuidancePlacement] = useState(null);
  const [guidanceSummary, setGuidanceSummary] = useState('');
  const [isSavingGuidance, setIsSavingGuidance] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

  let displayedPlacements = placements.filter(placement => {
    const tutorName = placement.tutor ? `${placement.tutor.firstName} ${placement.tutor.lastName}` : '';
    const studentName = placement.student ? `${placement.student.firstName} ${placement.student.lastName}` : '';
    const matchesSearch = tutorName.includes(searchTerm) || studentName.includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && placement.status === filterStatus;
  });

  displayedPlacements.sort((a, b) => {
    if (a.status === 'פעיל' && b.status !== 'פעיל') return -1;
    if (a.status !== 'פעיל' && b.status === 'פעיל') return 1;
    return 0;
  });

  const activePlacements = placements.filter(p => p.status === 'פעיל');
  const waitingForGuidance = activePlacements.filter(p => p.guidanceStatus === 'ממתין להדרכה');
  const receivedGuidance = activePlacements.filter(p => p.guidanceStatus === 'קיבל הדרכה');
  const percentageCompleted = activePlacements.length === 0 ? 0 : Math.round((receivedGuidance.length / activePlacements.length) * 100);

  const handleOpenGuidanceModal = (e, placement) => {
    e.stopPropagation(); 
    
    if (placement.guidanceStatus === 'קיבל הדרכה') {
      toggleGuidanceStatus(placement, 'ממתין להדרכה');
    } else {
      setGuidancePlacement(placement);
      setGuidanceSummary('');
      setShowGuidanceModal(true);
    }
  };

  const handleSubmitGuidanceSummary = async (e) => {
    e.preventDefault();
    if (!guidanceSummary.trim()) return;
    
    setIsSavingGuidance(true);
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          associatedToType: 'placement',
          associatedToId: guidancePlacement._id,
          taskType: 'הדרכה',
          content: `סיכום שיחת הדרכה חודשית:\n${guidanceSummary}`,
          status: 'published',
          createdBy: 'צוות הדרכה' 
        })
      });

      await fetch(`${import.meta.env.VITE_API_URL}/api/placements/${guidancePlacement._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidanceStatus: 'קיבל הדרכה' })
      });

      fetchData(); 
      setShowGuidanceModal(false);
    } catch (error) {
      alert('שגיאה בשמירת סיכום ההדרכה');
    } finally {
      setIsSavingGuidance(false);
    }
  };

  const toggleGuidanceStatus = async (placement, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/placements/${placement._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidanceStatus: newStatus })
      });
      if (response.ok) {
        setPlacements(placements.map(p => p._id === placement._id ? { ...p, guidanceStatus: newStatus } : p));
      }
    } catch (error) {
      alert('שגיאת תקשורת מול השרת');
    }
  };

  const handleOpenAdd = () => setShowAddModal(true);
  const handleCloseAdd = () => {
    setShowAddModal(false);
    setNewPlacement({
      student: '', tutor: '', startDate: '', paymentMethod: 'גלובלי',
      city: '', yeshiva: '', coordinator: '', placementType: '', 
      paymentAmount: '', studyHours: '', estimatedMonthlyMeetings: '', status: 'פעיל',
      guidanceStatus: 'ממתין להדרכה', requireMonthlyGuidance: true
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
        fetchData();
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
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSelectedPlacement({ ...selectedPlacement, [e.target.name]: value });
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
      studyHours: selectedPlacement.studyHours,
      requireMonthlyGuidance: selectedPlacement.requireMonthlyGuidance,
      guidanceStatus: selectedPlacement.guidanceStatus
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/placements/${selectedPlacement._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });

      if (response.ok) {
        fetchData();
        handleCloseDetails();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`שגיאה מהשרת: ${errorData.message || errorData.error || 'לא ניתן לעדכן את השיבוץ'}`);
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    }
  };

  const handleDelete = async (placementId, e) => {
    if(e) e.stopPropagation();
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

  const studentOptions = students.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName}` }));
  const tutorOptions = tutors.map(t => ({ value: t._id, label: `${t.firstName} ${t.lastName} ${t.city?.name || t.city ? `(${t.city?.name || t.city})` : ''}` }));

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: '#2563eb'}} /></Container>;

  return (
    <Container className="pt-4 pb-2" dir="rtl" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      
      <div className="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">ניהול שיבוצים</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">מעקב, יצירת חיבורים וניהול הדרכות חונכים</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={handleOpenAdd}>
          <FiPlus size={18} /> שיבוץ חדש
        </Button>
      </div>

      <Row className="mb-4 g-3 flex-shrink-0">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: '16px' }}>
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-danger fw-bold mb-1 small">ממתינים להדרכה</p>
                <h3 className="fw-bold text-danger mb-0">{waitingForGuidance.length} שיבוצים</h3>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', backgroundColor: '#fee2e2' }}>
                <FiAlertCircle size={24} className="text-danger" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px' }}>
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-success fw-bold mb-1 small">קיבלו הדרכה החודש</p>
                <h3 className="fw-bold text-success mb-0">{receivedGuidance.length} חונכים</h3>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', backgroundColor: '#dcfce7' }}>
                <FiCheckCircle size={24} className="text-success" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body className="d-flex flex-column justify-content-center">
              <div className="d-flex justify-content-between align-items-end mb-2">
                <span className="fw-bold text-muted small"><FiShield className="me-1"/> יעד חודשי (הדרכות)</span>
                <span className="fw-bold fs-5">{percentageCompleted}%</span>
              </div>
              <ProgressBar 
                now={percentageCompleted} 
                variant={percentageCompleted < 50 ? 'danger' : percentageCompleted < 80 ? 'warning' : 'success'} 
                style={{ height: '8px', borderRadius: '10px' }} 
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 flex-grow-1" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Card.Body className="p-4 d-flex flex-column" style={{ minHeight: 0 }}>
          
          <div className="d-flex flex-column flex-md-row gap-3 mb-4 flex-shrink-0" style={{ maxWidth: '650px' }}>
            <InputGroup className="shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', flex: 2 }}>
              <InputGroup.Text style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                <FiSearch color="#94a3b8" />
              </InputGroup.Text>
              <Form.Control
                placeholder="חיפוש לפי שם חונך או תלמיד..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRight: 'none', boxShadow: 'none', padding: '10px' }}
              />
            </InputGroup>
            
            {/* 🔥 פה התיקון לחץ! הוספתי המחלקה custom-select-arrow שמרווחת אותו ב-CSS למטה 🔥 */}
            <Form.Select 
              className="shadow-sm custom-select-arrow"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flex: 1, fontWeight: '600', color: '#475569', padding: '10px' }}
            >
              <option value="all">כל השיבוצים</option>
              <option value="פעיל">פעילים בלבד</option>
              <option value="לא פעיל">לא פעילים (היסטוריה)</option>
            </Form.Select>
          </div>

          <div className="table-responsive placement-table-container flex-grow-1" style={{ overflowY: 'auto', borderRadius: '8px', minHeight: 0 }}>
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px', boxShadow: '0 2px 4px -2px rgba(0,0,0,0.1)' }}><FiBriefcase className="me-2" /> חונך</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px', boxShadow: '0 2px 4px -2px rgba(0,0,0,0.1)' }}><FiUser className="me-2" /> תלמיד</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px', boxShadow: '0 2px 4px -2px rgba(0,0,0,0.1)' }}><FiCalendar className="me-2" /> תאריך התחלה</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px', textAlign: 'center', boxShadow: '0 2px 4px -2px rgba(0,0,0,0.1)' }}>סטטוס שיבוץ</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px', textAlign: 'center', boxShadow: '0 2px 4px -2px rgba(0,0,0,0.1)' }}>סטטוס הדרכה</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px', boxShadow: '0 2px 4px -2px rgba(0,0,0,0.1)' }} className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {displayedPlacements.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">לא נמצאו שיבוצים מתאימים.</td></tr>
                ) : (
                  displayedPlacements.map((placement) => {
                    const isWaitingGuidance = placement.guidanceStatus === 'ממתין להדרכה';
                    const isPlacementActive = placement.status === 'פעיל';

                    return (
                      <tr 
                        key={placement._id} 
                        style={{ opacity: isPlacementActive ? 1 : 0.6, transition: 'all 0.2s ease' }}
                        className="placement-row"
                      >
                        <td className="fw-bold" style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleOpenDetails(placement)}>
                          {placement.tutor ? (
                            <span 
                              className="profile-link" 
                              style={{ color: '#2563eb' }}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/tutors/${placement.tutor._id}`); 
                              }}
                            >
                              {placement.tutor.firstName} {placement.tutor.lastName}
                            </span>
                          ) : 'נמחק'}
                        </td>
                        
                        <td className="fw-bold" style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleOpenDetails(placement)}>
                          {placement.student ? (
                            <span 
                              className="profile-link" 
                              style={{ color: '#0f172a' }}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/students/${placement.student._id}`); 
                              }}
                            >
                              {placement.student.firstName} {placement.student.lastName}
                            </span>
                          ) : 'נמחק'}
                        </td>

                        <td style={{ color: '#64748b', padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleOpenDetails(placement)}>
                            {placement.startDate ? new Date(placement.startDate).toLocaleDateString('he-IL') : '-'}
                        </td>
                        
                        <td className="text-center" style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => handleOpenDetails(placement)}>
                          <span className="rounded-pill d-inline-block text-center" 
                                style={{ 
                                  padding: '4px 12px', fontSize: '0.85rem', fontWeight: '600', 
                                  backgroundColor: isPlacementActive ? '#d1fae5' : '#f1f5f9', 
                                  color: isPlacementActive ? '#059669' : '#64748b',
                                  border: `1px solid ${isPlacementActive ? '#a7f3d0' : '#e2e8f0'}`
                                }}>
                            {placement.status || 'פעיל'}
                          </span>
                        </td>

                        <td className="text-center" style={{ padding: '10px 12px' }}>
                          {isPlacementActive ? (
                            <Button 
                              variant={isWaitingGuidance ? 'outline-danger' : 'success'} 
                              size="sm"
                              className="rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-1"
                              onClick={(e) => handleOpenGuidanceModal(e, placement)}
                              style={{ width: '135px', justifyContent: 'center', transition: 'all 0.2s ease', borderWidth: '1px' }}
                            >
                              {isWaitingGuidance ? (
                                <><FiAlertCircle size={14} /> דורש הדרכה</>
                              ) : (
                                <><FiCheckCircle size={14} /> קיבל הדרכה</>
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted small">- לא רלוונטי -</span>
                          )}
                        </td>

                        <td className="text-end" style={{ padding: '10px 12px', minWidth: '150px' }}>
                          <Button 
                              variant="light" 
                              size="sm" 
                              className="me-2 rounded-pill shadow-sm"
                              style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}
                              onClick={(e) => { e.stopPropagation(); handleOpenDetails(placement); }}
                          >
                            <FiFileText className="me-1" /> פרטים
                          </Button>
                          <Button 
                              variant="light" 
                              size="sm" 
                              className="rounded-pill shadow-sm" 
                              style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}
                              onClick={(e) => handleDelete(placement._id, e)}
                          >
                            <FiTrash2 className="me-1" /> מחק
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </Table>
          </div>
          
        </Card.Body>
      </Card>

      <Modal show={showGuidanceModal} onHide={() => setShowGuidanceModal(false)} dir="rtl" backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>סיכום שיחת הדרכה</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p style={{ color: '#475569', fontSize: '0.95rem' }} className="mb-4">
            על מנת לסמן את החונך כ"קיבל הדרכה", אנא הקלד סיכום קצר של השיחה שהתקיימה. הסיכום יישמר אוטומטית ביומן המשימות תחת תיק השיבוץ.
          </p>
          <Form onSubmit={handleSubmitGuidanceSummary}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>תוכן השיחה / נקודות לשימור ושיפור *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                required
                placeholder="החונך הגיע לפגישה וסיפר ש..."
                value={guidanceSummary}
                onChange={(e) => setGuidanceSummary(e.target.value)}
                style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="light" onClick={() => setShowGuidanceModal(false)} className="me-2 rounded-pill" style={{ fontWeight: '600' }}>ביטול</Button>
              <Button variant="success" type="submit" className="rounded-pill shadow-sm" disabled={isSavingGuidance} style={{ fontWeight: '600' }}>
                {isSavingGuidance ? <Spinner size="sm" /> : 'שמור סיכום ואשר הדרכה ✔️'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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

            <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הגדרות והדרכות</h6>
            <Row className="mb-3">
              <Col>
                <Form.Check 
                  type="switch"
                  id="require-guidance-switch"
                  label={<span className="fw-bold small" style={{ color: '#64748b' }}>הפעל תזכורות הדרכה חודשיות לשיבוץ זה</span>}
                  checked={newPlacement.requireMonthlyGuidance}
                  onChange={(e) => setNewPlacement({ ...newPlacement, requireMonthlyGuidance: e.target.checked })}
                />
              </Col>
            </Row>
            <Row className="mb-4">
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>עיר השיבוץ</Form.Label><Form.Control type="text" name="city" value={newPlacement.city} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>ישיבה</Form.Label><Form.Control type="text" name="yeshiva" value={newPlacement.yeshiva} onChange={handleAddChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>

            <div className="d-flex justify-content-end pt-4 mt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button variant="light" onClick={handleCloseAdd} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>צור שיבוץ 🔗</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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

                  <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הגדרות והדרכה</h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סטטוס הדרכה נוכחי</Form.Label>
                        <Form.Select name="guidanceStatus" value={selectedPlacement.guidanceStatus || 'ממתין להדרכה'} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                          <option value="ממתין להדרכה">ממתין להדרכה</option>
                          <option value="קיבל הדרכה">קיבל הדרכה</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Check 
                        type="switch"
                        id="require-guidance-switch-edit"
                        name="requireMonthlyGuidance"
                        label={<span className="fw-bold small mt-1 d-inline-block" style={{ color: '#64748b' }}>דרוש הדרכה חודשית</span>}
                        checked={selectedPlacement.requireMonthlyGuidance ?? true}
                        onChange={handleDetailsChange}
                        className="mt-4"
                      />
                    </Col>
                  </Row>
                  <Row className="mb-4">
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>עיר</Form.Label><Form.Control type="text" name="city" value={selectedPlacement.city || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
                    <Col><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>רכז</Form.Label><Form.Control type="text" name="coordinator" value={selectedPlacement.coordinator || ''} onChange={handleDetailsChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
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
                            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}><FiInfo style={{ color: '#2563eb' }} /> מידע נוסף והדרכה</h6>
                            <div className="d-flex flex-column gap-3">
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">סטטוס הדרכה נוכחי</small><Badge bg={selectedPlacement.guidanceStatus === 'קיבל הדרכה' ? 'success' : 'danger'} className="rounded-pill px-3">{selectedPlacement.guidanceStatus || 'ממתין להדרכה'}</Badge></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">עיר / ישיבה</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.city || '-'} / {selectedPlacement.yeshiva || '-'}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">רכז אחראי</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.coordinator || '-'}</span></div>
                                <div><small style={{ color: '#64748b' }} className="d-block mb-1">הדרכה חודשית</small><span className="fw-bold" style={{ color: '#334155' }}>{selectedPlacement.requireMonthlyGuidance ? 'פעיל (נשלח תזכורות)' : 'כבוי'}</span></div>
                            </div>
                          </div>
                      </Col>
                  </Row>
                  <div className="d-flex justify-content-between pt-4 mt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <Button variant="light" className="rounded-pill shadow-sm" style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '8px 20px', fontWeight: '600' }} onClick={(e) => handleDelete(selectedPlacement._id, e)}>
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
      
      <style>{`
        .placement-row:hover {
          background-color: #f1f5f9;
        }
        .profile-link:hover {
          text-decoration: underline;
        }
        .placement-table-container::-webkit-scrollbar {
          width: 8px;
        }
        .placement-table-container::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 8px;
        }
        .placement-table-container::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 8px;
        }
        .placement-table-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
        /* 🔥 הפקודה שמתקנת את החץ ב-Select 🔥 */
        .custom-select-arrow {
          background-position: left 15px center !important;
          padding-left: 50px !important;
        }
      `}</style>
    </Container>
  );
}

export default Placements;