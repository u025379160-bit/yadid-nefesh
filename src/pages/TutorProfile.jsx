import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, ListGroup, Spinner, Modal, Form } from 'react-bootstrap';
import { FiArrowRight, FiEdit2, FiUser, FiInfo, FiBriefcase, FiList, FiPhone, FiMail, FiCreditCard, FiUserPlus, FiCheckSquare, FiTrash2, FiLock, FiClock, FiPhoneCall, FiMapPin, FiFileText } from 'react-icons/fi';

function TutorProfile() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]); 
  const [tasks, setTasks] = useState([]); 
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementData, setPlacementData] = useState({
    student: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    paymentMethod: 'credit_card',
    status: 'פעיל'
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const taskTypes = ['תיעוד פעילות', 'בקשת עזרה', 'עדכון סטטוס', 'אחר'];
  const [taskData, setTaskData] = useState({
    associatedToType: 'tutor',
    associatedToId: id,
    taskType: 'תיעוד פעילות',
    content: '',
    status: 'published',
    isEncrypted: false,
    sendSystemAlert: true,
    sendEmailAlert: false
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
    };
  }, []);

  const fetchData = async () => {
    try {
      const [tutorRes, placementsRes, studentsRes, tasksRes, reportsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/tutors/${id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/placements`),
        fetch(`${import.meta.env.VITE_API_URL}/api/students`),
        fetch(`${import.meta.env.VITE_API_URL}/api/tasks`),
        fetch(`${import.meta.env.VITE_API_URL}/api/tutors/${id}/reports`).catch(() => ({ ok: false }))
      ]);

      if (tutorRes.ok) setTutor(await tutorRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      
      if (reportsRes && reportsRes.ok) {
        setReports(await reportsRes.json());
      }

      if (placementsRes.ok) {
        const allPlacements = await placementsRes.json();
        const tutorPlacements = allPlacements.filter(p => p.tutor && p.tutor._id === id);
        setPlacements(tutorPlacements);
      }

      if (tasksRes.ok) {
        const allTasks = await tasksRes.json();
        const tutorTasks = allTasks.filter(t => t.associatedToType === 'tutor' && t.associatedToId === id);
        setTasks(tutorTasks);
      }
    } catch (error) {
      console.error('שגיאה:', error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const filteredPlacements = placements.filter(p => {
    if (!p.startDate) return false;
    const pDate = new Date(p.startDate);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);
    const isStartedBySelectedMonth = pDate.getFullYear() < sYear || (pDate.getFullYear() === sYear && pDate.getMonth() + 1 <= sMonth);
    return isStartedBySelectedMonth && p.status !== 'לא פעיל';
  });

  const totalMonthlyPayment = filteredPlacements.reduce((sum, placement) => {
    return sum + (Number(placement.paymentAmount) || 0);
  }, 0);

  const filteredReports = reports.filter(r => {
    if (!r.date) return false;
    const rDate = new Date(r.date);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);
    return rDate.getFullYear() === sYear && rDate.getMonth() + 1 === sMonth;
  });

  const handleOpenEdit = () => {
    let formattedDate = '';
    if (tutor.birthDate) formattedDate = new Date(tutor.birthDate).toISOString().split('T')[0];
    setFormData({ ...tutor, birthDate: formattedDate });
    setShowEditModal(true);
  };
  
  const handleCloseEdit = () => setShowEditModal(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdateTutor = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tutors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedTutor = await response.json();
        setTutor(updatedTutor);
        setShowEditModal(false);
      } else {
        alert('שגיאה בעדכון החונך');
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    }
  };

  const handleOpenPlacement = () => setShowPlacementModal(true);
  const handleClosePlacement = () => setShowPlacementModal(false);
  const handlePlacementChange = (e) => setPlacementData({ ...placementData, [e.target.name]: e.target.value });

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...placementData, tutor: id };
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        alert('🎉 השיבוץ נוצר בהצלחה!');
        setShowPlacementModal(false);
        setPlacementData({ student: '', startDate: new Date().toISOString().split('T')[0], paymentAmount: '', paymentMethod: 'credit_card', status: 'פעיל' });
        fetchData();
      } else {
        const err = await response.json();
        alert('🔴 שגיאה ביצירת שיבוץ: ' + err.message);
      }
    } catch (error) {
      alert('🔴 שגיאת תקשורת ביצירת השיבוץ');
    }
  };

  const handleOpenTask = () => {
    setTaskData({
      associatedToType: 'tutor',
      associatedToId: id, 
      taskType: 'תיעוד פעילות',
      content: '',
      status: 'published',
      isEncrypted: false,
      sendSystemAlert: true,
      sendEmailAlert: false
    });
    setShowTaskModal(true);
  };
  
  const handleCloseTask = () => setShowTaskModal(false);
  
  const handleTaskChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setTaskData({ ...taskData, [e.target.name]: value });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setIsSavingTask(true);
    const payload = { ...taskData, createdBy: 'מערכת (מהכרטיס)' };
    
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchData();
        setShowTaskModal(false);
      } else {
        alert('שגיאה בשמירת המשימה');
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('האם למחוק משימה/תיעוד זה?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      alert('שגיאה במחיקת משימה');
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: '#2563eb'}} /></Container>;
  if (!tutor) return <Container className="mt-5 text-center"><h3 style={{color: '#64748b'}}>חונך לא נמצא 😕</h3></Container>;

  return (
    <Container className="mt-5 mb-5" dir="rtl">
      
      {/* כותרת מודרנית */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b' }} onClick={() => navigate('/tutors')} title="חזרה לרשימה">
            <FiArrowRight size={22} />
          </Button>
          <div>
            <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-0">
              {tutor.firstName} {tutor.lastName}
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">פרופיל חונך</p>
          </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={handleOpenEdit}>
          <FiEdit2 size={18} /> ערוך פרטים מלאים
        </Button>
      </div>
      
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 h-100" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Body className="p-4 p-md-5">
              <Row className="g-4">
                <Col md={6}>
                  <h6 className="fw-bold mb-4 d-flex align-items-center gap-2 pb-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>
                    <FiUser style={{ color: '#2563eb' }} /> מידע התקשרות
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>תעודת זהות</small><span className="fw-bold fs-6" style={{ color: '#0f172a' }}>{tutor.idNumber}</span></div>
                    <div className="d-flex align-items-center gap-2"><FiPhone style={{ color: '#94a3b8' }} /><span dir="ltr" className="fw-bold" style={{ color: '#0f172a' }}>{tutor.phone1}</span></div>
                    {tutor.phone2 && <div className="d-flex align-items-center gap-2"><FiPhone style={{ color: '#94a3b8' }} /><span dir="ltr" style={{ color: '#475569' }}>{tutor.phone2}</span></div>}
                    <div className="d-flex align-items-center gap-2">
                      <FiMail style={{ color: '#94a3b8' }} />
                      <span className={tutor.email ? 'fw-bold' : 'fst-italic'} style={{ color: tutor.email ? '#0f172a' : '#94a3b8' }}>{tutor.email || 'לא הוזן מייל'}</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-bold mb-4 d-flex align-items-center gap-2 pb-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>
                    <FiInfo style={{ color: '#2563eb' }} /> מידע מערכתי ופעילות
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="d-block mb-1" style={{ color: '#64748b' }}>סטטוס פעילות</small>
                      <span className="rounded-pill d-inline-block text-center" 
                            style={{ padding: '6px 16px', fontSize: '0.85rem', fontWeight: '600', 
                                     backgroundColor: tutor.status === 'לא פעיל' ? '#f1f5f9' : '#d1fae5', 
                                     color: tutor.status === 'לא פעיל' ? '#64748b' : '#059669',
                                     border: `1px solid ${tutor.status === 'לא פעיל' ? '#e2e8f0' : '#a7f3d0'}` }}>
                        {tutor.status || 'פעיל'}
                      </span>
                    </div>
                    {tutor.notes && (
                      <div className="p-3 rounded-4 mt-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <small className="fw-bold d-block mb-1" style={{ color: '#475569' }}>הערות רכז:</small>
                        <span style={{ fontSize: '0.9rem', color: '#334155' }}>{tutor.notes}</span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* אזור המידע החדש מהאפיון */}
              <Row className="mt-4 pt-4" style={{ borderTop: '2px solid #f1f5f9' }}>
                <Col md={6}>
                  <h6 className="fw-bold mb-4 d-flex align-items-center gap-2 pb-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>
                    <FiMapPin style={{ color: '#2563eb' }} /> רקע ומגורים
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>תאריך לידה</small><span className="fw-bold" style={{ color: '#0f172a' }}>{tutor.birthDate ? new Date(tutor.birthDate).toLocaleDateString('he-IL') : 'לא צוין'}</span></div>
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>עיר וכתובת</small><span className="fw-bold" style={{ color: '#0f172a' }}>{tutor.address || ''}{tutor.city ? (tutor.address ? `, ${tutor.city}` : tutor.city) : (tutor.address ? '' : 'לא צוין')}</span></div>
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>מקום לימודים</small><span className="fw-bold" style={{ color: '#0f172a' }}>{tutor.institute || 'לא צוין'}</span></div>
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>מגזר</small><span className="fw-bold" style={{ color: '#0f172a' }}>{tutor.sector || 'לא צוין'}</span></div>
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>שפות</small><span className="fw-bold" style={{ color: '#0f172a' }}>{tutor.languages || 'לא צוין'}</span></div>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold mb-4 d-flex align-items-center gap-2 pb-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>
                    <FiFileText style={{ color: '#2563eb' }} /> נתונים נוספים
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>רואיין על ידי</small><span className="fw-bold" style={{ color: '#0f172a' }}>{tutor.interviewedBy || 'לא צוין'}</span></div>
                    <div><small className="d-block mb-1" style={{ color: '#64748b' }}>פרטי חשבון בנק למלגות</small><span className="fw-bold" style={{ color: '#0f172a' }}>{tutor.bankAccount || 'לא הוזן'}</span></div>
                    {tutor.recommendations && (
                      <div>
                        <small className="d-block mb-1" style={{ color: '#64748b' }}>ממליצים:</small>
                        <div className="p-3 rounded-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                          {tutor.recommendations}
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 h-100" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center text-center">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <span className="fw-bold small" style={{ color: '#64748b' }}>בחר חודש לסיכום:</span>
                <Form.Control
                  type="month"
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '140px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="mb-3 mx-auto shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: '#eff6ff', width: '64px', height: '64px', borderRadius: '16px', color: '#2563eb' }}>
                <FiCreditCard size={30} />
              </div>
              <h6 className="fw-bold mb-2" style={{ color: '#475569' }}>סה"כ תשלום משוער לחודש זה</h6>
              <h2 className="fw-bold mb-1" style={{ color: '#2563eb', fontSize: '2.5rem', letterSpacing: '-1px' }}>
                ₪{totalMonthlyPayment.toLocaleString()}
              </h2>
              <p className="small mb-0" style={{ color: '#94a3b8' }}>מבוסס על {filteredPlacements.length} שיבוצים פעילים (בסיס גלובלי)</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={7}>
          <Card className="border-0 h-100" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: '#0f172a' }}>
                <FiBriefcase style={{ color: '#2563eb' }} /> תלמידים בטיפול החונך
              </h5>
              <Button variant="outline-primary" size="sm" className="fw-bold rounded-pill px-3 d-flex align-items-center gap-1" onClick={handleOpenPlacement}>
                <FiUserPlus /> שבץ תלמיד
              </Button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="table-responsive">
                <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>שם התלמיד</th>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>תאריך התחלה</th>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סכום</th>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-end">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlacements.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted">
                          <FiList size={30} className="mb-2 opacity-25" />
                          <p className="mb-0">אין שיבוצים פעילים בחודש זה.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPlacements.map((placement) => (
                        <tr key={placement._id}>
                          <td className="fw-bold" style={{ color: '#0f172a', padding: '16px 12px' }}>
                            {placement.student ? `${placement.student.firstName} ${placement.student.lastName}` : 'תלמיד נמחק'}
                          </td>
                          <td style={{ color: '#64748b', padding: '16px 12px' }}>{new Date(placement.startDate).toLocaleDateString('he-IL')}</td>
                          <td className="fw-bold fs-6" style={{ color: '#059669', padding: '16px 12px' }}>₪{Number(placement.paymentAmount || 0).toLocaleString()}</td>
                          <td className="text-end" style={{ padding: '16px 12px' }}>
                            <Button 
                              variant="light" 
                              size="sm"
                              className="rounded-pill shadow-sm"
                              style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', fontWeight: '600' }}
                              onClick={() => placement.student && navigate(`/student/${placement.student._id}`)}
                            >
                              לפרופיל
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
        </Col>

        <Col lg={5}>
          <Card className="border-0 h-100" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: '#0f172a' }}>
                <FiCheckSquare style={{ color: '#eab308' }} /> תיעודים ושיחות צוות
              </h5>
              <Button variant="light" size="sm" className="fw-bold rounded-pill px-3 shadow-sm" style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }} onClick={handleOpenTask}>+ תיעוד חדש</Button>
            </Card.Header>
            <Card.Body className="p-4">
              <ListGroup variant="flush">
                {tasks.length === 0 ? (
                  <div className="text-center p-4 rounded-4" style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
                    אין משימות או תיעודים לחונך זה עדיין.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const title = task.taskType || task.title || 'משימה';
                    const description = task.content || task.description;
                    const isDraft = task.status === 'draft';

                    return (
                      <ListGroup.Item key={task._id} className="px-0 py-3 border-bottom d-flex justify-content-between align-items-start bg-transparent">
                        <div className="ms-3 me-auto">
                          <div className="fw-bold mb-1" style={{ color: '#0f172a' }}>{title}</div>
                          {description && (
                            <div className="small" style={{ color: '#64748b' }}>
                              {task.isEncrypted ? <span style={{ color: '#ef4444', fontWeight: '600' }}><FiLock className="me-1"/> תוכן מוצפן</span> : description}
                            </div>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-pill d-inline-block text-center" 
                                style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '600', 
                                         backgroundColor: isDraft ? '#fef3c7' : '#e0f2fe', 
                                         color: isDraft ? '#d97706' : '#0284c7',
                                         border: `1px solid ${isDraft ? '#fde68a' : '#bae6fd'}` }}>
                            {isDraft ? 'טיוטה' : 'פורסם'}
                          </span>
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="rounded-circle d-flex align-items-center justify-content-center" 
                            style={{ width: '32px', height: '32px', color: '#ef4444', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}
                            onClick={() => handleDeleteTask(task._id)}
                            title="מחק תיעוד"
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </div>
                      </ListGroup.Item>
                    );
                  })
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col>
          <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: '#0f172a' }}>
                <FiPhoneCall style={{ color: '#10b981' }} /> היסטוריית דיווחי שעות (מרכזייה טלפונית)
              </h5>
              <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                חודש: {selectedMonth}
              </Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="table-responsive">
                <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>תאריך דיווח</th>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>עבור תלמיד</th>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>שעת התחלה</th>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>שעת סיום</th>
                      <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סה"כ שעות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                            <FiClock size={24} />
                          </div>
                          <h6 className="fw-bold" style={{ color: '#64748b' }}>אין דיווחי שעות לחודש זה</h6>
                          <p className="small mb-0" style={{ color: '#94a3b8' }}>כאן יופיעו הדיווחים שיתקבלו אוטומטית ממערכת ה-IVR (קול כשר).</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report, idx) => (
                        <tr key={idx}>
                          <td style={{ color: '#0f172a', fontWeight: '500' }}>{new Date(report.date).toLocaleDateString('he-IL')}</td>
                          <td style={{ color: '#475569' }}>{report.studentName || 'לא צוין'}</td>
                          <td style={{ color: '#64748b' }}>{report.startTime}</td>
                          <td style={{ color: '#64748b' }}>{report.endTime}</td>
                          <td className="fw-bold" style={{ color: '#2563eb' }}>{report.totalHours} שעות</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- חלון עריכת פרטי חונך - מעודכן עם כל השדות --- */}
      <Modal show={showEditModal} onHide={handleCloseEdit} size="xl" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>עריכת פרטי חונך מלאים</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Form onSubmit={handleUpdateTutor}>
                
                <h6 className="fw-bold mb-3 pb-2 mt-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטים בסיסיים ויצירת קשר</h6>
                <Row className="mb-3">
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שם פרטי</Form.Label><Form.Control type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required style={{ borderRadius: '8px' }}/></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שם משפחה</Form.Label><Form.Control type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} required style={{ borderRadius: '8px' }}/></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>טלפון ראשי</Form.Label><Form.Control type="text" name="phone1" value={formData.phone1 || ''} onChange={handleChange} required style={{ borderRadius: '8px' }}/></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>אימייל</Form.Label><Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} style={{ borderRadius: '8px' }}/></Form.Group></Col>
                </Row>
                
                <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>נתונים אישיים ומגורים</h6>
                <Row className="mb-3">
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תאריך לידה</Form.Label><Form.Control type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} style={{ borderRadius: '8px' }}/></Form.Group></Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>עיר מגורים</Form.Label>
                      <Form.Select name="city" value={formData.city || ''} onChange={handleChange} style={{ borderRadius: '8px' }}>
                        <option value="">-- בחר עיר --</option>
                        <option value="ירושלים">ירושלים</option>
                        <option value="בני ברק">בני ברק</option>
                        <option value="אשדוד">אשדוד</option>
                        <option value="בית שמש">בית שמש</option>
                        <option value="אחר">אחר</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>כתובת מדויקת</Form.Label><Form.Control type="text" name="address" value={formData.address || ''} onChange={handleChange} placeholder="רחוב ומספר בית" style={{ borderRadius: '8px' }}/></Form.Group></Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מגזר</Form.Label><Form.Control type="text" name="sector" value={formData.sector || ''} onChange={handleChange} placeholder="לדוגמה: כללי" style={{ borderRadius: '8px' }}/></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מקום לימודים</Form.Label><Form.Control type="text" name="institute" value={formData.institute || ''} onChange={handleChange} placeholder="הכנס מוסד לימודים" style={{ borderRadius: '8px' }}/></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>שפות שיחה</Form.Label><Form.Control type="text" name="languages" value={formData.languages || ''} onChange={handleChange} placeholder="עברית, אנגלית..." style={{ borderRadius: '8px' }}/></Form.Group></Col>
                </Row>

                <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>מידע פיננסי וראיונות</h6>
                <Row className="mb-3">
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>פרטי חשבון בנק למלגות</Form.Label><Form.Control type="text" name="bankAccount" value={formData.bankAccount || ''} onChange={handleChange} placeholder="שם בנק, סניף, מספר חשבון" style={{ borderRadius: '8px' }}/></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold" style={{ color: '#64748b' }}>רואיין על ידי</Form.Label><Form.Control type="text" name="interviewedBy" value={formData.interviewedBy || ''} onChange={handleChange} placeholder="שם המראיין" style={{ borderRadius: '8px' }}/></Form.Group></Col>
                </Row>
                
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>ממליצים</Form.Label>
                  <Form.Control as="textarea" rows={2} name="recommendations" value={formData.recommendations || ''} onChange={handleChange} placeholder="שמות ומספרי טלפון של ממליצים..." style={{ borderRadius: '8px' }}/>
                </Form.Group>

                <h6 className="fw-bold mb-3 pb-2 mt-4" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הגדרות מערכת (פנימי)</h6>
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סטטוס פעילות</Form.Label>
                      <Form.Select name="status" value={formData.status || 'פעיל'} onChange={handleChange} style={{ borderRadius: '8px' }}>
                        <option value="פעיל">פעיל</option>
                        <option value="לא פעיל">לא פעיל</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>הערות רכז</Form.Label>
                      <Form.Control as="textarea" rows={1} name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="הערות אישיות לצוות..." style={{ borderRadius: '8px' }}/>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end pt-3 mt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <Button variant="light" onClick={handleCloseEdit} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
                  <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>שמור שינויים</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

      <Modal show={showPlacementModal} onHide={handleClosePlacement} dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>שיבוץ תלמיד לחונך</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleAddPlacement}>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>בחר תלמיד מרשימת התלמידים *</Form.Label>
                  <Form.Select name="student" required value={placementData.student} onChange={handlePlacementChange} style={{ borderRadius: '8px' }}>
                    <option value="">-- בחר תלמיד --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName} (ת.ז: {s.idNumber})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תאריך התחלה *</Form.Label>
                      <Form.Control type="date" name="startDate" required value={placementData.startDate} onChange={handlePlacementChange} style={{ borderRadius: '8px' }}/>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סכום חיוב חודשי (₪) *</Form.Label>
                      <Form.Control type="number" name="paymentAmount" required placeholder="לדוגמה: 1500" value={placementData.paymentAmount} onChange={handlePlacementChange} style={{ borderRadius: '8px' }}/>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end pt-3 mt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <Button variant="light" onClick={handleClosePlacement} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
                  <Button variant="primary" type="submit" className="rounded-pill shadow-sm d-flex align-items-center gap-2" style={{ fontWeight: '600', padding: '8px 24px' }}>
                    <FiUserPlus /> צור שיבוץ עכשיו
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

      <Modal show={showTaskModal} onHide={handleCloseTask} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>יצירת תיעוד / דיווח לחונך</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleAddTask}>
                
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סוג המשימה *</Form.Label>
                      <Form.Select name="taskType" value={taskData.taskType} onChange={handleTaskChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                        {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תוכן המשימה / תיעוד *</Form.Label>
                  <Form.Control as="textarea" rows={5} name="content" value={taskData.content} onChange={handleTaskChange} placeholder="הקלד את פרטי הדיווח כאן..." required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>

                <div className="p-3 mb-4" style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h6 className="fw-bold mb-3 pb-2" style={{ color: '#334155', borderBottom: '1px solid #e2e8f0' }}>הגדרות אבטחה והתראות</h6>
                  <Form.Check type="checkbox" id="isEncrypted" name="isEncrypted" label={<span style={{ color: '#ef4444', fontWeight: '600' }}><FiLock className="me-1" /> הצפן תוכן משימה (יוצג רק למורשים)</span>} checked={taskData.isEncrypted} onChange={handleTaskChange} className="mb-2" />
                  <Form.Check type="checkbox" id="sendSystemAlert" name="sendSystemAlert" label={<span style={{ color: '#475569' }}>שלח התראת מערכת לנמענים</span>} checked={taskData.sendSystemAlert} onChange={handleTaskChange} className="mb-2" />
                  <Form.Check type="checkbox" id="sendEmailAlert" name="sendEmailAlert" label={<span style={{ color: '#475569' }}>שלח התראה במייל לנמענים</span>} checked={taskData.sendEmailAlert} onChange={handleTaskChange} />
                </div>

                <div className="d-flex justify-content-between align-items-center pt-3 mt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <Form.Select name="status" value={taskData.status} onChange={handleTaskChange} style={{ width: '160px', borderRadius: '8px', fontWeight: '600' }}>
                    <option value="published">🟢 פרסם מיד</option>
                    <option value="draft">🟡 שמור כטיוטה</option>
                  </Form.Select>
                  
                  <div>
                    <Button variant="light" onClick={handleCloseTask} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
                    <Button variant="primary" type="submit" disabled={isSavingTask} className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>
                      {isSavingTask ? <Spinner size="sm" animation="border" /> : 'שמור משימה'}
                    </Button>
                  </div>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default TutorProfile;