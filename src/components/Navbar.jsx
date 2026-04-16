import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiBriefcase, FiHome, FiLogOut, FiCreditCard, FiDollarSign, FiShield, FiUser } from 'react-icons/fi';

function AppNavbar({ onLogout, currentUser }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // מילון תרגום לתפקידים
  const roleTranslations = {
    'admin': 'אדמין',
    'manager': 'מנהל',
    'secretary': 'מזכירות',
    'coordinator': 'רכז',
    'tutor': 'חונך'
  };

  const role = currentUser?.role || 'tutor';

  return (
    <Navbar expand="lg" style={{ backgroundColor: 'var(--primary-blue)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} variant="dark" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4 d-flex align-items-center gap-2">
          <div style={{ backgroundColor: 'var(--accent-gold)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem'}}>
            י"נ
          </div>
          <span style={{ letterSpacing: '0.5px' }}>ידיד נפש</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto gap-3 pe-4">
            
            <Nav.Link as={Link} to="/" className={`d-flex align-items-center gap-2 ${isActive('/') && location.pathname === '/' ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiHome size={18} /> ראשי
            </Nav.Link>

            {/* רק מנהלים, מזכירות ורכזים רואים תלמידים וחונכים (חונך פשוט לא רואה את שאר החונכים) */}
            {['manager', 'admin', 'secretary', 'coordinator'].includes(role) && (
              <>
                <Nav.Link as={Link} to="/students" className={`d-flex align-items-center gap-2 ${isActive('/student') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiUsers size={18} /> ניהול תלמידים
                </Nav.Link>
                <Nav.Link as={Link} to="/tutors" className={`d-flex align-items-center gap-2 ${isActive('/tutor') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiUserCheck size={18} /> ניהול חונכים
                </Nav.Link>
              </>
            )}

            {/* כולם רואים שיבוצים (חונך יראה רק את שלו בהמשך, אבל הכפתור חייב להיות קיים) */}
            <Nav.Link as={Link} to="/placements" className={`d-flex align-items-center gap-2 ${isActive('/placements') ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiBriefcase size={18} /> שיבוצים
            </Nav.Link>

            {/* רק מנהל, אדמין ומזכירות רואים כספים */}
            {['manager', 'admin', 'secretary'].includes(role) && (
              <>
                <Nav.Link as={Link} to="/payers" className={`d-flex align-items-center gap-2 ${isActive('/payers') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiCreditCard size={18} /> גביה ומשלמים
                </Nav.Link>
                <Nav.Link as={Link} to="/billing" className={`d-flex align-items-center gap-2 ${isActive('/billing') ? 'active text-white fw-bold' : 'text-light'}`}>
                  <FiDollarSign size={18} /> חישוב וגביה
                </Nav.Link>
              </>
            )}

            {/* רק מנהל ואדמין רואים ניהול צוות */}
            {['manager', 'admin'].includes(role) && (
              <Nav.Link as={Link} to="/team" className={`d-flex align-items-center gap-2 ${isActive('/team') ? 'active text-white fw-bold' : 'text-light'}`}>
                <FiShield size={18} /> ניהול צוות
              </Nav.Link>
            )}

          </Nav>
          
          <Nav className="align-items-center gap-3">
            {/* 🔥 הנה הבלוק החדש שמציג את שם המשתמש והתפקיד שלו! */}
            {currentUser && (
              <div className="d-none d-lg-flex align-items-center gap-2 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                <FiUser size={16} /> 
                <span>שלום, <strong>{currentUser.name}</strong></span>
                <span className="opacity-75">({roleTranslations[currentUser.role]})</span>
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