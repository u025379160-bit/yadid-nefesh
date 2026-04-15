import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FiPlus, FiTrash2, FiShield, FiUserCheck } from 'react-icons/fi';

function Team() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'tutor', phone: ''
  });

  const roleTranslations = {
    'admin': 'אדמין (טכני)',
    'manager': 'מנהל מערכת',
    'secretary': 'מזכירות',
    'coordinator': 'רכז אזור',
    'tutor': 'חונך'
  };

  const roleColors = {
    'admin': 'danger',
    'manager': 'primary',
    'secretary': 'info',
    'coordinator': 'warning',
    'tutor': 'secondary'
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('שגיאה בשליפת צוות:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('איש צוות נוסף בהצלחה!');
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'tutor', phone: '' });
        fetchUsers(); 
      } else {
        const errorData = await response.json();
        alert('שגיאה: ' + (errorData.message || 'לא ניתן לשמור את המשתמש'));
      }
    } catch (error) {
      alert('שגיאת תקשורת מול השרת');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${name}? (פעולה זו תמחק את הגישה שלו למערכת)`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setUsers(users.filter(u => u._id !== id));
      } else {
        alert('שגיאה במחיקה');
      }
    } catch (error) {
      alert('שגיאת תקשורת');
    }
  };

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">ניהול צוות והרשאות</h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">הגדרת משתמשים ומתן גישה למערכת</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={() => setShowModal(true)}>
          <FiPlus /> הוסף איש צוות
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Table hover className="align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 rounded-start"><FiUserCheck className="me-2" /> שם מלא</th>
                <th className="border-0">אימייל (שם משתמש)</th>
                <th className="border-0">טלפון</th>
                <th className="border-0"><FiShield className="me-2"/> תפקיד (הרשאה)</th>
                <th className="text-end border-0 rounded-end">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td className="fw-bold">{user.name}</td>
                    <td className="text-muted" dir="ltr" style={{ textAlign: 'right' }}>{user.email}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <Badge bg={roleColors[user.role] || 'secondary'} className="px-3 py-2 rounded-pill">
                        {roleTranslations[user.role] || user.role}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button variant="light" size="sm" className="text-danger border" onClick={() => handleDelete(user._id, user.name)}>
                        <FiTrash2 />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-5 text-muted">אין משתמשים במערכת. הוסף את המשתמש הראשון!</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* מודל הוספת משתמש */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700' }}>יצירת משתמש חדש</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">שם מלא *</Form.Label>
                      <Form.Control type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="לדוגמה: ישראל ישראלי" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">אימייל (לכניסה למערכת) *</Form.Label>
                      <Form.Control type="email" name="email" required value={formData.email} onChange={handleChange} dir="ltr" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">טלפון נייד</Form.Label>
                      <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">סיסמה ראשונית *</Form.Label>
                      <Form.Control type="text" name="password" required value={formData.password} onChange={handleChange} placeholder="לפחות 6 תווים" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 p-3 border rounded bg-white">
                      <Form.Label className="fw-bold mb-3 d-block border-bottom pb-2"><FiShield /> בחר הרשאת גישה (תפקיד) *</Form.Label>
                      <Form.Select name="role" value={formData.role} onChange={handleChange} className="fw-bold">
                        <option value="manager">מנהל מערכת (גישה מלאה להכל)</option>
                        <option value="secretary">מזכירות (גישה להכל למעט משימות מוצפנות)</option>
                        <option value="coordinator">רכז אזור (גישה לנתונים באזור שלו בלבד)</option>
                        <option value="tutor">חונך (גישה לשיבוצים ולמשימות שלו בלבד)</option>
                        <option value="admin">אדמין (תחזוקה וניהול טכני)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end mt-3 pt-3 border-top">
                  <Button variant="light" onClick={() => setShowModal(false)} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">צור משתמש</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Team;