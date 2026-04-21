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
      <Navbar expand="xl" sticky="top" className="shadow-sm" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
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
            
            <Nav className="mx-auto gap-2" style={{ fontSize: '1.05rem' }}>
              
              <Nav.Link as={Link} to="/" className={isActive('/') && location.pathname === '/' ? 'nav-modern active' : 'nav-modern'}>
                ראשי
              </Nav.Link>

              {['manager', 'admin', 'secretary', 'coordinator'].includes(role) && (
                <>
                  <Nav.Link as={Link} to="/students" className={isActive('/student') ? 'nav-modern active' : 'nav-modern'}>
                    תלמידים
                  </Nav.Link>
                  <Nav.Link as={Link} to="/tutors" className={isActive('/tutor') ? 'nav-modern active' : 'nav-modern'}>
                    חונכים
                  </Nav.Link>
                </>
              )}

              <Nav.Link as={Link} to="/placements" className={isActive('/placements') ? 'nav-modern active' : 'nav-modern'}>
                שיבוצים
              </Nav.Link>

              {['manager', 'admin', 'secretary'].includes(role) && (
                <>
                  <Nav.Link as={Link} to="/payers" className={isActive('/payers') ? 'nav-modern active' : 'nav-modern'}>
                    משלמים
                  </Nav.Link>
                  <Nav.Link as={Link} to="/billing" className={isActive('/billing') ? 'nav-modern active' : 'nav-modern'}>
                    חיובים
                  </Nav.Link>
                  <Nav.Link as={Link} to="/scholarships" className={isActive('/scholarships') ? 'nav-modern active' : 'nav-modern'}>
                    מלגות
                  </Nav.Link>
                </>
              )}

              {['manager', 'admin'].includes(role) && (
                <>
                  
                  {/* 👇 הוספנו את כפתור ההגדרות למנהלים בלבד 👇 */}
                  <Nav.Link as={Link} to="/settings" className={isActive('/settings') ? 'nav-modern active' : 'nav-modern'}>
                    הגדרות
                  </Nav.Link>
                </>
              )}

              <Nav.Link as={Link} to="/tasks" className={isActive('/tasks') ? 'nav-modern active' : 'nav-modern'}>
                משימות
              </Nav.Link>

            </Nav>
            
            {/* צד שמאל: אזור משתמש מקובע */}
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

              {/* כפתור התנתקות מודרני */}
              <Button 
                variant="light" 
                onClick={onLogout} 
                className="rounded-pill d-flex align-items-center gap-2 px-3 logout-modern flex-shrink-0"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>התנתק</span>
                <FiLogOut size={16} />
              </Button>
            </div>

          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ width: '100%', height: '4px', background: 'linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%)' }}></div>

      <style>{`
        /* העיצוב המודרני החדש לקישורים - דומה לכפתורי הטבלה */
        .nav-modern {
          color: #64748b !important;
          padding: 8px 18px !important;
          border-radius: 999px; /* עיצוב גלולה עגול */
          transition: all 0.2s ease;
          white-space: nowrap; 
          font-weight: 600;
        }
        
        .nav-modern:hover {
          background-color: #f1f5f9;
          color: #334155 !important;
        }
        
        .nav-modern.active {
          background-color: #e0f2fe !important; /* תכלת קצת יותר מודגש לרקע העדין */
          color: #0369a1 !important; /* כחול בולט כמו כפתור ההוספה */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        /* עיצוב לכפתור ההתנתקות */
        .logout-modern {
          color: #64748b !important;
          background-color: #ffffff;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .logout-modern:hover {
          background-color: #fee2e2 !important; /* אדום בהיר */
          color: #ef4444 !important; /* טקסט אדום */
          border-color: #fca5a5 !important;
        }
      `}</style>
    </>
  );
}

export default MainNavbar;