import { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { FiLock, FiUser } from 'react-icons/fi'; // אייקונים יוקרתיים למסך התחברות

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState(''); // משתנה חדש להצגת הודעת שגיאה

  const handleLogin = (e) => {
    e.preventDefault();
    
    // כאן אנחנו באמת בודקים את הסיסמה!
    // שם המשתמש: admin
    // סיסמה: 1234
    if (username === 'admin' && password === '1234') {
      setError('');
      onLogin(role); // מעביר את התפקיד הנבחר
    } else {
      // אם טועים בסיסמה
      setError('שם משתמש או סיסמה שגויים');
    }
  };

  return (
    <div dir="rtl" className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-gray)' }}>
      <Card className="shadow-lg border-0" style={{ width: '450px', maxWidth: '90%', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* חלק עליון כחול ויוקרתי */}
        <div style={{ backgroundColor: 'var(--primary-blue)', padding: '2rem', textAlign: 'center', color: 'white' }}>
          <div style={{ backgroundColor: 'var(--accent-gold)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 1rem auto', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'}}>
            י"נ
          </div>
          <h2 className="fw-bold mb-1">ידיד נפש</h2>
          <p className="mb-0 opacity-75">מערכת ניהול חונכויות</p>
        </div>

        {/* טופס ההתחברות */}
        <Card.Body className="p-4 p-md-5 bg-white">
          <Form onSubmit={handleLogin}>
            
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small mb-2 d-flex align-items-center gap-2">
                <FiUser /> שם משתמש (admin)
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="הכנס שם משתמש"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small mb-2 d-flex align-items-center gap-2">
                <FiLock /> סיסמה (1234)
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="הכנס סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}
              />
            </Form.Group>

            {/* סימולטור הרשאות (כמו שהיה לך) */}
            <Form.Group className="mb-4 p-3 bg-light border rounded" style={{ borderColor: '#e9ecef' }}>
              <Form.Label className="fw-bold text-danger small mb-2">🛠️ סימולטור הרשאות (לפיתוח בלבד)</Form.Label>
              <Form.Select value={role} onChange={(e) => setRole(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="manager">מנהל מערכת (הכל פתוח)</option>
                <option value="secretary">מזכירה (ללא מחיקות)</option>
                <option value="coordinator">רכזת (הרשאה מוגבלת)</option>
                <option value="tutor">חונך (צפייה בשיבוצים בלבד)</option>
              </Form.Select>
            </Form.Group>

            {/* הודעת שגיאה באדום אם טועים בסיסמה */}
            {error && <div className="text-danger text-center mb-3 fw-bold">{error}</div>}

            <Button variant="primary" type="submit" className="w-100 fw-bold shadow-sm" size="lg" style={{ borderRadius: '8px', padding: '0.75rem' }}>
              התחבר למערכת
            </Button>
            
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;