import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Table, Spinner, Row, Col } from 'react-bootstrap';
import { FiCalendar, FiTrash2, FiPlus, FiSave } from 'react-icons/fi';

function AdminSettings() {
  const [dates, setDates] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [hebrewPreview, setHebrewPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // שליפת ההגדרות הקיימות כשהמסך עולה
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/settings');
        if (res.ok) {
          const data = await res.json();
          // נמיר כל תאריך למבנה שמכיל גם את העברי
          const datesWithHebrew = await Promise.all(
            (data.guidanceAlertDates || []).map(async (d) => {
              const heb = await getHebrewDate(d);
              return { gregorian: d, hebrew: heb };
            })
          );
          // מסדרים מהקרוב לרחוק
          datesWithHebrew.sort((a, b) => new Date(a.gregorian) - new Date(b.gregorian));
          setDates(datesWithHebrew);
        }
      } catch (error) {
        console.error('שגיאה בשליפת הגדרות:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // פונקציית עזר לפניה ל-API כדי להמיר לועזי לעברי
  const getHebrewDate = async (dateString) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-');
      const res = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
      const data = await res.json();
      return data.hebrew; // מחזיר מחרוזת, למשל "ד׳ באייר תשפ״ו"
    } catch (error) {
      return 'שגיאה בהמרה';
    }
  };

  // ברגע שבוחרים תאריך בלוח השנה הלועזי, מציגים מיד את העברי מתחתיו
  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setNewDate(selectedDate);
    if (selectedDate) {
      const heb = await getHebrewDate(selectedDate);
      setHebrewPreview(heb);
    } else {
      setHebrewPreview('');
    }
  };

  const handleAddDate = () => {
    if (!newDate) return;
    if (dates.find(d => d.gregorian === newDate)) {
      alert('התאריך כבר קיים ברשימה');
      return;
    }
    
    const updatedDates = [...dates, { gregorian: newDate, hebrew: hebrewPreview }];
    updatedDates.sort((a, b) => new Date(a.gregorian) - new Date(b.gregorian));
    setDates(updatedDates);
    
    setNewDate('');
    setHebrewPreview('');
  };

  const handleRemoveDate = (dateToRemove) => {
    setDates(dates.filter(d => d.gregorian !== dateToRemove));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const payload = {
        guidanceAlertDates: dates.map(d => d.gregorian) // לשרת שולחים רק את המחרוזת הלועזית כדי לחסוך מקום
      };

      const res = await fetch(import.meta.env.VITE_API_URL + '/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('ההגדרות נשמרו בהצלחה!');
      } else {
        alert('שגיאה בשמירת ההגדרות');
      }
    } catch (error) {
      alert('שגיאת תקשורת');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: '#2563eb'}} /></Container>;

  return (
    <Container className="mt-5 mb-5" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: '800' }} className="mb-1">הגדרות מערכת מנהל</h2>
          <p style={{ color: '#64748b' }} className="mb-0">יומן אוטומציות - מתי המערכת תקפיץ משימות הדרכה?</p>
        </div>
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm fw-bold" 
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? <Spinner size="sm" /> : <FiSave />} שמור הגדרות בענן
        </Button>
      </div>

      <Row className="g-4">
        <Col md={5}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-bottom p-4">
              <h5 className="fw-bold mb-0" style={{ color: '#0f172a' }}>הוספת תאריך חדש ליומן</h5>
            </Card.Header>
            <Card.Body className="p-4 bg-light" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>בחר תאריך לועזי</Form.Label>
                <Form.Control 
                  type="date" 
                  value={newDate} 
                  onChange={handleDateChange} 
                  style={{ borderRadius: '8px', padding: '12px' }}
                />
              </Form.Group>
              
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', minHeight: '60px' }}>
                <small className="text-muted d-block mb-1">התאריך העברי שייקבע:</small>
                {hebrewPreview ? (
                  <span className="fw-bold fs-5" style={{ color: '#2563eb' }}>{hebrewPreview}</span>
                ) : (
                  <span className="text-muted small">בחר תאריך למעלה כדי לראות תרגום...</span>
                )}
              </div>

              <Button 
                variant="outline-primary" 
                className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold"
                onClick={handleAddDate}
                disabled={!newDate}
                style={{ borderRadius: '8px', padding: '10px' }}
              >
                <FiPlus /> הוסף ליומן ההקפצות
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-bottom p-4">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                <FiCalendar className="text-primary" /> תאריכים מוגדרים במערכת ({dates.length})
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="p-3 text-muted fw-bold border-0">תאריך לועזי</th>
                    <th className="p-3 text-muted fw-bold border-0">תאריך עברי</th>
                    <th className="p-3 text-center text-muted fw-bold border-0">הסר</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-5 text-muted">לא הוגדרו תאריכים. המערכת לא תקפיץ התראות.</td>
                    </tr>
                  ) : (
                    dates.map((dateObj, idx) => (
                      <tr key={idx}>
                        <td className="p-3 fw-bold" dir="ltr" style={{ color: '#334155', textAlign: 'right' }}>
                          {new Date(dateObj.gregorian).toLocaleDateString('he-IL')}
                        </td>
                        <td className="p-3 fw-bold" style={{ color: '#2563eb' }}>
                          {dateObj.hebrew}
                        </td>
                        <td className="p-3 text-center">
                          <Button 
                            variant="link" 
                            className="text-danger p-0" 
                            onClick={() => handleRemoveDate(dateObj.gregorian)}
                          >
                            <FiTrash2 size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminSettings;