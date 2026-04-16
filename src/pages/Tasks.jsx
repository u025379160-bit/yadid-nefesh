import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FiPlus, FiMessageSquare, FiLock, FiSearch, FiFilter, FiEdit2, FiCheckCircle, FiCircle, FiTrash2 } from 'react-icons/fi';

function Tasks({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  
  const [studentsList, setStudentsList] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);
  const [placementsList, setPlacementsList] = useState([]);
  const [usersList, setUsersList] = useState([]); // 🔥 רשימת אנשי הצוות (משתמשים)

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null); 
  
  const [formData, setFormData] = useState({
    associatedToType: 'student',
    associatedToId: '', 
    taskType: 'תיעוד פעילות',
    content: '',
    status: 'published',
    assignedTo: '', // שיוך לאיש צוות
    isEncrypted: false,
    sendSystemAlert: true,
    sendEmailAlert: false
  });

  const taskTypes = ['תיעוד פעילות', 'בקשת עזרה', 'עדכון סטטוס', 'אחר'];

  useEffect(() => {
    fetchTasks();
    fetchAssociatedData();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/tasks');
      if (response.ok) setTasks(await response.json());
    } catch (err) {
      console.error('שגיאה בשליפת משימות:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssociatedData = async () => {
    try {
      // 🔥 הוספנו פה גם משיכה של רשימת המשתמשים (/api/users)
      const [stdRes, tutRes, plcRes, usersRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + '/api/students'),
        fetch(import.meta.env.VITE_API_URL + '/api/tutors'),
        fetch(import.meta.env.VITE_API_URL + '/api/placements'),
        fetch(import.meta.env.VITE_API_URL + '/api/users')
      ]);
      
      if (stdRes.ok) setStudentsList(await stdRes.json());
      if (tutRes.ok) setTutorsList(await tutRes.json());
      if (plcRes.ok) setPlacementsList(await plcRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json()); // שומר את המשתמשים
    } catch (err) {}
  };

  const handleOpenNewTask = () => {
    setEditingTaskId(null);
    setFormData({
      associatedToType: 'student', associatedToId: '', taskType: 'תיעוד פעילות',
      content: '', status: 'published', assignedTo: '', isEncrypted: false,
      sendSystemAlert: true, sendEmailAlert: false
    });
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task._id);
    setFormData({
      associatedToType: task.associatedToType || 'student',
      associatedToId: task.associatedToId || '',
      taskType: task.taskType || 'תיעוד פעילות',
      content: task.content || task.description || '',
      status: task.status || 'published',
      assignedTo: task.assignedTo || '',
      isEncrypted: task.isEncrypted || false,
      sendSystemAlert: task.sendSystemAlert || false,
      sendEmailAlert: task.sendEmailAlert || false
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (e.target.name === 'associatedToType') {
      setFormData({ ...formData, associatedToType: value, associatedToId: '' });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });
      if (response.ok) fetchTasks();
    } catch (err) {
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) fetchTasks();
    } catch (error) {
      alert('שגיאה במחיקת משימה');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.associatedToId) {
      alert('נא לבחור אובייקט (תלמיד/חונך/שיבוץ) מהרשימה'); return;
    }

    setIsSaving(true);
    
    const method = editingTaskId ? 'PUT' : 'POST';
    const url = editingTaskId 
      ? `${import.meta.env.VITE_API_URL}/api/tasks/${editingTaskId}` 
      : `${import.meta.env.VITE_API_URL}/api/tasks`;

    const payload = editingTaskId ? formData : {
      ...formData,
      createdBy: currentUser?.name || currentUser?.firstName || 'מנהל'
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        fetchTasks();
      } else {
        alert('שגיאה בשמירת המשימה');
      }
    } catch (err) {
      alert('שגיאת תקשורת מול השרת');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">ניהול משימות ותיעוד</h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">מעקב, תיעוד שיחות והתכתבויות צוות</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={handleOpenNewTask}>
          <FiPlus /> משימה חדשה
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 py-3 px-4">תאריך</th>
                <th className="border-0 py-3">נוצר ע"י</th>
                <th className="border-0 py-3">לטיפול</th>
                <th className="border-0 py-3">סוג משימה</th>
                <th className="border-0 py-3">תוכן המשימה</th>
                <th className="border-0 py-3 text-center">סטטוס</th>
                <th className="border-0 py-3 text-end px-4">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : tasks.length > 0 ? (
                tasks.map(task => (
                  <tr key={task._id} style={{ opacity: task.isCompleted ? 0.6 : 1 }}>
                    <td className="px-4 text-muted small">{formatDate(task.createdAt)}</td>
                    <td className="fw-bold">{task.createdBy || 'מערכת'}</td>
                    
                    <td className="text-primary fw-bold">{task.assignedTo || 'כללי'}</td>
                    
                    <td><Badge bg="info" className="rounded-pill px-3 py-2">{task.taskType || task.title || 'משימה'}</Badge></td>
                    
                    <td style={{ maxWidth: '250px' }}>
                      {task.isEncrypted && currentUser?.role !== 'manager' && currentUser?.name !== task.createdBy ? (
                        <span className="text-danger fw-bold"><FiLock /> תוכן מוצפן</span>
                      ) : (
                        <span className="text-truncate d-inline-block w-100" style={{ textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                          {task.isEncrypted && <FiLock className="text-danger me-1" />}
                          {task.content || task.description || '-'}
                        </span>
                      )}
                    </td>
                    
                    <td className="text-center">
                      <Button 
                        variant={task.isCompleted ? "success" : "light"} 
                        size="sm" 
                        className={`rounded-pill fw-bold border ${task.isCompleted ? 'border-success' : 'text-muted'}`}
                        onClick={() => handleToggleComplete(task)}
                      >
                        {task.isCompleted ? <><FiCheckCircle className="me-1"/> בוצע</> : <><FiCircle className="me-1"/> לטיפול</>}
                      </Button>
                    </td>

                    <td className="text-end px-4">
                      <Button variant="light" size="sm" className="border text-primary me-2" onClick={() => handleEditTask(task)} title="ערוך משימה">
                        <FiEdit2 />
                      </Button>
                      <Button variant="light" size="sm" className="border text-danger" onClick={() => handleDeleteTask(task._id)} title="מחק משימה">
                        <FiTrash2 />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <FiMessageSquare size={40} className="mb-3 opacity-50" />
                    <h5>אין משימות עדיין</h5>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700' }}>{editingTaskId ? 'עריכת משימה' : 'יצירת משימה / תיעוד חדש'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">בחר סוג שיוך *</Form.Label>
                  <Form.Select name="associatedToType" value={formData.associatedToType} onChange={handleChange}>
                    <option value="student">תלמיד</option>
                    <option value="tutor">חונך</option>
                    <option value="placement">שיבוץ (חונך + תלמיד)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">בחר אובייקט *</Form.Label>
                  <Form.Select name="associatedToId" value={formData.associatedToId} onChange={handleChange} required>
                    <option value="">-- בחר מהרשימה --</option>
                    {formData.associatedToType === 'student' && studentsList.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                    {formData.associatedToType === 'tutor' && tutorsList.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                    {formData.associatedToType === 'placement' && placementsList.map(p => <option key={p._id} value={p._id}>{p.tutor?.firstName} {p.tutor?.lastName} (חונך) ⟵ {p.student?.firstName} {p.student?.lastName} (תלמיד)</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">סוג המשימה *</Form.Label>
                  <Form.Select name="taskType" value={formData.taskType} onChange={handleChange}>
                    {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                {/* 🔥 הנה השינוי: עכשיו זה רשימה נפתחת מתוך המשתמשים בשרת! */}
                <Form.Group>
                  <Form.Label className="fw-bold text-primary small">שיוך לאיש צוות (לטיפול)</Form.Label>
                  <Form.Select name="assignedTo" value={formData.assignedTo} onChange={handleChange}>
                    <option value="">-- ללא שיוך מיוחד (כללי) --</option>
                    {usersList.map(user => (
                      <option key={user._id} value={user.name || user.firstName}>
                        {user.name || user.firstName} {user.role === 'manager' ? '(מנהל)' : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small">תוכן המשימה / תיעוד *</Form.Label>
              <Form.Control as="textarea" rows={5} name="content" value={formData.content} onChange={handleChange} placeholder="הקלד את פרטי המשימה..." required />
            </Form.Group>

            <div className="bg-white p-3 rounded border mb-4">
              <h6 className="fw-bold mb-3 border-bottom pb-2">הגדרות נוספות</h6>
              {currentUser?.role === 'manager' && (
                <Form.Check type="checkbox" id="isEncrypted" name="isEncrypted" label={<span className="text-danger fw-bold"><FiLock className="me-1" /> הצפן תוכן משימה</span>} checked={formData.isEncrypted} onChange={handleChange} className="mb-2" />
              )}
              <Form.Check type="checkbox" id="sendSystemAlert" name="sendSystemAlert" label="שלח התראת מערכת לנמענים" checked={formData.sendSystemAlert} onChange={handleChange} className="mb-2" />
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <Form.Select name="status" value={formData.status} onChange={handleChange} style={{ width: '150px' }} className="fw-bold">
                <option value="published">🟢 פרסם מיד</option>
                <option value="draft">🟡 שמור כטיוטה</option>
              </Form.Select>
              
              <div>
                <Button variant="light" onClick={() => setShowModal(false)} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                <Button variant="primary" type="submit" disabled={isSaving} className="px-4 fw-bold shadow-sm">
                  {isSaving ? <Spinner size="sm" animation="border" /> : (editingTaskId ? 'שמור שינויים' : 'שמור משימה')}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Tasks;