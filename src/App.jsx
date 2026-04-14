import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainNavbar from './components/Navbar';
import Home from './pages/Home';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Placements from './pages/Placements';
import StudentProfile from './pages/StudentProfile';
import TutorProfile from './pages/TutorProfile';
import Login from './pages/Login';
import Payers from './pages/Payers'; // הוספנו את הייבוא של עמוד המשלמים החדש

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // שומר את התפקיד שלנו

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    // כשהתחברות מצליחה, אנחנו מקבלים את התפקיד ושומרים אותו
    return <Login onLogin={(role) => {
      setIsAuthenticated(true);
      setUserRole(role);
    }} />;
  }

  return (
    <BrowserRouter>
      {/* הוספנו פה את העיצוב החדש שפורס את האתר על כל המסך */}
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* מעבירים לתפריט גם את פונקציית ההתנתקות וגם את התפקיד שלנו */}
        <MainNavbar onLogout={handleLogout} userRole={userRole} />
        
        <div className="container mt-4" style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<Students />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/payers" element={<Payers />} /> {/* הוספנו את הנתיב לעמוד המשלמים */}
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