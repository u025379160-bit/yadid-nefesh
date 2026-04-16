import { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { FiLock, FiMail } from 'react-icons/fi'; 

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 השינוי כאן: מעבירים את כל אובייקט המשתמש (שם, תפקיד, אידי)
        onLogin(data.user); 
      } else {
        setError(data.message || 'אימייל או סיסמה שגויים');
      }
    } catch (err) {
      setError('שגיאת תקשורת מול השרת. ודא שהגדרת VITE_API_URL ב-Render.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-gray)' }}>
      <Card className="shadow-lg border-0" style={{ width: '450px', maxWidth: '90%', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'var(--primary-blue)', padding: '2rem', textAlign: 'center', color: 'white' }}>
          <div style={{ backgroundColor: 'var(--accent-gold)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 1rem auto', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'}}>
            י"נ
          </div>
          <h2 className="fw-bold mb-1">ידיד נפש</h2>
          <p className="mb-0 opacity-75">מערכת ניהול חונכויות</p>
        </div>
        <Card.Body className="p-4 p-md-5 bg-white">
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small mb-2 d-flex align-items-center gap-2"><FiMail /> אימייל (שם משתמש)</Form.Label>
              <Form.Control type="email" placeholder="הכנס אימייל" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small mb-2 d-flex align-items-center gap-2"><FiLock /> סיסמה</Form.Label>
              <Form.Control type="password" placeholder="הכנס סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" style={{ textAlign: 'left', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }} />
            </Form.Group>
            {error && <div className="text-danger text-center mb-3 fw-bold bg-light p-2 rounded">{error}</div>}
            <Button disabled={isLoading} variant="primary" type="submit" className="w-100 fw-bold shadow-sm d-flex justify-content-center gap-2 align-items-center" size="lg" style={{ borderRadius: '8px', padding: '0.75rem' }}>
              {isLoading ? <Spinner size="sm" animation="border" /> : 'התחבר למערכת'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;