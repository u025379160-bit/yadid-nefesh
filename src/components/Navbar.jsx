import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

function MainNavbar({ onLogout, currentUser }) {
  const location = useLocation();

  // בדיקה אם העמוד פעיל כדי להאיר אותו
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // תרגום תפקידים לאזור השמאלי
  const roleTranslations = {
    'admin': 'אדמין',
    'manager': 'מנהל מערכת',
    'secretary': 'מזכירות',
    'coordinator': 'רכז אזור',
    'tutor': 'חונך'
  };

  const role = currentUser?.role || 'tutor';

  return (
    <>
      <Navbar expand="xl" sticky="top" className="bg-white">
        <Container fluid className="px-lg-5">
          
          {/* צד ימין: לוגו */}
          <Navbar.Brand as={Link} to="/" className="me-4 d-flex align-items-center">
            <img
              src="/logo.png"
              alt="ידיד נפש לוגו"
              height="45"
              className="d-inline-block align-top"
            />
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none" />
          <Navbar.Collapse id="basic-navbar-nav">
            
            {/* מרכז: כאן עשינו את הקסם - שינינו ל mx-auto כדי למרכז את התפריט ולנצל את המקום */}
            <Nav className="mx-auto gap-4" style={{ fontSize: '1.05rem', fontWeight: '500' }}>
              
              <Nav.Link as={Link} to="/" className={isActive('/') && location.pathname === '/' ? 'nav-elegant active' : 'nav-elegant'}>
                ראשי
              </Nav.Link>

              {['manager', 'admin', 'secretary', 'coordinator'].includes(role) && (
                <>
                  <Nav.Link as={Link} to="/students" className={isActive('/student') ? 'nav-elegant active' : 'nav-elegant'}>
                    תלמידים
                  </Nav.Link>
                  <Nav.Link as={Link} to="/tutors" className={isActive('/tutor') ? 'nav-elegant active' : 'nav-elegant'}>
                    חונכים
                  </Nav.Link>
                </>
              )}

              <Nav.Link as={Link} to="/placements" className={isActive('/placements') ? 'nav-elegant active' : 'nav-elegant'}>
                שיבוצים
              </Nav.Link>

              {['manager', 'admin', 'secretary'].includes(role) && (
                <>
                  <Nav.Link as={Link} to="/payers" className={isActive('/payers') ? 'nav-elegant active' : 'nav-elegant'}>
                    משלמים
                  </Nav.Link>
                  <Nav.Link as={Link} to="/billing" className={isActive('/billing') ? 'nav-elegant active' : 'nav-elegant'}>
                    חיובים
                  </Nav.Link>
                </>
              )}

              {['manager', 'admin'].includes(role) && (
                <Nav.Link as={Link} to="/team" className={isActive('/team') ? 'nav-elegant active' : 'nav-elegant'}>
                  צוות ניהול
                </Nav.Link>
              )}

              <Nav.Link as={Link} to="/tasks" className={isActive('/tasks') ? 'nav-elegant active' : 'nav-elegant'}>
                משימות
              </Nav.Link>

            </Nav>
            
            {/* צד שמאל: אזור משתמש מקובע שלא יידרס */}
            <div className="d-flex align-items-center justify-content-end gap-3 mt-3 mt-xl-0" style={{ minWidth: '220px' }}>
              {currentUser && (
                <div className="text-end" style={{ lineHeight: '1.2' }}>
                  <div className="text-truncate" style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.95rem', maxWidth: '160px' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {roleTranslations[currentUser.role] || role}
                  </div>
                </div>
              )}

              <Button 
                variant="link" 
                onClick={onLogout} 
                className="text-decoration-none d-flex align-items-center gap-2 px-0 logout-elegant flex-shrink-0"
              >
                <span style={{ fontWeight: '500' }}>התנתק</span>
                <FiLogOut size={18} />
              </Button>
            </div>

          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ width: '100%', height: '4px', background: 'linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%)' }}></div>

      <style>{`
        .nav-elegant {
          color: #475569 !important;
          position: relative;
          padding: 8px 0 !important;
          transition: color 0.3s ease;
          white-space: nowrap; 
        }
        
        .nav-elegant:hover {
          color: #d97706 !important;
        }
        
        .nav-elegant.active {
          color: #d97706 !important;
          font-weight: 700 !important;
        }
        
        .nav-elegant::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background-color: #d97706;
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        
        .nav-elegant:hover::after, .nav-elegant.active::after {
          width: 100%;
        }

        .logout-elegant {
          color: #64748b !important;
          transition: color 0.2s ease;
          white-space: nowrap;
        }
        
        .logout-elegant:hover {
          color: #ef4444 !important;
        }
      `}</style>
    </>
  );
}

export default MainNavbar;