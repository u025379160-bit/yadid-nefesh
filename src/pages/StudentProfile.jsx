import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, ListGroup, Spinner, Modal, Form } from 'react-bootstrap';
import { FiArrowRight, FiEdit2, FiUser, FiMapPin, FiFileText, FiCheckSquare, FiTrash2, FiCreditCard } from 'react-icons/fi';

function StudentProfile() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // נתונים
  const [student, setStudent] = useState(null);
  const [tasks, setTasks] = useState([]); 
  const [placements, setPlacements] = useState([]); 
  const [loading, setLoading] = useState(true);

  // --- תוספת: משתנה לבחירת חודש ושנה ---
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // מודלים
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', urgency: 'רגיל', studentId: id });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await fetch(`http://localhost:5000/api/students/${id}`);
        if (studentRes.ok) setStudent(await studentRes.json());

        const tasksRes = await fetch(`http://localhost:5000/api/students/${id}/tasks`);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        
        const placementsRes = await fetch(`http://localhost:5000/api/placements`);
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
    fetchData();
  }, [id]);

  // --- תוספת: סינון השיבוצים לפי החודש שנבחר ---
  const filteredPlacements = placements.filter(p => {
    if (!p.startDate) return false;
    
    const pDate = new Date(p.startDate);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);

    const isStartedBySelectedMonth = pDate.getFullYear() < sYear || (pDate.getFullYear() === sYear && pDate.getMonth() + 1 <= sMonth);

    return isStartedBySelectedMonth && p.status !== 'לא פעיל';
  });

  // --- תוספת: סיכום העלויות ---
  const totalMonthlyCost = filteredPlacements.reduce((sum, placement) => {
    return sum + (Number(placement.paymentAmount) || 0);
  }, 0);

  // עריכת תלמיד
  const handleOpenEdit = () => {
    let formattedDate = '';
    if (student.birthDate) formattedDate = new Date(student.birthDate).toISOString().split('T')[0];
    setFormData({ ...student, birthDate: formattedDate });
    setShowEditModal(true);
  };
  const handleCloseEdit = () => setShowEditModal(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStudent(await response.json());
        setShowEditModal(false);
      }
    } catch (error) {
      alert('שגיאה בעדכון התלמיד');
    }
  };

  // משימות
  const handleOpenTask = () => {
    setTaskData({ title: '', description: '', urgency: 'רגיל', studentId: id });
    setShowTaskModal(true);
  };
  const handleCloseTask = () => setShowTaskModal(false);
  const handleTaskChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        setShowTaskModal(false);
      }
    } catch (error) {
      alert('שגיאה בהוספת משימה');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      alert('שגיאה במחיקת משימה');
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: 'var(--primary-accent)'}} /></Container>;
  if (!student) return <Container className="mt-5 text-center"><h3>תלמיד לא נמצא 😕</h3></Container>;

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      
      {/* כותרת עליונה */}
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
          <FiEdit2 /> ערוך פרטים
        </Button>
      </div>

      {/* כרטיס פרטים ראשי + כרטיס סיכום כספי */}
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
                    <div><small className="text-muted d-block">טלפון ראשי</small><span dir="ltr" className="fw-bold text-primary">{student.phone1}</span></div>
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiMapPin /> פרטי מגורים
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="text-muted d-block">כתובת</small><span className="fw-bold">{student.address || 'לא צוינה כתובת'}</span></div>
                    <div>
                      <small className="text-muted d-block mb-1">סטטוס</small>
                      <Badge bg="success" className="px-3 py-2 rounded-pill">פעיל במערכת</Badge>
                    </div>
                  </div>
                </Col>

              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* --- תוספת: כרטיס סיכום עלויות חודשי (עם הבורר) --- */}
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
        
        {/* אזור שיבוצים (מעודכן עם סינון לפי חודש ועמודת סכום) */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4">
              <h5 className="fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <FiFileText className="text-primary" /> חונכים פעילים בחודש זה
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-muted fw-bold border-0 rounded-start">שם החונך</th>
                      <th className="text-muted fw-bold border-0">סטטוס</th>
                      {/* תוספת: עמודת עלות */}
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
                          {/* תוספת: הצגת הסכום */}
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

        {/* אזור משימות (נשאר ללא שינוי) */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--text-main)' }}>
                <FiCheckSquare className="text-warning" /> משימות לטיפול
              </h5>
              <Button variant="outline-primary" size="sm" className="fw-bold rounded-pill px-3" onClick={handleOpenTask}>+ הוסף משימה</Button>
            </Card.Header>
            <Card.Body className="p-4">
              <ListGroup variant="flush">
                {tasks.length === 0 ? (
                  <div className="text-center p-4 text-muted bg-light rounded" style={{ border: '1px dashed var(--border-color)' }}>
                    אין משימות פתוחות לתלמיד זה. איזה כיף! ☕
                  </div>
                ) : (
                  tasks.map((task) => (
                    <ListGroup.Item key={task._id} className="px-0 py-3 border-bottom d-flex justify-content-between align-items-start">
                      <div className="ms-2 me-auto">
                        <div className="fw-bold" style={{ color: 'var(--text-main)' }}>{task.title}</div>
                        {task.description && <small className="text-muted">{task.description}</small>}
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <Badge bg={task.urgency === 'דחוף' ? 'danger' : task.urgency === 'השבוע' ? 'warning' : 'info'} className="rounded-pill">
                          {task.urgency}
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
                  ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* חלון עריכת תלמיד */}
      <Modal show={showEditModal} onHide={handleCloseEdit} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>עריכת פרטי תלמיד</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleUpdateStudent}>
                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-2">פרטים בסיסיים</h6>
                <Row className="mb-3">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שם פרטי</Form.Label><Form.Control type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">שם משפחה</Form.Label><Form.Control type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} required /></Form.Group></Col>
                </Row>
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">תעודת זהות</Form.Label><Form.Control type="text" name="idNumber" value={formData.idNumber || ''} onChange={handleChange} required /></Form.Group></Col>
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">טלפון</Form.Label><Form.Control type="text" name="phone1" value={formData.phone1 || ''} onChange={handleChange} required /></Form.Group></Col>
                </Row>
                <Row className="mb-4">
                  <Col><Form.Group><Form.Label className="small fw-bold text-muted">כתובת מגורים</Form.Label><Form.Control type="text" name="address" value={formData.address || ''} onChange={handleChange} /></Form.Group></Col>
                </Row>
                <div className="d-flex justify-content-end pt-3 border-top">
                  <Button variant="light" onClick={handleCloseEdit} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">שמור שינויים</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

      {/* חלון הוספת משימה */}
      <Modal show={showTaskModal} onHide={handleCloseTask} dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700', color: 'var(--text-main)' }}>משימה חדשה</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleAddTask}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">כותרת המשימה</Form.Label>
                  <Form.Control type="text" name="title" required placeholder="לדוגמה: שיחת מעקב חודשית" value={taskData.title} onChange={handleTaskChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">פירוט (לא חובה)</Form.Label>
                  <Form.Control as="textarea" rows={2} name="description" value={taskData.description} onChange={handleTaskChange} />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">דחיפות</Form.Label>
                  <Form.Select name="urgency" value={taskData.urgency} onChange={handleTaskChange}>
                    <option value="רגיל">רגיל</option>
                    <option value="השבוע">השבוע</option>
                    <option value="דחוף">דחוף 🔥</option>
                  </Form.Select>
                </Form.Group>
                <div className="d-flex justify-content-end pt-3 border-top">
                  <Button variant="light" onClick={handleCloseTask} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">הוסף משימה 📌</Button>
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