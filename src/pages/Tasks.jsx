import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FiPlus, FiMessageSquare, FiLock, FiEye, FiSearch, FiFilter } from 'react-icons/fi';

function Tasks({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    associatedToType: 'student',
    associatedToId: '123', // כרגע נשים ID פיקטיבי עד שיהיה לנו רשימת תלמידים לבחור ממנה
    taskType: 'תיעוד פעילות',
    content: '',
    status: 'published',
    isEncrypted: false,
    sendSystemAlert: true,
    sendEmailAlert: false
  });

  const taskTypes = ['תיעוד פעילות', 'בקשת עזרה', 'עדכון סטטוס', 'אחר'];

  // שולפים את המשימות האמיתיות כשהעמוד עולה
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('שגיאה בשליפת משימות:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // שומרים משימה חדשה בשרת האמיתי!
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...formData,
      createdBy: currentUser?.name || 'מערכת' // מוסיפים מי יצר את המשימה
    };

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('המשימה נשמרה בהצלחה במסד הנתונים!');
        setShowModal(false);
        // מאפסים את הטופס
        setFormData({ ...formData, content: '', isEncrypted: false });
        // מרעננים את הטבלה לראות את המשימה החדשה
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

  // פונקציה שהופכת תאריך לפורמט ישראלי יפה
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">ניהול משימות ותיעוד</h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">מעקב, תיעוד שיחות והתכתבויות צוות</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={() => setShowModal(true)}>
          <FiPlus /> משימה חדשה
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4 bg-white">
        <Card.Body className="d-flex gap-3 align-items-center">
          <div className="flex-grow-1 position-relative">
            <FiSearch className="position-absolute" style={{ right: '15px', top: '12px', color: '#adb5bd' }} />
            <Form.Control type="text" placeholder="חיפוש חופשי בתוכן משימות..." style={{ paddingRight: '40px' }} />
          </div>
          <Form.Select style={{ width: '200px' }}>
            <option value="all">כל סוגי המשימות</option>
            {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </Form.Select>
          <Button variant="light" className="border text-muted d-flex align-items-center gap-2">
            <FiFilter /> מסננים
          </Button>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 py-3 px-4">תאריך</th>
                <th className="border-0 py-3">נוצר ע"י</th>
                <th className="border-0 py-3">סוג משימה</th>
                <th className="border-0 py-3">תוכן המשימה</th>
                <th className="border-0 py-3">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : tasks.length > 0 ? (
                tasks.map(task => (
                  <tr key={task._id}>
                    <td className="px-4 text-muted small">{formatDate(task.createdAt)}</td>
                    <td className="fw-bold">{task.createdBy || 'מערכת'}</td>
                    <td><Badge bg="info" className="rounded-pill px-3 py-2">{task.taskType || task.title || 'משימה'}</Badge></td>
                    
                    {/* בדיקת הצפנה: אם מוצפן וזה לא המנהל או מי שיצר, מוסתר! */}
                    <td style={{ maxWidth: '300px' }}>
                      {task.isEncrypted && currentUser?.role !== 'manager' && currentUser?.name !== task.createdBy ? (
                        <span className="text-danger fw-bold"><FiLock /> תוכן מוצפן</span>
                      ) : (
                        <span className="text-truncate d-inline-block w-100">
                          {task.isEncrypted && <FiLock className="text-danger me-1" />}
                          {task.content || task.description || '-'}
                        </span>
                      )}
                    </td>
                    
                    <td>
                      <Badge bg={task.status === 'draft' ? 'warning' : 'success'} className="rounded-pill">
                        {task.status === 'draft' ? 'טיוטה' : 'פורסם'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <FiMessageSquare size={40} className="mb-3 opacity-50" />
                    <h5>אין משימות עדיין</h5>
                    <p>לחץ על "משימה חדשה" כדי ליצור את התיעוד הראשון.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700' }}>יצירת משימה / תיעוד חדש</Modal.Title>
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
                  <Form.Select name="associatedToId" value={formData.associatedToId} onChange={handleChange}>
                    <option value="123">ישראל ישראלי (דוגמה)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small">סוג המשימה *</Form.Label>
                  <Form.Select name="taskType" value={formData.taskType} onChange={handleChange}>
                    {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
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
              <Form.Check type="checkbox" id="sendEmailAlert" name="sendEmailAlert" label="שלח התראה במייל לנמענים" checked={formData.sendEmailAlert} onChange={handleChange} />
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <Form.Select name="status" value={formData.status} onChange={handleChange} style={{ width: '150px' }} className="fw-bold">
                <option value="published">🟢 פרסם מיד</option>
                <option value="draft">🟡 שמור כטיוטה</option>
              </Form.Select>
              
              <div>
                <Button variant="light" onClick={() => setShowModal(false)} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                <Button variant="primary" type="submit" disabled={isSaving} className="px-4 fw-bold shadow-sm">
                  {isSaving ? <Spinner size="sm" animation="border" /> : 'שמור משימה'}
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