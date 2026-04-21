import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, Modal, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import { FiDollarSign, FiEdit, FiCheckCircle, FiClock, FiPlusCircle, FiMinusCircle, FiFileText } from 'react-icons/fi';

function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); // סטייט לכפתור היצירה היזום
  
  // ברירת מחדל: החודש הנוכחי בפורמט YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showChangesModal, setShowChangesModal] = useState(false);
  const [activeScholarship, setActiveScholarship] = useState(null);
  
  const [newChange, setNewChange] = useState({ amount: '', reason: '' });
  const [isSaving, setIsSaving] = useState(false);

  // סטייט חדש עבור סימון שורות מרובות (V)
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchScholarships();
  }, [selectedMonth]);

  const fetchScholarships = async () => {
    setLoading(true);
    setSelectedIds([]); // מאפסים בחירות במעבר בין חודשים
    try {
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

  // פונקציה חדשה: הפעלת תהליך יצירת המלגות באופן יזום
  const handleGenerateScholarships = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/scholarships/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });
      if (response.ok) {
        fetchScholarships(); // מרעננים את הטבלה אחרי היצירה
      } else {
        alert('שגיאה ביצירת הטבלה. ייתכן שהטבלה כבר נוצרה לחודש זה.');
      }
    } catch (error) {
      console.error('שגיאה ביצירת מלגות:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // פעולת סימון V לשורה בודדת
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // פעולת סימון V לכל השורות
  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(scholarships.map(s => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  // פעולה קבוצתית: שינוי סטטוס תשלום ל"בוצע" לכל המסומנים
  const handleMarkAsPaid = async () => {
    if (selectedIds.length === 0) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/scholarships/bulk-pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, isPaid: true })
      });
      if (response.ok) {
        fetchScholarships(); // רענון לאחר העדכון
      }
    } catch (error) {
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const handleOpenChanges = (scholarship) => {
    setActiveScholarship(scholarship);
    setNewChange({ amount: '', reason: '' });
    setShowChangesModal(true);
  };

  const handleAddChange = async (e) => {
    e.preventDefault();
    if (!newChange.amount || !newChange.reason) return;

    setIsSaving(true);
    try {
      const updatedChanges = [...(activeScholarship.manualChanges || []), {
        amount: Number(newChange.amount),
        reason: newChange.reason,
        date: new Date().toISOString(),
        updatedBy: 'צוות ניהול' 
      }];

      // חישוב הסכום הסופי החדש כולל יתרת העבר!
      const totalBase = (activeScholarship.baseAmount || 0) + (activeScholarship.carriedBalance || 0);
      const newFinalAmount = updatedChanges.reduce((total, change) => total + change.amount, totalBase);
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
        fetchScholarships(); 
      }
    } catch (error) {
      alert('שגיאה בשמירת השינוי');
    } finally {
      setIsSaving(false);
    }
  };

  const totalTutorPayments = scholarships.reduce((sum, s) => sum + (s.tutorAmount || 0), 0);
  const totalOfficeProfit = scholarships.reduce((sum, s) => sum + (s.officeProfit || 0), 0);

  return (
    <Container className="pt-4 mb-5" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 style={{ color: 'var(--text-main)', fontWeight: '800' }} className="mb-1">
            ניהול מלגות ותשלומים
          </h2>
          <p className="text-muted mb-0">מעקב אחר תשלומי חונכים, שינויים ידניים, יתרות עבר ורווח למשרד</p>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <Button 
            variant="primary" 
            className="rounded-pill fw-bold shadow-sm"
            onClick={handleGenerateScholarships}
            disabled={isGenerating}
          >
            {isGenerating ? <Spinner size="sm" animation="border" /> : 'צור טבלת מלגות לחודש זה'}
          </Button>

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

      {/* שורת פעולות קבוצתיות במידה ויש שורות מסומנות */}
      {selectedIds.length > 0 && (
        <div className="mb-3 p-3 bg-light rounded border d-flex align-items-center justify-content-between">
          <span className="fw-bold text-primary">{selectedIds.length} חונכים נבחרו</span>
          <Button variant="success" className="rounded-pill fw-bold" onClick={handleMarkAsPaid}>
            <FiCheckCircle className="me-2" /> העבר סטטוס ל"בוצע"
          </Button>
        </div>
      )}

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table hover responsive className="align-middle mb-0 text-nowrap">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 border-0">
                <Form.Check 
                  type="checkbox" 
                  onChange={toggleAll} 
                  checked={scholarships.length > 0 && selectedIds.length === scholarships.length} 
                />
              </th>
              <th className="py-3 text-muted fw-bold border-0">שם החונך</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">בסיס + יתרות עבר</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">פרטי בנק והערות</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">שינויים (תוספת/קיזוז)</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">לתשלום לחונך</th>
              <th className="py-3 text-muted fw-bold border-0 text-center">סטטוס תשלום</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
            ) : scholarships.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-5 text-muted">לא נמצאו מלגות לחודש {selectedMonth}. לחץ על הכפתור למעלה כדי לייצר את הטבלה לחודש זה.</td></tr>
            ) : (
              scholarships.map(scholarship => {
                const tutorName = scholarship.tutor ? `${scholarship.tutor.firstName} ${scholarship.tutor.lastName}` : 'חונך חסר';
                const changesCount = scholarship.manualChanges?.length || 0;
                const isSelected = selectedIds.includes(scholarship._id);
                
                // הסכום המלא של הבסיס כולל יתרת העבר
                const combinedBase = (scholarship.baseAmount || 0) + (scholarship.carriedBalance || 0);

                return (
                  <tr key={scholarship._id} className={isSelected ? 'bg-light' : ''}>
                    <td className="px-4">
                      <Form.Check 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleSelection(scholarship._id)} 
                      />
                    </td>
                    <td className="fw-bold" style={{ color: 'var(--text-main)' }}>{tutorName}</td>
                    <td className="text-center text-muted">
                      ₪{combinedBase.toLocaleString()}
                      {scholarship.carriedBalance > 0 && <Badge bg="info" className="ms-2">כולל חוב עבר</Badge>}
                    </td>
                    <td className="text-center">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-secondary p-0" 
                        title={`פרטי בנק: ${scholarship.tutor?.bankDetails || 'לא הוזנו'}\nהערות כרטיס: ${scholarship.tutor?.notes || 'אין הערות'}`}
                      >
                        <FiFileText size={20} />
                      </Button>
                    </td>
                    <td className="text-center">
                      <Button variant="light" size="sm" className="border rounded-pill text-primary fw-bold" onClick={() => handleOpenChanges(scholarship)}>
                        {changesCount > 0 ? <><FiEdit className="me-1"/> ערוך ({changesCount})</> : <><FiPlusCircle className="me-1"/> הוסף שינוי</>}
                      </Button>
                    </td>
                    <td className="text-center fw-bold" style={{ fontSize: '1.1rem', color: 'var(--primary-accent)' }}>
                      ₪{scholarship.tutorAmount?.toLocaleString() || 0}
                    </td>
                    <td className="text-center">
                      <Badge bg={scholarship.isPaid ? 'success' : 'warning'} text={scholarship.isPaid ? 'light' : 'dark'} className="px-3 py-2 rounded-pill shadow-sm">
                        {scholarship.isPaid ? 'בוצע' : 'ממתין'}
                      </Badge>
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
                <div><small className="text-muted d-block">בסיס + יתרת עבר</small><span className="fw-bold">₪{(activeScholarship.baseAmount + (activeScholarship.carriedBalance || 0))}</span></div>
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