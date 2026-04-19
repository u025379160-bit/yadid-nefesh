import { useState, useEffect } from 'react';
import { Toast, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';

function TaskNotification({ currentUser }) {
  const [show, setShow] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // אם אין משתמש מחובר, אל תעשה כלום
    if (!currentUser) return;

    const fetchUserTasks = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/api/tasks');
        if (response.ok) {
          const tasks = await response.json();
          
          // מסננים משימות: 
          // 1. שהמשתמש הנוכחי אחראי עליהן (בודק לפי ID או לפי שם)
          // 2. שהסטטוס שלהן עדיין פתוח (לא 'הושלם' או 'בוצע')
          const pendingTasks = tasks.filter(task => {
            const isAssignedToMe = 
              (task.assignee?._id === currentUser._id) || 
              (task.assignee === currentUser._id) || 
              (task.assignee === currentUser.name);
              
            const isOpen = task.status !== 'הושלם' && task.status !== 'בוצע';
            
            return isAssignedToMe && isOpen;
          });

          if (pendingTasks.length > 0) {
            setTaskCount(pendingTasks.length);
            // משהה קצת את הקפיצה של הבועה כדי שזה יראה טוב אחרי טעינת העמוד
            setTimeout(() => setShow(true), 1500); 
          }
        }
      } catch (error) {
        console.error('שגיאה בשליפת משימות להתראה:', error);
      }
    };

    fetchUserTasks();
  }, [currentUser]);

  // אם אין משימות או שהבועה נסגרה - לא מציגים כלום
  if (!show || taskCount === 0) return null;

  return (
    // מיקום הבועה בפינה השמאלית התחתונה מעל הכל
    <div style={{ position: 'fixed', bottom: '30px', left: '30px', zIndex: 9999 }} dir="rtl">
      <Toast 
        onClose={() => setShow(false)} 
        show={show} 
        animation={true}
        className="shadow-lg border-0" 
        style={{ borderRadius: '16px', minWidth: '280px' }}
      >
        <Toast.Header closeButton={true} style={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e0f2fe', borderTopRightRadius: '16px', borderTopLeftRadius: '16px' }}>
          <div className="d-flex align-items-center w-100" style={{ color: '#0284c7' }}>
            <FiBell className="me-2" size={18} />
            <strong className="me-auto" style={{ fontSize: '1.05rem' }}>התראת משימות</strong>
          </div>
        </Toast.Header>
        <Toast.Body className="bg-white text-center p-4" style={{ borderBottomRightRadius: '16px', borderBottomLeftRadius: '16px' }}>
          <div style={{ color: '#334155', fontSize: '1.1rem', marginBottom: '20px' }}>
            יש לך <strong style={{ color: '#ef4444', fontSize: '1.3rem' }}>{taskCount}</strong> משימות שממתינות לטיפולך!
          </div>
          <Button
            variant="primary"
            className="rounded-pill shadow-sm px-4 fw-bold w-100"
            onClick={() => {
              setShow(false);
              navigate('/tasks');
            }}
          >
            עבור למשימות שלי
          </Button>
        </Toast.Body>
      </Toast>
    </div>
  );
}

export default TaskNotification;