import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, Modal, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import { FiDollarSign, FiEdit, FiCheckCircle, FiClock, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';

function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ברירת מחדל: החודש הנוכחי בפורמט YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // סטייט עבור מודל שינויים ידניים
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [activeScholarship, setActiveScholarship] = useState(null);
  
  // טופס לשינוי חדש
  const [newChange, setNewChange] = useState({ amount: '', reason: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchScholarships();
  }, [selectedMonth]);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      // בשרת נבנה ראוט שיודע לסנן לפי חודש (month)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/scholarships?month=${selectedMonth}`);
      if (response.ok) {
        setScholarships(await response.json());
      }
    } catch (error) {
      console.error('שגיאה בשליפת מלגות:', error);
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לעדכון סטטוס תשלום
  const handleTogglePaid = async (scholarship) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/scholarships/${scholarship._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !scholarship.isPaid })
      });
      if (response.ok) {
        fetchScholarships();
      }
    } catch (error) {
      alert('שגיאה בעדכון סטטוס התשלום');
    }
  };

  // פתיחת חלון שינויים ידניים
  const handleOpenChanges = (scholarship) => {
    setActiveScholarship(scholarship);
    setNewChange({ amount: '', reason: '' });
    setShowChangesModal(true);
  };

  // הוספת שינוי ידני למלגה
  const handleAddChange = async (e) => {
    e.preventDefault();
    if (!newChange.amount || !newChange.reason) return;

    setIsSaving(true);
    try {
      const updatedChanges = [...(activeScholarship.manualChanges || []), {
        amount: Number(newChange.amount),
        reason: newChange.reason,
        date: new Date().toISOString(),
        updatedBy: 'צוות ניהול' // כאן בהמשך אפשר לשים את שם המשתמש המחובר
      }];

      // חישוב הסכום הסופי החדש
      const newFinalAmount = updatedChanges.reduce((total, change) => total + change.amount, activeScholarship.baseAmount);
      // חישוב מחדש של הסכום לחונך
      const newTutorAmount = newFinalAmount - activeScholarship.officeProfit;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/scholarships/${activeScholarship._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          manualChanges: updatedChanges,
          finalAmount: newFinalAmount,
          tutorAmount: newTutorAmount
        })
      });

      if (response.ok) {
        const updatedScholarship = await response.json();
        setActiveScholarship(updatedScholarship);
        setNewChange({ amount: '', reason: '' });
        fetchScholarships(); // רענון הטבלה
      }
    } catch (error) {
      alert('שגיאה בשמירת השינוי');
    } finally {
      setIsSaving(false);
    }
  };

  // סיכומים לכרטיסיות למעלה
  const totalTutorPayments = scholarships.reduce((sum, s) => sum + (s.tutorAmount || 0), 0);
  const totalOfficeProfit = scholarships.reduce((sum, s) => sum + (s.officeProfit || 0), 0);

  return (
    <Container className="pt-4 mb-5" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'var(--text-main)', fontWeight: '800' }} className="mb-1">
            ניהול מלגות ותשלומים
          </h2>
          <p className="text-muted mb-0">מעקב אחר תשלומי שיבוצים, שינויים ידניים ורווח למשרד</p>
        </div>
        
        <div className="d-flex align-items-center gap-2 bg-white p-2 rounded-pill shadow-sm border">
          <span className="fw-bold text-muted small ms-2 ps-2 border-start">בחר חודש:</span>
          <Form.Control
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none', boxShadow: 'none', backgroundColor: 'transparent' }}
          />
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
            <Card.Body className="d-flex align-items-center">
              <div className="p-3 bg-white rounded-circle shadow-sm me-3 text-primary"><FiDollarSign size={24} /></div>
              <div>
                <h6 className="text-muted fw-bold mb-1">סה"כ לתשלום לחונכים ({selectedMonth})</h6>
                <h3 className="mb-0 fw-bold text-primary">₪{totalTutorPayments.toLocaleString()}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
            <Card.Body className="d-flex align-items-center">
              <div className="p-3 bg-white rounded-circle shadow-sm me-3 text-success"><FiDollarSign size={24} /></div>
              <div>
                <h6 className="text-muted fw-bold mb-1">סה"כ רווח למשרד ({selectedMonth})</h6>
                <h3 className="mb-0 fw-bold text-success">₪{totalOfficeProfit.toLocaleString()}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table hover responsive className="align-middle mb-0 text-nowrap">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 text-muted fw-bold border-0">שיבוץ (תלמיד וחונך)</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">סכום בסיס</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">שינויים ידניים</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">רווח למשרד</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">לתשלום לחונך</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">סטטוס תשלום</th>
              <th className="py-3 text-muted fw-bold border-0 text-end px-4">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
            ) : scholarships.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-5 text-muted">לא נמצאו מלגות לחודש {selectedMonth}. ייתכן שעדיין לא הורץ תהליך החישוב.</td></tr>
            ) : (
              scholarships.map(scholarship => {
                const placementName = scholarship.placement?.student?.firstName ? 
                  `${scholarship.placement.student.firstName} ⟵ ${scholarship.placement.tutor?.firstName}` : 
                  'שיבוץ חסר';
                  
                const changesCount = scholarship.manualChanges?.length || 0;

                return (
                  <tr key={scholarship._id}>
                    <td className="px-4 fw-bold" style={{ color: 'var(--text-main)' }}>{placementName}</td>
                    <td className="text-center text-muted">₪{scholarship.baseAmount?.toLocaleString() || 0}</td>
                    <td className="text-center">
                      <Badge bg={changesCount > 0 ? "warning" : "light"} text={changesCount > 0 ? "dark" : "muted"} className="rounded-pill border">
                        {changesCount} שינויים
                      </Badge>
                    </td>
                    <td className="text-center fw-bold text-success">₪{scholarship.officeProfit?.toLocaleString() || 0}</td>
                    <td className="text-center fw-bold" style={{ fontSize: '1.1rem', color: 'var(--primary-accent)' }}>
                      ₪{scholarship.tutorAmount?.toLocaleString() || 0}
                    </td>
                    <td className="text-center">
                      <Button 
                        variant={scholarship.isPaid ? 'success' : 'outline-secondary'} 
                        size="sm" 
                        className="rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1 mx-auto"
                        onClick={() => handleTogglePaid(scholarship)}
                      >
                        {scholarship.isPaid ? <FiCheckCircle /> : <FiClock />}
                        {scholarship.isPaid ? 'שולם' : 'ממתין'}
                      </Button>
                    </td>
                    <td className="text-end px-4">
                      <Button variant="light" size="sm" className="border text-primary fw-bold" onClick={() => handleOpenChanges(scholarship)}>
                        <FiEdit className="me-1" /> ערוך סכום
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>

      {/* מודל שינויים ידניים (JSON) */}
      <Modal show={showChangesModal} onHide={() => setShowChangesModal(false)} size="lg" dir="rtl">
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title className="fw-bold">
            פירוט ושינויים ידניים במלגה
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {activeScholarship && (
            <>
              <div className="d-flex justify-content-between mb-4 p-3 bg-light rounded border">
                <div><small className="text-muted d-block">סכום בסיס</small><span className="fw-bold">₪{activeScholarship.baseAmount}</span></div>
                <div><small className="text-muted d-block">רווח למשרד</small><span className="fw-bold text-success">₪{activeScholarship.officeProfit}</span></div>
                <div><small className="text-muted d-block">סכום סופי לחונך</small><span className="fw-bold text-primary fs-5">₪{activeScholarship.tutorAmount}</span></div>
              </div>

              <h6 className="fw-bold border-bottom pb-2 mb-3">היסטוריית שינויים (תיעוד JSON)</h6>
              {(!activeScholarship.manualChanges || activeScholarship.manualChanges.length === 0) ? (
                <div className="text-muted text-center py-3 bg-light rounded border mb-4">לא בוצעו שינויים ידניים במלגה זו.</div>
              ) : (
                <Table size="sm" bordered hover className="mb-4 text-center">
                  <thead className="bg-light text-muted">
                    <tr>
                      <th>תאריך</th>
                      <th>סכום</th>
                      <th>סיבה</th>
                      <th>עודכן ע"י</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeScholarship.manualChanges.map((change, idx) => (
                      <tr key={idx}>
                        <td dir="ltr">{new Date(change.date).toLocaleDateString('he-IL')}</td>
                        <td dir="ltr" className={change.amount < 0 ? "text-danger fw-bold" : "text-success fw-bold"}>
                          {change.amount > 0 ? '+' : ''}{change.amount}
                        </td>
                        <td>{change.reason}</td>
                        <td>{change.updatedBy || 'מערכת'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              <Card className="border-primary shadow-sm mt-4">
                <Card.Header className="bg-primary text-white fw-bold d-flex align-items-center gap-2">
                  <FiPlusCircle /> הוספת שינוי / קיזוז חדש
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleAddChange}>
                    <Row className="align-items-end g-2">
                      <Col md={3}>
                        <Form.Label className="small fw-bold">סכום (+ או -)</Form.Label>
                        <Form.Control 
                          type="number" 
                          placeholder="לדוגמה: -50 או 100" 
                          value={newChange.amount} 
                          onChange={(e) => setNewChange({...newChange, amount: e.target.value})}
                          required
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">סיבת השינוי (חובה)</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="למשל: הפחתה עקב חיסור, בונוס חג" 
                          value={newChange.reason} 
                          onChange={(e) => setNewChange({...newChange, reason: e.target.value})}
                          required
                        />
                      </Col>
                      <Col md={3}>
                        <Button type="submit" variant="primary" className="w-100 fw-bold" disabled={isSaving}>
                          {isSaving ? <Spinner size="sm" animation="border" /> : 'הוסף שינוי'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Scholarships;