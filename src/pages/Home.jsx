import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { FiUsers, FiUserCheck, FiBriefcase, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Home({ currentUser }) {
  const navigate = useNavigate();

  // סטייט לשמירת המספרים האמיתיים שמגיעים מהשרת
  const [stats, setStats] = useState({
    students: 0,
    tutors: 0,
    placements: 0,
    loading: true
  });

  // פונקציה ששואבת את הנתונים בזמן אמת ברגע שהעמוד נטען
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, tutorsRes, placementsRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/api/students'),
          fetch(import.meta.env.VITE_API_URL + '/api/tutors'),
          fetch(import.meta.env.VITE_API_URL + '/api/placements')
        ]);

        const students = studentsRes.ok ? await studentsRes.json() : [];
        const tutors = tutorsRes.ok ? await tutorsRes.json() : [];
        const placements = placementsRes.ok ? await placementsRes.json() : [];

        // מסנן רק את השיבוצים הפעילים (כדי לא לספור שיבוצים שהסתיימו)
        const activePlacements = placements.filter(p => p.status !== 'לא פעיל');

        setStats({
          students: students.length,
          tutors: tutors.length,
          placements: activePlacements.length,
          loading: false
        });
      } catch (error) {
        console.error('שגיאה במשיכת נתוני הסטטיסטיקה:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  // 🧹 שואב אבק: מוודא שהמסך נקי מרקעים אפורים של מודלים
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
    <Container className="mt-5 mb-5" dir="rtl">
      {/* כותרת דינמית */}
      <div className="mb-5 text-center">
        <h2 style={{ color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }} className="mb-2">
          שלום {currentUser ? currentUser.name : 'אורח'}, ברוך שובך!
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          הנה סיכום הנתונים של המערכת להיום:
        </p>
      </div>

      {/* כרטיסיות נתונים דינמיות */}
      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="h-100 text-center py-4 border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Body>
              <div className="mb-3 d-inline-flex justify-content-center align-items-center" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                <FiUsers size={28} />
              </div>
              <h5 style={{ color: '#64748b', fontWeight: '600', fontSize: '1.05rem' }}>סה"כ תלמידים</h5>
              <h1 style={{ color: '#0f172a', fontSize: '3.5rem', fontWeight: '800' }} className="my-2">
                {stats.loading ? <Spinner animation="border" size="sm" variant="primary" /> : stats.students}
              </h1>
              <small className="fw-bold" style={{ color: '#10b981' }}>עדכני להיום</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 text-center py-4 border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Body>
              <div className="mb-3 d-inline-flex justify-content-center align-items-center" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706' }}>
                <FiUserCheck size={28} />
              </div>
              <h5 style={{ color: '#64748b', fontWeight: '600', fontSize: '1.05rem' }}>חונכים פעילים</h5>
              <h1 style={{ color: '#0f172a', fontSize: '3.5rem', fontWeight: '800' }} className="my-2">
                {stats.loading ? <Spinner animation="border" size="sm" variant="warning" /> : stats.tutors}
              </h1>
              <small className="fw-bold" style={{ color: '#f59e0b' }}>עדכני להיום</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 text-center py-4 border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <Card.Body>
              <div className="mb-3 d-inline-flex justify-content-center align-items-center" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569' }}>
                <FiBriefcase size={28} />
              </div>
              <h5 style={{ color: '#64748b', fontWeight: '600', fontSize: '1.05rem' }}>שיבוצים פעילים</h5>
              <h1 style={{ color: '#0f172a', fontSize: '3.5rem', fontWeight: '800' }} className="my-2">
                {stats.loading ? <Spinner animation="border" size="sm" variant="secondary" /> : stats.placements}
              </h1>
              <small className="fw-bold" style={{ color: '#94a3b8' }}>עדכני להיום</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* אזור פעולות מהירות */}
      <div className="text-center mt-5">
        <h5 style={{ color: '#334155', fontWeight: '700' }} className="mb-4">פעולות מהירות</h5>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Button variant="outline-primary" className="px-4 py-2 d-flex align-items-center gap-2 rounded-pill shadow-sm bg-white" onClick={() => navigate('/students')}>
            <FiPlus /> הוסף תלמיד
          </Button>
          <Button variant="outline-primary" className="px-4 py-2 d-flex align-items-center gap-2 rounded-pill shadow-sm bg-white" onClick={() => navigate('/tutors')}>
            <FiPlus /> הוסף חונך
          </Button>
          <Button variant="outline-primary" className="px-4 py-2 d-flex align-items-center gap-2 rounded-pill shadow-sm bg-white" onClick={() => navigate('/placements')}>
            <FiPlus /> צור שיבוץ חדש
          </Button>
        </div>
      </div>

    </Container>
  );
}

export default Home;