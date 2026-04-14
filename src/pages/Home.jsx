import { useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FiUsers, FiUserCheck, FiBriefcase, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  // 🧹 שואב אבק: מוודא שהמסך נקי מרקעים אפורים של מודלים כשחוזרים לעמוד הראשי
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

  return (
    <Container className="mt-5" dir="rtl">
      {/* כותרת נקייה ומרכזית */}
      <div className="mb-5 text-center">
        <h2 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-2">
          שלום רכז, ברוך שובך
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          הנה סיכום הנתונים של המערכת להיום:
        </p>
      </div>

      {/* כרטיסיות נתונים - ללא קווים עבים וצבעים צועקים */}
      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="h-100 text-center py-4">
            <Card.Body>
              <div className="mb-2" style={{ color: 'var(--text-muted)' }}><FiUsers size={24} /></div>
              <h5 style={{ color: 'var(--text-muted)', fontWeight: '600' }}>סה"כ תלמידים</h5>
              <h1 style={{ color: 'var(--text-main)', fontSize: '3.5rem', fontWeight: '800' }}>124</h1>
              <small className="text-success fw-bold">↑ 3 חדשים החודש</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 text-center py-4">
            <Card.Body>
              <div className="mb-2" style={{ color: 'var(--text-muted)' }}><FiUserCheck size={24} /></div>
              <h5 style={{ color: 'var(--text-muted)', fontWeight: '600' }}>חונכים פעילים</h5>
              <h1 style={{ color: 'var(--text-main)', fontSize: '3.5rem', fontWeight: '800' }}>38</h1>
              <small style={{ color: '#d97706' }} className="fw-bold">2 ממתינים לשיבוץ</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 text-center py-4">
            <Card.Body>
              <div className="mb-2" style={{ color: 'var(--text-muted)' }}><FiBriefcase size={24} /></div>
              <h5 style={{ color: 'var(--text-muted)', fontWeight: '600' }}>שיבוצים פעילים</h5>
              <h1 style={{ color: 'var(--text-main)', fontSize: '3.5rem', fontWeight: '800' }}>95</h1>
              <small style={{ color: 'var(--text-muted)' }}>5 שיבוצים הסתיימו לאחרונה</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* אזור פעולות מהירות נקי עם אייקונים */}
      <div className="text-center mt-5">
        <h5 style={{ color: 'var(--text-main)', fontWeight: '700' }} className="mb-4">פעולות מהירות</h5>
        <div className="d-flex justify-content-center gap-3">
          <Button variant="outline-primary" className="px-4 py-2 d-flex align-items-center gap-2" onClick={() => navigate('/students')}>
            <FiPlus /> הוסף תלמיד
          </Button>
          <Button variant="outline-primary" className="px-4 py-2 d-flex align-items-center gap-2" onClick={() => navigate('/tutors')}>
            <FiPlus /> הוסף חונך
          </Button>
          <Button variant="outline-primary" className="px-4 py-2 d-flex align-items-center gap-2" onClick={() => navigate('/placements')}>
            <FiPlus /> צור שיבוץ חדש
          </Button>
        </div>
      </div>

    </Container>
  );
}

export default Home;