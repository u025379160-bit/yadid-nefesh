import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, ListGroup, Spinner, Modal, Form } from 'react-bootstrap';
import { FiArrowRight, FiEdit2, FiUser, FiMapPin, FiFileText, FiCheckSquare, FiTrash2, FiCreditCard, FiUserPlus, FiUserCheck, FiSettings, FiLock, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import Select from 'react-select'; 

function StudentProfile() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [tasks, setTasks] = useState([]); 
  const [placements, setPlacements] = useState([]); 
  const [payers, setPayers] = useState([]); 
  const [tutors, setTutors] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  const [showPayerEditModal, setShowPayerEditModal] = useState(false);
  const [payerFormData, setPayerFormData] = useState({});

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const taskTypes = ['תיעוד פעילות', 'בקשת עזרה', 'עדכון סטטוס', 'אחר'];
  const [taskData, setTaskData] = useState({
    associatedToType: 'student',
    associatedToId: id, 
    taskType: 'תיעוד פעילות',
    content: '',
    status: 'published',
    isEncrypted: false,
    sendSystemAlert: true,
    sendEmailAlert: false
  });

  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementData, setPlacementData] = useState({
    tutor: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    paymentMethod: 'credit_card',
    status: 'פעיל'
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
      const [studentRes, tasksRes, placementsRes, payersRes, tutorsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}/tasks`), 
        fetch(`${import.meta.env.VITE_API_URL}/api/placements`),
        fetch(`${import.meta.env.VITE_API_URL}/api/payers`),
        fetch(`${import.meta.env.VITE_API_URL}/api/tutors`) 
      ]);

      if (studentRes.ok) setStudent(await studentRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (payersRes.ok) setPayers(await payersRes.json());
      if (tutorsRes.ok) setTutors(await tutorsRes.json());
      
      if (placementsRes.ok) {
        const allPlacements = await placementsRes.json();
        const myPlacements = allPlacements.filter(p => p.student && p.student._id === id);
        setPlacements(myPlacements);
      }

    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleOpenPayerEdit = () => {
    const activePayer = payers.find(p => p._id === (student.payer?._id || student.payer));
    if (activePayer) {
      setPayerFormData(activePayer);
      setShowPayerEditModal(true);
    }
  };

  const handlePayerChange = (e) => {
    setPayerFormData({ ...payerFormData, [e.target.name]: e.target.value });
  };

  const handleUpdatePayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payers/${payerFormData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payerFormData),
      });
      if (response.ok) {
        setShowPayerEditModal(false);
        fetchData(); 
      } else {
        alert('שגיאה בעדכון המשלם');
      }
    } catch (error) {
      alert('שגיאת תקשורת בעדכון המשלם');
    }
  };

  const handleQuickSetPayer = async () => {
    if (!student.fatherName) {
      alert("יש להזין שם אב בפרטי התלמיד לפני שניתן להגדירו כמשלם.");
      return;
    }

    const existingPayer = payers.find(p => p.name.trim() === student.fatherName.trim());

    if (existingPayer) {
      if (window.confirm(`💡 מצאנו במערכת משלם קיים בשם "${existingPayer.name}".\n\nהאם ברצונך לשייך את התלמיד אליו?`)) {
        try {
          setLoading(true);
          const studentUpdateRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payer: existingPayer._id }),
          });
          if (studentUpdateRes.ok) {
            fetchData(); 
          }
        } catch (error) {
          alert("שגיאה בתהליך השיוך: " + error.message);
        } finally {
          setLoading(false);
        }
        return; 
      }
    }

    if (!window.confirm(`האם להקים באופן אוטומטי משלם חדש בשם "${student.fatherName}" ולשייך לתלמיד?`)) return;

    try {
      setLoading(true);
      const payerRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.fatherName,
          identifier: student.idNumber + "-P",
          phone: student.phone1,
          payerType: 'individual',
          notes: `נוצר אוטומטית עבור התלמיד ${student.firstName}`
        }),
      });

      if (!payerRes.ok) throw new Error("שגיאה ביצירת המשלם");
      const newPayer = await payerRes.json();

      const studentUpdateRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payer: newPayer._id }),
      });

      if (studentUpdateRes.ok) {
        fetchData(); 
      }
    } catch (error) {
      alert("שגיאה בתהליך: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlacements = placements.filter(p => {
    if (!p.startDate) return false;
    const pDate = new Date(p.startDate);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);
    const isStartedBySelectedMonth = pDate.getFullYear() < sYear || (pDate.getFullYear() === sYear && pDate.getMonth() + 1 <= sMonth);
    return isStartedBySelectedMonth && p.status !== 'לא פעיל';
  });

  const totalMonthlyCost = filteredPlacements.reduce((sum, placement) => {
    return sum + (Number(placement.paymentAmount) || 0);
  }, 0);

  const handleOpenEdit = () => {
    let formattedDate = '';
    if (student.birthDate) formattedDate = new Date(student.birthDate).toISOString().split('T')[0];
    const payerId = student.payer?._id || student.payer || '';
    setFormData({ 
      ...student, 
      birthDate: formattedDate, 
      payer: payerId,
      contacts: student.contacts || [] 
    });
    setShowEditModal(true);
  };
  
  const handleCloseEdit = () => setShowEditModal(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // פונקציות ניהול אנשי קשר בעריכה
  const handleAddContact = () => {
    setFormData({ ...formData, contacts: [...(formData.contacts || []), { name: '', phone: '', relation: '' }] });
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

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStudent(await response.json());
        setShowEditModal(false);
        fetchData();
      } else {
        alert('שגיאה בעדכון התלמיד');
      }
    } catch (error) {
      alert('שגיאת תקשורת עם השרת');
    }
  };

  const handleOpenTask = () => {
    setTaskData({
      associatedToType: 'student',
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
        const tasksRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}/tasks`);
        if (tasksRes.ok) setTasks(await tasksRes.json());
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
    if (!window.confirm('האם למחוק משימה זו?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      alert('שגיאה במחיקת משימה');
    }
  };

  const handleOpenPlacement = () => setShowPlacementModal(true);
  const handleClosePlacement = () => setShowPlacementModal(false);
  const handlePlacementChange = (e) => setPlacementData({ ...placementData, [e.target.name]: e.target.value });

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...placementData, student: id }; 
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (response.ok) {
        setShowPlacementModal(false);
        setPlacementData({ tutor: '', startDate: new Date().toISOString().split('T')[0], paymentAmount: '', paymentMethod: 'credit_card', status: 'פעיל' });
        fetchData();
      } else {
        const err = await response.json();
        alert('🔴 שגיאה ביצירת שיבוץ: ' + err.message);
      }
    } catch (error) {
      alert('🔴 שגיאת תקשורת ביצירת השיבוץ');
    }
  };

  const payerOptions = payers.map(payer => ({
    value: payer._id,
    label: `${payer.name} (${payer.identifier}) - ${payer.payerType === 'individual' ? 'אדם פרטי' : 'מוסד'}`
  }));

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: 'var(--primary-accent)'}} /></Container>;
  if (!student) return <Container className="mt-5 text-center"><h3>תלמיד לא נמצא 😕</h3></Container>;

  const activePayerObj = payers.find(p => p._id === (student.payer?._id || student.payer));
  const activePayerName = activePayerObj ? activePayerObj.name : 'ללא שיוך';

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="border shadow-sm text-muted p-2" onClick={() => navigate('/students')} title="חזרה לרשימה">
            <FiArrowRight size={20} />
          </Button>
          <div>
            <h3 style={{ color: 'var(--text-main)', fontWeight: '800' }} className="mb-0">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-muted mb-0">פרופיל תלמיד</p>
          </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={handleOpenEdit}>
          <FiEdit2 /> ערוך פרטים וגביה
        </Button>
      </div>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 p-md-5">
              <Row className="g-4">
                
                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiUser /> פרטים אישיים
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="text-muted d-block">תעודת זהות</small><span className="fw-bold" style={{ color: 'var(--text-main)' }}>{student.idNumber}</span></div>
                    <div><small className="text-muted d-block">תאריך לידה</small><span className="fw-bold">{student.birthDate ? new Date(student.birthDate).toLocaleDateString('he-IL') : '-'}</span></div>
                    <div><small className="text-muted d-block">הורים</small><span className="fw-bold">{student.fatherName || '-'} ו{student.motherName || '-'}</span></div>
                    <div><small className="text-muted d-block">מוסד לימודי</small><span className="fw-bold">{student.institute || 'לא צוין'}</span></div>
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiMapPin /> התקשרות וגביה
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="text-muted d-block">טלפונים</small>
                      <span dir="ltr" className="fw-bold text-primary d-block">{student.phone1}</span>
                      {student.phone2 && <span dir="ltr" className="text-muted small d-block">{student.phone2}</span>}
                      {student.phone3 && <span dir="ltr" className="text-muted small d-block">{student.phone3}</span>}
                    </div>
                    <div><small className="text-muted d-block">אימייל</small><span className="fw-bold">{student.email || '-'}</span></div>
                    <div><small className="text-muted d-block">כתובת</small><span className="fw-bold">{student.address || 'לא צוינה'}, מיקוד: {student.zipCode || '-'}</span></div>
                    
                    <div className="p-3 rounded border mt-2" style={{ backgroundColor: activePayerObj ? '#f0fdf4' : '#fff5f5', borderColor: activePayerObj ? '#bbf7d0' : '#fecaca' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted fw-bold small"><FiCreditCard className="me-1"/> משלם קבוע</small>
                        {!activePayerObj ? (
                          <Button variant="link" className="p-0 text-decoration-none small fw-bold" onClick={handleQuickSetPayer} style={{fontSize: '0.75rem'}}>
                            <FiUserCheck className="me-1"/> הגדר אבא כמשלם
                          </Button>
                        ) : (
                          <div className="d-flex gap-2">
                            <Button variant="link" className="p-0 text-primary text-decoration-none small fw-bold" onClick={handleOpenEdit} style={{fontSize: '0.75rem'}}>
                              <FiUserCheck className="me-1"/> החלף משלם
                            </Button>
                            <Button variant="link" className="p-0 text-muted text-decoration-none small fw-bold" onClick={handleOpenPayerEdit} style={{fontSize: '0.75rem'}}>
                              <FiSettings className="me-1"/> ערוך
                            </Button>
                          </div>
                        )}
                      </div>
                      <span className={`fw-bold ${activePayerObj ? 'text-success' : 'text-danger'}`}>{activePayerName}</span>
                    </div>
                  </div>
                </Col>

              </Row>

              {/* הצגת אנשי קשר נוספים */}
              {student.contacts && student.contacts.length > 0 && (
                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold text-muted mb-3">אנשי קשר נוספים</h6>
                  <Row className="g-3">
                    {student.contacts.map((contact, idx) => (
                      <Col md={4} key={idx}>
                        <div className="p-2 border rounded bg-light">
                          <div className="fw-bold small">{contact.name} ({contact.relation})</div>
                          <div className="text-muted small" dir="ltr">{contact.phone}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center text-center">
              
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <span className="fw-bold text-muted small">בחר חודש לסיכום:</span>
                <Form.Control
                  type="month"
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '140px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>

              <div className="mb-3 mx-auto shadow-sm" style={{ backgroundColor: '#fff', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>
                <FiCreditCard size={28} />
              </div>
              <h6 className="fw-bold text-muted mb-2">עלות חונכויות לחודש זה</h6>
              <h2 className="display-5 fw-bold mb-1" style={{ color: 'var(--primary-accent)' }}>
                ₪{totalMonthlyCost.toLocaleString()}
              </h2>
              <p className="text-muted small mb-0">מבוסס על {filteredPlacements.length} שיבוצים פעילים</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--text-main)' }}>
                <FiFileText className="text-primary" /> חונכים פעילים בחודש זה
              </h5>
              <Button variant="outline-primary" size="sm" className="fw-bold rounded-pill px-3 d-flex align-items-center gap-1" onClick={handleOpenPlacement}>
                <FiUserPlus /> שבץ חונך
              </Button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-muted fw-bold border-0 rounded-start">שם החונך</th>
                      <th className="text-muted fw-bold border-0">סטטוס</th>
                      <th className="text-muted fw-bold border-0">עלות שוטפת</th>
                      <th className="text-muted fw-bold border-0 rounded-end text-end">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlacements.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">אין שיבוצים פעילים לתלמיד זה בחודש הנבחר.</td>
                      </tr>
                    ) : (
                      filteredPlacements.map(placement => (
                        <tr key={placement._id}>
                          <td className="fw-bold" style={{ color: 'var(--text-main)' }}>
                            {placement.tutor ? `${placement.tutor.firstName} ${placement.tutor.lastName}` : 'חונך נמחק'}
                          </td>
                          <td>
                            <Badge bg={placement.status === 'פעיל' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill">
                              {placement.status || 'פעיל'}
                            </Badge>
                          </td>
                          <td className="fw-bold text-primary">₪{Number(placement.paymentAmount || 0).toLocaleString()}</td>
                          <td className="text-end">
                            <Button 
                              variant="light" 
                              size="sm"
                              className="text-primary border fw-bold"
                              onClick={() => placement.tutor && navigate(`/tutor/${placement.tutor._id}`)}
                            >
                              לפרופיל החונך
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
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--text-main)' }}>
                <FiCheckSquare className="text-warning" /> משימות ותיעוד
              </h5>
              <Button variant="outline-primary" size="sm" className="fw-bold rounded-pill px-3" onClick={handleOpenTask}>+ משימה/תיעוד</Button>
            </Card.Header>
            <Card.Body className="p-4">
              <ListGroup variant="flush">
                {tasks.length === 0 ? (
                  <div className="text-center p-4 text-muted bg-light rounded" style={{ border: '1px dashed var(--border-color)' }}>
                    אין משימות או תיעוד לתלמיד זה עדיין.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const title = task.taskType || task.title || 'משימה';
                    const description = task.content || task.description;
                    const badgeText = task.urgency || (task.status === 'draft' ? 'טיוטה' : 'פורסם');
                    const badgeBg = task.urgency === 'דחוף' ? 'danger' : task.urgency === 'השבוע' ? 'warning' : task.status === 'draft' ? 'warning' : 'info';

                    return (
                      <ListGroup.Item key={task._id} className="px-0 py-3 border-bottom d-flex justify-content-between align-items-start">
                        <div className="ms-2 me-auto">
                          <div className="fw-bold" style={{ color: 'var(--text-main)' }}>{title}</div>
                          {description && (
                            <small className="text-muted">
                              {task.isEncrypted ? <span className="text-danger fw-bold"><FiLock className="me-1"/> תוכן מוצפן</span> : description}
                            </small>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <Badge bg={badgeBg} className="rounded-pill">
                            {badgeText}
                          </Badge>
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="border text-danger" 
                            onClick={() => handleDeleteTask(task._id)}
                            title="מחק משימה"
                          >
                            <FiTrash2 />
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

      {/* --- חלון עריכת פרטי תלמיד --- */}
      <Modal show={showEditModal} onHide={handleCloseEdit} size="xl" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>עריכת פרטי תלמיד מלאים</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4" style={{ minHeight: '60vh', overflow: 'visible' }}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleUpdateStudent}>
                
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group className="p-3 bg-white border rounded">
                      <Form.Label className="fw-bold text-primary small mb-2 d-flex align-items-center gap-2">
                        <FiUser /> שיוך למשלם קבוע (ארנק חיוב)
                      </Form.Label>
                      <Select
                        options={payerOptions}
                        value={payerOptions.find(opt => opt.value === formData.payer) || null}
                        onChange={(selected) => setFormData({ ...formData, payer: selected ? selected.value : '' })}
                        placeholder="הקלד שם משלם לחיפוש..."
                        isSearchable isClearable isRtl
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px'}) }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">פרטים בסיסיים</h6>
                <Row className="mb-3">
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-muted">שם פרטי</Form.Label><Form.Control type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required /></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-muted">שם משפחה</Form.Label><Form.Control type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} required /></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/>תעודת זהות</Form.Label><Form.Control type="text" name="idNumber" value={formData.idNumber || ''} onChange={handleChange} required className="bg-light border-danger" /></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/>תאריך לידה</Form.Label><Form.Control type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} required className="bg-light border-danger"/></Form.Group></Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">הורים ומוסד לימודים</h6>
                <Row className="mb-3">
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">שם האב</Form.Label><Form.Control type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">שם האם</Form.Label><Form.Control type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} /></Form.Group></Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">מוסד לימודי</Form.Label>
                      <Form.Select name="institute" value={formData.institute || ''} onChange={handleChange}>
                        <option value="">-- בחר מוסד --</option>
                        <option value="מוסד א">מוסד א</option>
                        <option value="מוסד ב">מוסד ב</option>
                        <option value="מוסד ג">מוסד ג</option>
                        <option value="אחר">אחר</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">דרכי התקשרות (מוצפן)</h6>
                <Row className="mb-3">
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/>טלפון 1</Form.Label><Form.Control type="text" name="phone1" value={formData.phone1 || ''} onChange={handleChange} required className="bg-light border-danger"/></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/>טלפון 2</Form.Label><Form.Control type="text" name="phone2" value={formData.phone2 || ''} onChange={handleChange} className="bg-light border-danger"/></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/>טלפון 3</Form.Label><Form.Control type="text" name="phone3" value={formData.phone3 || ''} onChange={handleChange} className="bg-light border-danger"/></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/>אימייל</Form.Label><Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} className="bg-light border-danger"/></Form.Group></Col>
                </Row>

                <Row className="mb-4">
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold text-muted">כתובת מגורים</Form.Label><Form.Control type="text" name="address" value={formData.address || ''} onChange={handleChange} /></Form.Group></Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">עיר</Form.Label>
                      <Form.Select name="city" value={formData.city || ''} onChange={handleChange}>
                        <option value="507f1f77bcf86cd799439011">ירושלים</option>
                        <option value="507f1f77bcf86cd799439012">בני ברק</option>
                        <option value="507f1f77bcf86cd799439013">בית שמש</option>
                        <option value="507f1f77bcf86cd799439014">אחר</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}><Form.Group><Form.Label className="small fw-bold text-muted">מיקוד</Form.Label><Form.Control type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleChange} /></Form.Group></Col>
                </Row>

                <div className="mt-4 p-3 bg-light rounded border">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">אנשי קשר נוספים</h6>
                    <Button variant="outline-primary" size="sm" onClick={handleAddContact} className="rounded-pill d-flex align-items-center gap-1">
                      <FiPlusCircle /> הוסף איש קשר
                    </Button>
                  </div>
                  
                  {(!formData.contacts || formData.contacts.length === 0) ? (
                    <div className="text-muted small text-center py-2">לא הוגדרו אנשי קשר.</div>
                  ) : (
                    formData.contacts.map((contact, index) => (
                      <Row key={index} className="mb-2 align-items-end">
                        <Col md={4}>
                          <Form.Label className="small mb-1">שם</Form.Label>
                          <Form.Control size="sm" value={contact.name || ''} onChange={(e) => handleContactChange(index, 'name', e.target.value)} />
                        </Col>
                        <Col md={3}>
                          <Form.Label className="small mb-1">טלפון</Form.Label>
                          <Form.Control size="sm" value={contact.phone || ''} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} />
                        </Col>
                        <Col md={4}>
                          <Form.Label className="small mb-1">קרבה/תפקיד</Form.Label>
                          <Form.Control size="sm" value={contact.relation || ''} onChange={(e) => handleContactChange(index, 'relation', e.target.value)} />
                        </Col>
                        <Col md={1} className="text-end">
                          <Button variant="link" className="text-danger p-0 mb-1" onClick={() => handleRemoveContact(index)}><FiMinusCircle size={20} /></Button>
                        </Col>
                      </Row>
                    ))
                  )}
                </div>

                <div className="d-flex justify-content-end pt-3 border-top mt-4">
                  <Button variant="light" onClick={handleCloseEdit} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור שינויים</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default StudentProfile;