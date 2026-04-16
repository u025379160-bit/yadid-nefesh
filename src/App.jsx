import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainNavbar from './components/Navbar';
import Home from './pages/Home';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Placements from './pages/Placements';
import StudentProfile from './pages/StudentProfile';
import TutorProfile from './pages/TutorProfile';
import Login from './pages/Login';
import Payers from './pages/Payers'; 
import PayerProfile from './pages/PayerProfile'; 
import Billing from './pages/Billing';
import Team from './pages/Team';
import Tasks from './pages/Tasks'; // 🔥 הוספנו את הייבוא של עמוד המשימות

function GlobalCleaner() {
  const location = useLocation();
  useEffect(() => {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(el => el.remove());
  }, [location]);
  return null;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 🔥 שינינו מ-userRole ל-currentUser ששומר את הכל!
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={(user) => {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }} />;
  }

  return (
    <BrowserRouter>
      <GlobalCleaner />
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* העברנו ל-Navbar את המשתמש המלא */}
        <MainNavbar onLogout={handleLogout} currentUser={currentUser} />
        
        <div className="container mt-4" style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<Students />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/payers" element={<Payers />} /> 
            <Route path="/payer/:id" element={<PayerProfile />} /> 
            <Route path="/billing" element={<Billing />} /> 
            <Route path="/student/:id" element={<StudentProfile />} />
            <Route path="/tutor/:id" element={<TutorProfile />} />
            <Route path="/team" element={<Team />} />
            
            {/* 🔥 הנתיב החדש למשימות שמעביר את פרטי המשתמש המחובר */}
            <Route path="/tasks" element={<Tasks currentUser={currentUser} />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;