import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // הוספנו פה רק את useLocation
import MainNavbar from './components/Navbar';
import Home from './pages/Home';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Placements from './pages/Placements';
import StudentProfile from './pages/StudentProfile';
import TutorProfile from './pages/TutorProfile';
import Login from './pages/Login';
import Payers from './pages/Payers'; 

// 🧹 המנקה הגלובלי: מוודא שאין רקעים אפורים בכל פעם שאתה עובר עמוד
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
  const [userRole, setUserRole] = useState(null); 

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={(role) => {
      setIsAuthenticated(true);
      setUserRole(role);
    }} />;
  }

  return (
    <BrowserRouter>
      {/* מפעילים את המנקה מאחורי הקלעים */}
      <GlobalCleaner />
      
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        <MainNavbar onLogout={handleLogout} userRole={userRole} />
        
        <div className="container mt-4" style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<Students />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/payers" element={<Payers />} /> 
            <Route path="/student/:id" element={<StudentProfile />} />
            <Route path="/tutor/:id" element={<TutorProfile />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;