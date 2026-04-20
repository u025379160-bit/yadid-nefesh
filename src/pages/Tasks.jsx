import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Row, Col, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { FiPlus, FiMessageSquare, FiLock, FiEdit2, FiCheckCircle, FiCircle, FiTrash2, FiMessageCircle, FiSend } from 'react-icons/fi';

function Tasks({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  
  const [studentsList, setStudentsList] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);
  const [placementsList, setPlacementsList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null); 
  
  // === סטייטים חדשים עבור מערכת התגובות ===
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [selectedTaskForReplies, setSelectedTaskForReplies] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);
  
  const [formData, setFormData] = useState({
    associatedToType: 'student',
    associatedToId: '', 
    taskType: 'תיעוד פעילות',
    content: '',
    status: 'published',
    assignedTo: '', 
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
      const [stdRes, tutRes, plcRes, usersRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + '/api/students'),
        fetch(import.meta.env.VITE_API_URL + '/api/tutors'),
        fetch(import.meta.env.VITE_API_URL + '/api/placements'),
        fetch(import.meta.env.VITE_API_URL + '/api/users')
      ]);
      
      if (stdRes.ok) setStudentsList(await stdRes.json());
      if (tutRes.ok) setTutorsList(await tutRes.json());
      if (plcRes.ok) setPlacementsList(await plcRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json()); 
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

  // === פונקציות לניהול התגובות ===
  const handleOpenReplies = (task) => {
    setSelectedTaskForReplies(task);
    setShowRepliesModal(true);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTaskForReplies) return;

    setIsSavingReply(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${selectedTaskForReplies._id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyText,
          author: currentUser?.name || currentUser?.firstName || 'צוות ניהול'
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        // עדכון המשימה במערך המשימות הכללי כדי שהמונה יתעדכן
        setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
        // עדכון המשימה הנבחרת כדי שהתגובה תופיע מיד בחלון הפתוח
        setSelectedTaskForReplies(updatedTask);
        setReplyText('');
      } else {
        alert('שגיאה בשמירת התגובה');
      }
    } catch (err) {
      alert('שגיאת תקשורת מול השרת');
    } finally {
      setIsSavingReply(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Container className="mt-5 mb-5" dir="rtl">
      {/* כותרת מודרנית */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-1">ניהול משימות ותיעוד</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }} className="mb-0">מעקב, תיעוד שיחות והתכתבויות צוות</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm" style={{ fontWeight: '600' }} onClick={handleOpenNewTask}>
          <FiPlus size={18} /> משימה חדשה
        </Button>
      </div>

      {/* כרטיסיית טבלה מרחפת */}
      <Card className="border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Card.Body className="p-4">
          <div className="table-responsive">
            <Table hover className="align-middle border-light mb-0" style={{ color: '#334155' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>תאריך</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>נוצר ע"י</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>לטיפול</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>סוג משימה</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }}>תוכן המשימה</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-center">סטטוס</th>
                  <th style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '600', padding: '12px' }} className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" style={{color: '#2563eb'}} /></td></tr>
                ) : tasks.length > 0 ? (
                  tasks.map(task => (
                    <tr key={task._id} style={{ opacity: task.isCompleted ? 0.6 : 1, transition: 'all 0.2s' }}>
                      <td style={{ color: '#64748b', padding: '16px 12px' }} className="small">{formatDate(task.createdAt)}</td>
                      <td style={{ color: '#0f172a', fontWeight: '600', padding: '16px 12px' }}>{task.createdBy || 'מערכת'}</td>
                      
                      <td style={{ color: '#2563eb', fontWeight: '700', padding: '16px 12px' }}>{task.assignedTo || 'כללי'}</td>
                      
                      <td style={{ padding: '16px 12px' }}>
                        <span className="rounded-pill d-inline-block text-center" style={{ padding: '4px 12px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                          {task.taskType || task.title || 'משימה'}
                        </span>
                      </td>
                      
                      <td style={{ maxWidth: '250px', padding: '16px 12px' }}>
                        {task.isEncrypted && currentUser?.role !== 'manager' && currentUser?.name !== task.createdBy ? (
                          <span style={{ color: '#ef4444', fontWeight: '600' }}><FiLock className="me-1" /> תוכן מוצפן</span>
                        ) : (
                          <span className="text-truncate d-inline-block w-100" style={{ textDecoration: task.isCompleted ? 'line-through' : 'none', color: '#475569' }}>
                            {task.isEncrypted && <FiLock style={{ color: '#ef4444' }} className="me-1" />}
                            {task.content || task.description || '-'}
                          </span>
                        )}
                      </td>
                      
                      <td className="text-center" style={{ padding: '16px 12px' }}>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="rounded-pill shadow-sm"
                          style={{ 
                            fontWeight: '600', 
                            backgroundColor: task.isCompleted ? '#d1fae5' : '#ffffff', 
                            color: task.isCompleted ? '#059669' : '#64748b',
                            border: `1px solid ${task.isCompleted ? '#a7f3d0' : '#e2e8f0'}`
                          }}
                          onClick={() => handleToggleComplete(task)}
                        >
                          {task.isCompleted ? <><FiCheckCircle className="me-1"/> בוצע</> : <><FiCircle className="me-1"/> לטיפול</>}
                        </Button>
                      </td>

                      <td className="text-end" style={{ padding: '16px 12px', minWidth: '150px' }}>
                        {/* כפתור תגובות חדש */}
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="me-2 rounded-pill shadow-sm position-relative" 
                          style={{ color: '#10b981', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }} 
                          onClick={() => handleOpenReplies(task)} 
                          title="צ'אט / תגובות"
                        >
                          <FiMessageCircle />
                          {task.replies && task.replies.length > 0 && (
                            <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-success" style={{ fontSize: '0.65rem' }}>
                              {task.replies.length}
                            </span>
                          )}
                        </Button>
                        <Button variant="light" size="sm" className="me-2 rounded-pill shadow-sm" style={{ color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }} onClick={() => handleEditTask(task)} title="ערוך משימה">
                          <FiEdit2 />
                        </Button>
                        <Button variant="light" size="sm" className="rounded-pill shadow-sm" style={{ color: '#e11d48', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }} onClick={() => handleDeleteTask(task._id)} title="מחק משימה">
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <FiMessageSquare size={40} className="mb-3 opacity-50" style={{ color: '#94a3b8' }} />
                      <h5 style={{ color: '#64748b' }}>אין משימות עדיין</h5>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* חלון מודל - יצירת משימה */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" dir="rtl" backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>{editingTaskId ? 'עריכת משימה' : 'יצירת משימה / תיעוד חדש'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff' }}>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>בחר סוג שיוך *</Form.Label>
                  <Form.Select name="associatedToType" value={formData.associatedToType} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <option value="student">תלמיד</option>
                    <option value="tutor">חונך</option>
                    <option value="placement">שיבוץ (חונך + תלמיד)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>בחר אובייקט *</Form.Label>
                  <Form.Select name="associatedToId" value={formData.associatedToId} onChange={handleChange} required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
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
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>סוג המשימה *</Form.Label>
                  <Form.Select name="taskType" value={formData.taskType} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#2563eb' }}>שיוך לאיש צוות (לטיפול)</Form.Label>
                  <Form.Select name="assignedTo" value={formData.assignedTo} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
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
              <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>תוכן המשימה / תיעוד *</Form.Label>
              <Form.Control as="textarea" rows={5} name="content" value={formData.content} onChange={handleChange} placeholder="הקלד את פרטי המשימה..." required style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
            </Form.Group>

            <div className="p-3 mb-4" style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h6 className="fw-bold mb-3 pb-2" style={{ color: '#334155', borderBottom: '1px solid #e2e8f0' }}>הגדרות נוספות</h6>
              {currentUser?.role === 'manager' && (
                <Form.Check type="checkbox" id="isEncrypted" name="isEncrypted" label={<span style={{ color: '#ef4444', fontWeight: '600' }}><FiLock className="me-1" /> הצפן תוכן משימה</span>} checked={formData.isEncrypted} onChange={handleChange} className="mb-2" />
              )}
              <Form.Check type="checkbox" id="sendSystemAlert" name="sendSystemAlert" label={<span style={{ color: '#475569' }}>שלח התראת מערכת לנמענים</span>} checked={formData.sendSystemAlert} onChange={handleChange} className="mb-2" />
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Form.Select name="status" value={formData.status} onChange={handleChange} style={{ width: '160px', borderRadius: '8px', fontWeight: '600' }}>
                <option value="published">🟢 פרסם מיד</option>
                <option value="draft">🟡 שמור כטיוטה</option>
              </Form.Select>
              
              <div>
                <Button variant="light" onClick={() => setShowModal(false)} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>ביטול</Button>
                <Button variant="primary" type="submit" disabled={isSaving} className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>
                  {isSaving ? <Spinner size="sm" animation="border" /> : (editingTaskId ? 'שמור שינויים' : 'שמור משימה')}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* חלון מודל - שרשור תגובות (צ'אט) */}
      <Modal show={showRepliesModal} onHide={() => setShowRepliesModal(false)} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Modal.Title style={{ fontWeight: '800', color: '#0f172a' }}>תגובות ועדכונים למשימה</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 d-flex flex-column" style={{ backgroundColor: '#f1f5f9', height: '60vh' }}>
          
          {/* גוף הצ'אט / תגובות (אזור נגלל) */}
          <div className="p-4 flex-grow-1" style={{ overflowY: 'auto' }}>
            {/* תוכן המשימה המקורית */}
            <div className="mb-4 p-3 shadow-sm rounded-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Badge bg="light" text="dark" className="border border-secondary">{selectedTaskForReplies?.taskType || 'משימה מקורית'}</Badge>
                <span className="small text-muted">{formatDate(selectedTaskForReplies?.createdAt)}</span>
              </div>
              <p className="mb-1" style={{ color: '#334155', fontWeight: '500' }}>{selectedTaskForReplies?.content || selectedTaskForReplies?.description}</p>
              <div className="small text-muted mt-2">נכתב ע"י: <span className="fw-bold">{selectedTaskForReplies?.createdBy || 'מערכת'}</span></div>
            </div>

            <hr style={{ borderColor: '#cbd5e1', borderStyle: 'dashed' }} className="my-4" />

            {/* רשימת התגובות */}
            {selectedTaskForReplies?.replies && selectedTaskForReplies.replies.length > 0 ? (
              selectedTaskForReplies.replies.map((reply, idx) => {
                const isMe = reply.author === (currentUser?.name || currentUser?.firstName);
                return (
                  <div key={idx} className={`mb-3 p-3 shadow-sm rounded-4 ${isMe ? 'ms-auto' : 'me-auto'}`} 
                       style={{ 
                         maxWidth: '85%', 
                         width: 'fit-content',
                         backgroundColor: isMe ? '#eff6ff' : '#ffffff',
                         border: `1px solid ${isMe ? '#bfdbfe' : '#e2e8f0'}`
                       }}>
                    <div className="d-flex justify-content-between align-items-center gap-4 mb-2" style={{ fontSize: '0.85rem' }}>
                      <span className="fw-bold" style={{ color: isMe ? '#2563eb' : '#475569' }}>{reply.author}</span>
                      <span style={{ color: '#94a3b8' }}>{formatDate(reply.createdAt)}</span>
                    </div>
                    <div style={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{reply.text}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted mt-5 py-5">
                <FiMessageCircle size={30} className="mb-2 opacity-50" />
                <p>אין עדיין תגובות למשימה זו. היה הראשון להגיב!</p>
              </div>
            )}
          </div>

          {/* אזור הקלדת תגובה חדשה */}
          <div className="p-3" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
            <Form onSubmit={handleSubmitReply}>
              <InputGroup>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="הקלד תגובה או עדכון כאן..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ borderRadius: '0 12px 12px 0', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', resize: 'none' }}
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isSavingReply || !replyText.trim()}
                  className="px-4 d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '12px 0 0 12px', fontWeight: '600' }}
                >
                  {isSavingReply ? <Spinner size="sm" animation="border" /> : <><FiSend /> שלח</>}
                </Button>
              </InputGroup>
            </Form>
          </div>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Tasks;