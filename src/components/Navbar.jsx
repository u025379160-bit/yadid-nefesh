import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiBriefcase, FiHome, FiLogOut, FiCreditCard, FiDollarSign, FiShield, FiUser, FiMessageSquare } from 'react-icons/fi';

function AppNavbar({ onLogout, currentUser }) {
  const location = useLocation();

  // פונקציה קטנה שבודקת אם אנחנו בעמוד הנוכחי כדי להאיר אותו
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // מילון תרגום לתפקידים
  const roleTranslations = {
    'admin': 'אדמין',
    'manager': 'מנהל מערכת',
    'secretary': 'מזכירות',
    'coordinator': 'רכז אזור',
    'tutor': 'חונך'
  };

  const role = currentUser?.role || 'tutor';

  return (
    <Navbar expand="lg" style={{ backgroundColor: 'var(--primary-blue)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} variant="dark" className="mb-4">
      <Container>
        {/* לוגו המערכת - עודכן ללוגו האמיתי שהעלית */}
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4 d-flex align-items-center gap-2">
          <img
            src="/logo.png"
            alt="ידיד נפש לוגו"
            height="40" 
            className="d-inline-block align-top bg-white rounded px-2 py-1"
          />
          <span style={{ letterSpacing: '0.5px' }}>ידיד נפש</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          
          {/* האזור של כל כפתורי הניווט - הפונט הוקטן טיפה לשמירה על אלגנטיות */}
          <Nav className="me-auto gap-3 pe-4" style={{ fontSize: '0.95rem' }}>
            
            <Nav.Link as={Link} to="/" className={`d-flex align-items-center gap-2 ${isActive('/') && location.pathname === '/' ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiHome size={18} /> ראשי
            </Nav.Link>

            {/* רק הנהלה, מזכירות ורכזים רואים תלמידים וחונכים */}
            {['manager', 'admin', 'secretary', 'coordinator'].includes(role) && (
              <>
                <Nav.Link as={Link} to="/students" className={`d-flex align-items-center gap-2 ${isActive('/student') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiUsers size={18} /> תלמידים
                </Nav.Link>
                <Nav.Link as={Link} to="/tutors" className={`d-flex align-items-center gap-2 ${isActive('/tutor') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiUserCheck size={18} /> חונכים
                </Nav.Link>
              </>
            )}

            {/* כולם רואים שיבוצים */}
            <Nav.Link as={Link} to="/placements" className={`d-flex align-items-center gap-2 ${isActive('/placements') ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiBriefcase size={18} /> שיבוצים
            </Nav.Link>

            {/* רק הנהלה ומזכירות רואים כספים */}
            {['manager', 'admin', 'secretary'].includes(role) && (
              <>
                <Nav.Link as={Link} to="/payers" className={`d-flex align-items-center gap-2 ${isActive('/payers') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiCreditCard size={18} /> משלמים
                </Nav.Link>
                <Nav.Link as={Link} to="/billing" className={`d-flex align-items-center gap-2 ${isActive('/billing') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiDollarSign size={18} /> חיובים
                </Nav.Link>
              </>
            )}

            {/* רק הנהלה רואה ניהול צוות */}
            {['manager', 'admin'].includes(role) && (
              <Nav.Link as={Link} to="/team" className={`d-flex align-items-center gap-2 ${isActive('/team') ? 'active text-white fw-bold' : 'text-light'}`}>
                <FiShield size={18} /> צוות
              </Nav.Link>
            )}

            {/* משימות ותיעוד */}
            <Nav.Link as={Link} to="/tasks" className={`d-flex align-items-center gap-2 ${isActive('/tasks') ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiMessageSquare size={18} /> משימות
            </Nav.Link>

          </Nav>
          
          {/* אזור המשתמש בצד שמאל (שם + התנתקות) */}
          <Nav className="align-items-center gap-3">
            
            {currentUser && (
              <div className="d-none d-lg-flex align-items-center gap-2 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                <FiUser size={16} /> 
                <span>שלום, <strong>{currentUser.name}</strong></span>
                <span className="opacity-75">({roleTranslations[currentUser.role] || role})</span>
              </div>
            )}

            <Nav.Link onClick={onLogout} className="d-flex align-items-center gap-2 text-light opacity-75 hover-opacity-100" style={{ cursor: 'pointer' }}>
              <FiLogOut size={18} /> התנתק
            </Nav.Link>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;