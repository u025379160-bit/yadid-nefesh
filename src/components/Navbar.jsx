import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
// הוספנו את FiCreditCard לאייקונים
import { FiUsers, FiUserCheck, FiBriefcase, FiHome, FiLogOut, FiCreditCard } from 'react-icons/fi';

function AppNavbar({ onLogout, userRole }) {
  const location = useLocation();

  // פונקציה קטנה שבודקת אם אנחנו בעמוד הנוכחי כדי להאיר אותו
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <Navbar expand="lg" style={{ backgroundColor: 'var(--primary-blue)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} variant="dark" className="mb-4">
      <Container>
        {/* לוגו המערכת */}
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

            <Nav.Link as={Link} to="/students" className={`d-flex align-items-center gap-2 ${isActive('/student') ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiUsers size={18} /> ניהול תלמידים
            </Nav.Link>

            <Nav.Link as={Link} to="/tutors" className={`d-flex align-items-center gap-2 ${isActive('/tutor') ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiUserCheck size={18} /> ניהול חונכים
            </Nav.Link>

            <Nav.Link as={Link} to="/placements" className={`d-flex align-items-center gap-2 ${isActive('/placements') ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiBriefcase size={18} /> שיבוצים
            </Nav.Link>

            {/* --- הכפתור החדש של עמוד המשלמים --- */}
            <Nav.Link as={Link} to="/payers" className={`d-flex align-items-center gap-2 ${isActive('/payers') ? 'active text-white fw-bold' : 'text-light'}`}>
              <FiCreditCard size={18} /> גביה ומשלמים
            </Nav.Link>

          </Nav>
          
          <Nav>
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