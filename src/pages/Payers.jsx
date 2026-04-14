import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner } from 'react-bootstrap';
import { FiSearch, FiPlus, FiCreditCard, FiTrash2 } from 'react-icons/fi';

function Payers() {
  const [payers, setPayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // כרגע על false עד שנחבר לשרת

  // 🧹 שואב האבק שלנו למניעת המסך האפור!
  useEffect(() => {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
    };
  }, []);

  // ניהול המודל (טופס הוספה)
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const [formData, setFormData] = useState({
    name: '', identifier: '', payerType: 'individual', 
    phone: '', email: '', paymentMethod: 'credit_card'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert('בהמשך נחבר את זה לשרת! הנתונים שנאספו: ' + formData.name);
    handleClose();
  };

  return (
    <Container className="mt-4" dir="rtl">
      
      {/* כותרת העמוד */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-1">
            ניהול משלמים
          </h3>
          <p style={{ color: 'var(--text-muted)' }} className="mb-0">
            הוספה וניהול של הורים ומוסדות משלמים (לקראת גבייה)
          </p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleShow}>
          <FiPlus /> הוסף משלם חדש
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
                placeholder="חיפוש לפי שם או ת.ז/ח.פ..."
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
                  <th><FiCreditCard className="me-2" /> שם המשלם</th>
                  <th>ת.ז / ח.פ</th>
                  <th>סוג</th>
                  <th>טלפון</th>
                  <th>אמצעי תשלום</th>
                  <th className="text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                    </td>
                  </tr>
                ) : payers.length > 0 ? (
                  payers.map((payer, index) => (
                    <tr key={index}>
                      <td className="fw-bold">{payer.name}</td>
                      <td>{payer.identifier}</td>
                      <td>{payer.payerType === 'individual' ? 'אדם פרטי' : 'ארגון'}</td>
                      <td>{payer.phone}</td>
                      <td>{payer.paymentMethod}</td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="text-danger border">
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      עדיין לא הוזנו משלמים למערכת. לחץ על "הוסף משלם חדש".
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
        </Card.Body>
      </Card>

      {/* מודל הוספת משלם */}
      <Modal show={showModal} onHide={handleClose} size="lg" dir="rtl">
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Modal.Title style={{ fontWeight: '700' }}>הוספת משלם חדש (הורה/מוסד)</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">סוג המשלם *</Form.Label>
                      <Form.Select name="payerType" value={formData.payerType} onChange={handleChange}>
                        <option value="individual">אדם פרטי (הורה)</option>
                        <option value="organization">ארגון / עמותה / מוסד</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">אמצעי תשלום ברירת מחדל</Form.Label>
                      <Form.Select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                        <option value="credit_card">כרטיס אשראי (נדרים פלוס)</option>
                        <option value="bank_transfer">העברה בנקאית</option>
                        <option value="standing_order">הוראת קבע בנקאית</option>
                        <option value="check">צ'ק</option>
                        <option value="cash">מזומן</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">שם מלא / שם המוסד *</Form.Label>
                      <Form.Control type="text" name="name" required value={formData.name} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-muted small">ת.ז (לפרטי) / ח.פ (לארגון) *</Form.Label>
                      <Form.Control type="text" name="identifier" required value={formData.identifier} onChange={handleChange} />
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
                      <Form.Label className="fw-bold text-muted small">כתובת אימייל (לשליחת קבלות)</Form.Label>
                      <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-flex justify-content-end mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Button variant="light" onClick={handleClose} className="me-2 border text-muted fw-bold px-4 ms-2">ביטול</Button>
                  <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">הוסף משלם</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Payers;