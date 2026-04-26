import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, ListGroup, Spinner, Modal, Form } from 'react-bootstrap';
import {
  FiArrowRight,
  FiEdit2,
  FiUser,
  FiMapPin,
  FiFileText,
  FiCheckSquare,
  FiTrash2,
  FiCreditCard,
  FiUserPlus,
  FiUserCheck,
  FiSettings,
  FiLock,
  FiPlusCircle,
  FiMinusCircle,
  FiCalendar
} from 'react-icons/fi';
import Select from 'react-select';

function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [payers, setPayers] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // מאגר ערים ורחובות
  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);
  const [isSearchingStreets, setIsSearchingStreets] = useState(false);

  // תאריך עברי שמחושב אוטומטית (נשאר לצורך תצוגה כללית אם צריך)
  const [hebrewBirthDate, setHebrewBirthDate] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  const [showPayerEditModal, setShowPayerEditModal] = useState(false);
  const [payerFormData, setPayerFormData] = useState({});

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const taskTypes = ['תיעוד פעילות', 'בקשת עזרה', 'עדכון סטטוס', 'אחר'];
  const [taskData, setTaskData] = useState({
    associatedToType: 'student',
    associatedToId: id,
    taskType: 'תיעוד פעילות',
    content: '',
    status: 'published',
    isEncrypted: false,
    sendSystemAlert: true,
    sendEmailAlert: false
  });

  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementData, setPlacementData] = useState({
    tutor: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    paymentMethod: 'credit_card',
    status: 'פעיל'
  });

  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
    };
  }, []);

  const fetchData = async () => {
    try {
      const [studentRes, tasksRes, placementsRes, payersRes, tutorsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}/tasks`),
        fetch(`${import.meta.env.VITE_API_URL}/api/placements`),
        fetch(`${import.meta.env.VITE_API_URL}/api/payers`),
        fetch(`${import.meta.env.VITE_API_URL}/api/tutors`)
      ]);

      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudent(studentData);

        if (studentData.birthDate) {
          const d = new Date(studentData.birthDate);
          fetch(`https://www.hebcal.com/converter?cfg=json&gy=${d.getFullYear()}&gm=${d.getMonth() + 1}&gd=${d.getDate()}&g2h=1`)
            .then(res => res.json())
            .then(data => setHebrewBirthDate(data.hebrew))
            .catch(err => console.log('שגיאה בהמרת תאריך עברי', err));
        }
      }

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (payersRes.ok) setPayers(await payersRes.json());
      if (tutorsRes.ok) setTutors(await tutorsRes.json());

      if (placementsRes.ok) {
        const allPlacements = await placementsRes.json();
        const myPlacements = allPlacements.filter(p => p.student && p.student._id === id);
        setPlacements(myPlacements);
      }

    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    fetch(import.meta.env.VITE_API_URL + '/api/geo/cities')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCities(data);
      })
      .catch(err => console.error("שגיאה בטעינת ערים:", err));
  }, [id]);

  const fetchStreetsFromServer = useCallback(async (cityName) => {
    if (!cityName) {
      setStreets([]);
      return;
    }
    setIsSearchingStreets(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/geo/streets?city=${encodeURIComponent(cityName)}`);
      if (response.ok) {
        const data = await response.json();
        setStreets(data);
      }
    } catch (err) {
      console.error("שגיאה בטעינת רחובות:", err);
    } finally {
      setIsSearchingStreets(false);
    }
  }, []);

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diffMs = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const numberToGematria = (num) => {
    let n = num > 1000 ? num % 1000 : num;
    let str = '';

    if (n >= 400) { str += 'ת'; n -= 400; }
    if (n >= 400) { str += 'ת'; n -= 400; }
    if (n >= 300) { str += 'ש'; n -= 300; }
    if (n >= 200) { str += 'ר'; n -= 200; }
    if (n >= 100) { str += 'ק'; n -= 100; }

    if (n === 15) { str += 'טו'; n = 0; }
    else if (n === 16) { str += 'טז'; n = 0; }
    else {
      if (n >= 90) { str += 'צ'; n -= 90; }
      if (n >= 80) { str += 'פ'; n -= 80; }
      if (n >= 70) { str += 'ע'; n -= 70; }
      if (n >= 60) { str += 'ס'; n -= 60; }
      if (n >= 50) { str += 'נ'; n -= 50; }
      if (n >= 40) { str += 'מ'; n -= 40; }
      if (n >= 30) { str += 'ל'; n -= 30; }
      if (n >= 20) { str += 'כ'; n -= 20; }
      if (n >= 10) { str += 'י'; n -= 10; }
    }

    const units = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    str += units[n];

    if (str.length === 1) return str + "'";
    return str.slice(0, -1) + '"' + str.slice(-1);
  };

  const getHebrewDate = (gregorianDateStr) => {
    if (!gregorianDateStr) return '';
    try {
      const date = new Date(gregorianDateStr);
      let formatted = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);

      const dayMatch = formatted.match(/^\d+/);
      if (dayMatch) {
        const numDay = parseInt(dayMatch[0], 10);
        formatted = formatted.replace(dayMatch[0], numberToGematria(numDay));
      }

      const yearMatch = formatted.match(/\d{4}/);
      if (yearMatch) {
        const numYear = parseInt(yearMatch[0], 10);
        formatted = formatted.replace(yearMatch[0], numberToGematria(numYear));
      }
      return formatted;
    } catch (error) {
      return '';
    }
  };

  const handleOpenPayerEdit = () => {
    const activePayer = payers.find(p => p._id === (student.payer?._id || student.payer));
    if (activePayer) {
      setPayerFormData(activePayer);
      setShowPayerEditModal(true);
    }
  };

  const handlePayerChange = (e) => {
    setPayerFormData({ ...payerFormData, [e.target.name]: e.target.value });
  };

  const handleUpdatePayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payers/${payerFormData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payerFormData),
      });
      if (response.ok) {
        setShowPayerEditModal(false);
        fetchData();
      } else {
        alert('שגיאה בעדכון המשלם');
      }
    } catch (error) {
      alert('שגיאת תקשורת בעדכון המשלם');
    }
  };

  const handleQuickSetPayer = async () => {
    if (!student.fatherName) {
      alert("יש להזין שם אב בפרטי התלמיד לפני שניתן להגדירו כמשלם.");
      return;
    }

    const existingPayer = payers.find(p => p.name.trim() === student.fatherName.trim());

    if (existingPayer) {
      if (window.confirm(`💡 מצאנו במערכת משלם קיים בשם "${existingPayer.name}".\n\nהאם ברצונך לשייך את התלמיד אליו?`)) {
        try {
          setLoading(true);
          const studentUpdateRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payer: existingPayer._id }),
          });
          if (studentUpdateRes.ok) {
            fetchData();
          }
        } catch (error) {
          alert("שגיאה בתהליך השיוך: " + error.message);
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    if (!window.confirm(`האם להקים באופן אוטומטי משלם חדש בשם "${student.fatherName}" ולשייך לתלמיד?`)) return;

    try {
      setLoading(true);
      const payerRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.fatherName,
          identifier: student.idNumber + "-P",
          phone: student.phone1,
          payerType: 'individual',
          notes: `נוצר אוטומטית עבור התלמיד ${student.firstName}`
        }),
      });

      if (!payerRes.ok) throw new Error("שגיאה ביצירת המשלם");
      const newPayer = await payerRes.json();

      const studentUpdateRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payer: newPayer._id }),
      });

      if (studentUpdateRes.ok) {
        fetchData();
      }
    } catch (error) {
      alert("שגיאה בתהליך: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlacements = placements.filter(p => {
    if (!p.startDate) return false;
    const pDate = new Date(p.startDate);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);
    const isStartedBySelectedMonth = pDate.getFullYear() < sYear || (pDate.getFullYear() === sYear && pDate.getMonth() + 1 <= sMonth);
    return isStartedBySelectedMonth && p.status !== 'לא פעיל';
  });

  const totalMonthlyCost = filteredPlacements.reduce((sum, placement) => {
    return sum + (Number(placement.paymentAmount) || 0);
  }, 0);

  const handleOpenEdit = () => {
    let formattedDate = '';
    if (student.birthDate) {
      formattedDate = new Date(student.birthDate).toISOString().split('T')[0];
    }
    const payerId = student.payer?._id || student.payer || '';
    
    setFormData({
      ...student,
      birthDate: formattedDate,
      payer: payerId,
      contacts: student.contacts || []
    });

    if (student.city) {
      fetchStreetsFromServer(student.city);
    }
    
    setShowEditModal(true);
  };

  const handleCloseEdit = () => setShowEditModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddContact = () => {
    setFormData({
      ...formData,
      contacts: [...(formData.contacts || []), { contactType: '', role: '', name: '', phone1: '', phone2: '' }]
    });
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleRemoveContact = (index) => {
    const newContacts = formData.contacts.filter((_, i) => i !== index);
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    
    const fullAddress = `${formData.street || ''} ${formData.houseNumber || ''}`.trim();
    const dataToSend = { ...formData, address: fullAddress };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (response.ok) {
        setShowEditModal(false);
        fetchData();
      } else {
        alert('שגיאה בעדכון התלמיד');
      }
    } catch (error) {
      alert('שגיאת תקשורת עם השרת');
    }
  };

  const handleOpenTask = () => {
    setTaskData({
      associatedToType: 'student',
      associatedToId: id,
      taskType: 'תיעוד פעילות',
      content: '',
      status: 'published',
      isEncrypted: false,
      sendSystemAlert: true,
      sendEmailAlert: false
    });
    setShowTaskModal(true);
  };

  const handleCloseTask = () => setShowTaskModal(false);

  const handleTaskChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setTaskData({ ...taskData, [e.target.name]: value });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setIsSavingTask(true);

    const payload = { ...taskData, createdBy: 'מערכת (מהכרטיס)' };

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const tasksRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}/tasks`);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        setShowTaskModal(false);
      } else {
        alert('שגיאה בשמירת המשימה');
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('האם למחוק משימה זו?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      alert('שגיאה במחיקת משימה');
    }
  };

  const handleOpenPlacement = () => setShowPlacementModal(true);

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    if (!placementData.tutor) {
      alert("חובה לבחור חונך");
      return;
    }
    try {
      const payload = { ...placementData, student: id };
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setShowPlacementModal(false);
        setPlacementData({
          tutor: '',
          startDate: new Date().toISOString().split('T')[0],
          paymentAmount: '',
          paymentMethod: 'credit_card',
          status: 'פעיל'
        });
        fetchData();
      } else {
        alert('שגיאה ביצירת השיבוץ');
      }
    } catch (error) {
      alert('שגיאה בתקשורת עם השרת');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" style={{ color: '#2563eb' }} />
      </Container>
    );
  }

  if (!student) {
    return (
      <Container className="mt-5 text-center">
        <h3>תלמיד לא נמצא 😕</h3>
      </Container>
    );
  }

  const activePayerObj = payers.find(p => p._id === (student.payer?._id || student.payer));
  const activePayerName = activePayerObj ? activePayerObj.name : 'ללא שיוך';

  const payerOptions = payers.map(payer => ({
    value: payer._id,
    label: `${payer.name} (${payer.identifier}) - ${payer.payerType === 'individual' ? 'אדם פרטי' : 'מוסד'}`
  }));

  const safeContacts = student.contacts || [];

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="border shadow-sm text-muted p-2" onClick={() => navigate('/students')} title="חזרה לרשימה">
            <FiArrowRight size={20} />
          </Button>
          <div>
            <h3 style={{ color: '#0f172a', fontWeight: '800' }} className="mb-0">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-muted mb-0">פרופיל תלמיד</p>
          </div>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm fw-bold rounded-pill" onClick={handleOpenEdit}>
          <FiEdit2 /> ערוך פרטים וגביה
        </Button>
      </div>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4 p-md-5">
              <Row className="g-4">
                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiUser /> פרטים אישיים
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="text-muted d-block">תעודת זהות</small>
                      <span className="fw-bold" style={{ color: '#0f172a' }}>{student.idNumber}</span>
                    </div>
                    <div>
                      <small className="text-muted d-block">תאריך לידה (גיל)</small>
                      <span className="fw-bold">
                        {student.birthDate ? new Date(student.birthDate).toLocaleDateString('he-IL') : '-'}
                        {student.birthDate && <span className="ms-1" style={{ color: '#2563eb' }}>({calculateAge(student.birthDate)})</span>}
                      </span>
                      {hebrewBirthDate && <div className="text-muted small">{hebrewBirthDate}</div>}
                    </div>
                    <div>
                      <small className="text-muted d-block">הורים</small>
                      <span className="fw-bold">{student.fatherName || '-'} ו{student.motherName || '-'}</span>
                    </div>
                    <div>
                      <small className="text-muted d-block">מוסד לימודי</small>
                      <span className="fw-bold">{student.institute || 'לא צוין'}</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2">
                    <FiMapPin /> התקשרות וגביה
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <small className="text-muted d-block">טלפונים</small>
                      <span dir="ltr" className="fw-bold text-primary d-block">{student.phone1}</span>
                      {student.phone2 && <span dir="ltr" className="text-muted small d-block">{student.phone2}</span>}
                      {student.phone3 && <span dir="ltr" className="text-muted small d-block">{student.phone3}</span>}
                    </div>
                    <div>
                      <small className="text-muted d-block">כתובת</small>
                      <span className="fw-bold">{student.address || 'לא צוינה'}, מיקוד: {student.zipCode || '-'}</span>
                    </div>

                    <div className="p-3 rounded-4 border mt-2" style={{ backgroundColor: activePayerObj ? '#f0fdf4' : '#fff5f5', borderColor: activePayerObj ? '#bbf7d0' : '#fecaca' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted fw-bold small"><FiCreditCard className="me-1" /> משלם קבוע</small>
                        {!activePayerObj ? (
                          <Button variant="link" className="p-0 text-decoration-none small fw-bold" onClick={handleQuickSetPayer} style={{ fontSize: '0.75rem' }}>
                            הגדר אבא כמשלם
                          </Button>
                        ) : (
                          <div className="d-flex gap-2">
                            <Button variant="link" className="p-0 text-primary text-decoration-none small fw-bold" onClick={handleOpenEdit} style={{ fontSize: '0.75rem' }}>
                              החלף משלם
                            </Button>
                            <Button variant="link" className="p-0 text-muted text-decoration-none small fw-bold" onClick={handleOpenPayerEdit} style={{ fontSize: '0.75rem' }}>
                              ערוך
                            </Button>
                          </div>
                        )}
                      </div>
                      <span className={`fw-bold ${activePayerObj ? 'text-success' : 'text-danger'}`}>
                        {activePayerName}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              {safeContacts.length > 0 && (
                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold text-muted mb-3">אנשי קשר וגורמי רווחה</h6>
                  <Row className="g-3">
                    {safeContacts.map((contact, idx) => (
                      <Col md={4} key={idx}>
                        <div className="p-3 border rounded-4 bg-light h-100 shadow-sm">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <span className="fw-bold" style={{ color: '#0f172a' }}>{contact.name || 'ללא שם'}</span>
                            <Badge bg="secondary" className="rounded-pill px-2">{contact.contactType || 'אחר'}</Badge>
                          </div>
                          {contact.role && <div className="text-muted small mb-1">{contact.role}</div>}
                          <div className="text-primary small fw-bold mt-2" dir="ltr">{contact.phone1}</div>
                          {contact.phone2 && <div className="text-muted small" dir="ltr">{contact.phone2}</div>}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center text-center">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <span className="fw-bold text-muted small">בחר חודש לסיכום:</span>
                <Form.Control
                  type="month"
                  size="sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '140px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>

              <div className="mb-3 mx-auto shadow-sm" style={{ backgroundColor: '#eff6ff', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <FiCreditCard size={28} />
              </div>
              <h6 className="fw-bold text-muted mb-2">עלות חונכויות לחודש זה</h6>
              <h2 className="display-5 fw-bold mb-1" style={{ color: '#0f172a' }}>
                ₪{totalMonthlyCost.toLocaleString()}
              </h2>
              <p className="text-muted small mb-0">מבוסס על {filteredPlacements.length} שיבוצים פעילים</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: '#0f172a' }}>
                <FiFileText className="text-primary" /> חונכים פעילים בחודש זה
              </h5>
              <Button variant="primary" size="sm" className="fw-bold rounded-pill px-3 py-2 d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenPlacement}>
                <FiUserPlus /> שבץ חונך
              </Button>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-muted fw-bold border-0 rounded-start">שם החונך</th>
                      <th className="text-muted fw-bold border-0">סטטוס</th>
                      <th className="text-muted fw-bold border-0">עלות שוטפת</th>
                      <th className="text-muted fw-bold border-0 rounded-end text-end">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlacements.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">אין שיבוצים פעילים לתלמיד זה בחודש הנבחר.</td>
                      </tr>
                    ) : (
                      filteredPlacements.map(placement => (
                        <tr key={placement._id}>
                          <td className="fw-bold" style={{ color: '#0f172a' }}>
                            {placement.tutor ? `${placement.tutor.firstName} ${placement.tutor.lastName}` : 'חונך נמחק'}
                          </td>
                          <td>
                            <Badge bg={placement.status === 'פעיל' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill">
                              {placement.status || 'פעיל'}
                            </Badge>
                          </td>
                          <td className="fw-bold text-success">₪{Number(placement.paymentAmount || 0).toLocaleString()}</td>
                          <td className="text-end">
                            <Button variant="light" size="sm" className="rounded-pill border shadow-sm fw-bold px-3" onClick={() => placement.tutor && navigate(`/tutor/${placement.tutor._id}`)}>
                              לפרופיל החונך
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2 mb-0" style={{ color: '#0f172a' }}>
                <FiCheckSquare className="text-warning" /> משימות ותיעוד
              </h5>
              <Button variant="light" size="sm" className="fw-bold rounded-pill px-3 py-2 border shadow-sm" onClick={handleOpenTask}>
                + משימה/תיעוד
              </Button>
            </Card.Header>
            <Card.Body className="p-4">
              <ListGroup variant="flush">
                {tasks.length === 0 ? (
                  <div className="text-center p-4 text-muted bg-light rounded-4" style={{ border: '1px dashed #cbd5e1' }}>
                    אין משימות או תיעוד לתלמיד זה עדיין.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const title = task.taskType || task.title || 'משימה';
                    const description = task.content || task.description;
                    const badgeText = task.urgency || (task.status === 'draft' ? 'טיוטה' : 'פורסם');
                    const badgeBg = task.urgency === 'דחוף' ? 'danger' : task.urgency === 'השבוע' ? 'warning' : task.status === 'draft' ? 'warning' : 'info';

                    return (
                      <ListGroup.Item key={task._id} className="px-0 py-3 border-bottom d-flex justify-content-between align-items-start">
                        <div className="ms-2 me-auto">
                          <div className="fw-bold" style={{ color: '#0f172a' }}>{title}</div>
                          {description && (
                            <small className="text-muted">
                              {task.isEncrypted ? <span className="text-danger fw-bold"><FiLock className="me-1" /> תוכן מוצפן</span> : description}
                            </small>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <Badge bg={badgeBg} className="rounded-pill">
                            {badgeText}
                          </Badge>
                          <Button variant="light" size="sm" className="border text-danger rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }} onClick={() => handleDeleteTask(task._id)} title="מחק משימה">
                            <FiTrash2 />
                          </Button>
                        </div>
                      </ListGroup.Item>
                    );
                  })
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showEditModal} onHide={handleCloseEdit} size="xl" dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>עריכת פרטי תלמיד מלאים</h4>
          <button type="button" onClick={handleCloseEdit} className="btn-close" aria-label="Close" style={{ margin: 0 }}></button>
        </div>

        <Modal.Body className="p-4" style={{ backgroundColor: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleUpdateStudent}>
            <div className="p-3 mb-4" style={{ backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <Form.Group>
                <Form.Label className="fw-bold small mb-2 d-flex align-items-center gap-2" style={{ color: '#0284c7' }}>
                  <FiUser /> שיוך למשלם קבוע (הורה/ארגון שאחראי על הגבייה)
                </Form.Label>
                <Select
                  options={payerOptions}
                  value={payerOptions.find(opt => opt.value === formData.payer) || null}
                  onChange={(selected) => setFormData({ ...formData, payer: selected ? selected.value : '' })}
                  placeholder="הקלד שם לחיפוש..."
                  isSearchable
                  isClearable
                  isRtl
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({ ...base, borderRadius: '8px', borderColor: '#bae6fd' }) }}
                />
              </Form.Group>
            </div>

            <h6 className="fw-bold pb-2 mb-3 mt-2" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>פרטים אישיים</h6>
            <Row className="align-items-start">
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם פרטי *</Form.Label>
                  <Form.Control type="text" name="firstName" required value={formData.firstName || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם משפחה *</Form.Label>
                  <Form.Control type="text" name="lastName" required value={formData.lastName || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-danger">
                    <FiLock className="me-1" /> תעודת זהות *
                  </Form.Label>
                  <Form.Control type="text" name="idNumber" required value={formData.idNumber || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Label className="fw-bold small text-danger d-block">
                  <FiCalendar className="me-1" /> תאריך לידה *
                </Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="date"
                    name="birthDate"
                    required
                    value={formData.birthDate || ''}
                    onChange={handleChange}
                    style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca', flex: 1 }}
                  />
                  <div
                    className="d-flex align-items-center justify-content-center px-3"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      flex: 1,
                      color: formData.birthDate ? '#0f172a' : '#94a3b8',
                      fontWeight: '600'
                    }}
                  >
                    {getHebrewDate(formData.birthDate) || 'תאריך עברי'}
                  </div>
                </div>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>הורים ומוסד לימודים</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם האב</Form.Label>
                  <Form.Control type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>שם האם</Form.Label>
                  <Form.Control type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small" style={{ color: '#64748b' }}>מוסד לימודי</Form.Label>
                  <Form.Control type="text" name="institute" value={formData.institute || ''} onChange={handleChange} placeholder="לדוגמה: ישיבת חברון..." style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>דרכי התקשרות (מוצפן)</h6>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-danger">
                    <FiLock className="me-1" /> טלפון 1 (ראשי) *
                  </Form.Label>
                  <Form.Control type="text" name="phone1" required value={formData.phone1 || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-danger">
                    <FiLock className="me-1" /> טלפון 2 (אופציונלי)
                  </Form.Label>
                  <Form.Control type="text" name="phone2" value={formData.phone2 || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-danger">
                    <FiLock className="me-1" /> טלפון 3 (אופציונלי)
                  </Form.Label>
                  <Form.Control type="text" name="phone3" value={formData.phone3 || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-danger">
                    <FiLock className="me-1" /> אימייל (אופציונלי)
                  </Form.Label>
                  <Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#fff5f5', border: '1px solid #fecaca' }} />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold pb-2 mb-3 mt-3" style={{ color: '#334155', borderBottom: '2px solid #f1f5f9' }}>כתובת ומיקום (מהמאגר)</h6>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-primary"><FiMapPin className="me-1"/>עיר *</Form.Label>
                  <Select
                    options={cities.map(city => ({ value: city, label: city }))}
                    value={formData.city ? { value: formData.city, label: formData.city } : null}
                    onChange={(selected) => {
                      const cityName = selected ? selected.value : '';
                      let newZip = formData.zipCode;
                      
                      if (cityName === "ירושלים") newZip = "91000";
                      if (cityName === "בני ברק") newZip = "51000";

                      setFormData(prev => ({ ...prev, city: cityName, street: '', zipCode: newZip }));
                      
                      if (cityName) {
                        fetchStreetsFromServer(cityName);
                      } else {
                        setStreets([]);
                      }
                    }}
                    placeholder="חפש עיר..."
                    isSearchable
                    isClearable
                    isRtl
                    noOptionsMessage={() => "לא נמצאה עיר"}
                    menuPortalTarget={document.body}
                    styles={{ 
                      menuPortal: base => ({ ...base, zIndex: 9999 }), 
                      control: base => ({ ...base, borderRadius: '8px', border: '2px solid #2563eb', backgroundColor: '#f8fafc' }) 
                    }}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>
                    רחוב * {isSearchingStreets && <Spinner size="sm" animation="border" className="ms-2" />}
                  </Form.Label>
                  <Select
                    options={streets.map(street => ({ value: street, label: street }))}
                    value={formData.street ? { value: formData.street, label: formData.street } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, street: selected ? selected.value : '' }));
                    }}
                    placeholder="חפש רחוב..."
                    isSearchable
                    isClearable
                    isRtl
                    isDisabled={!formData.city || isSearchingStreets}
                    isLoading={isSearchingStreets}
                    noOptionsMessage={() => "לא נמצאו רחובות"}
                    menuPortalTarget={document.body}
                    styles={{ 
                      menuPortal: base => ({ ...base, zIndex: 9999 }), 
                      control: base => ({ ...base, borderRadius: '8px', backgroundColor: '#f8fafc' }) 
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מס' בניין *</Form.Label>
                  <Form.Control type="text" name="houseNumber" value={formData.houseNumber || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold" style={{ color: '#64748b' }}>מיקוד</Form.Label>
                  <Form.Control type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-4 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0" style={{ color: '#334155' }}>אנשי קשר נוספים</h6>
                <Button variant="outline-primary" size="sm" onClick={handleAddContact} className="rounded-pill d-flex align-items-center gap-1">
                  <FiPlusCircle /> הוסף איש קשר
                </Button>
              </div>

              {(!formData.contacts || formData.contacts.length === 0) ? (
                <div className="text-muted small text-center py-2">לא הוגדרו אנשי קשר נוספים.</div>
              ) : (
                formData.contacts.map((contact, index) => (
                  <Row key={index} className="mb-2 align-items-end">
                    <Col md={2}>
                      <Form.Label className="small mb-1">סוג קשר</Form.Label>
                      <Form.Control size="sm" value={contact.contactType || ''} onChange={(e) => handleContactChange(index, 'contactType', e.target.value)} placeholder="הורה, חירום..." />
                    </Col>
                    <Col md={2}>
                      <Form.Label className="small mb-1">שם</Form.Label>
                      <Form.Control size="sm" value={contact.name || ''} onChange={(e) => handleContactChange(index, 'name', e.target.value)} />
                    </Col>
                    <Col md={2}>
                      <Form.Label className="small mb-1">תפקיד/קרבה</Form.Label>
                      <Form.Control size="sm" value={contact.role || ''} onChange={(e) => handleContactChange(index, 'role', e.target.value)} placeholder="עו''ס / דוד" />
                    </Col>
                    <Col md={2}>
                      <Form.Label className="small mb-1">טלפון 1</Form.Label>
                      <Form.Control size="sm" value={contact.phone1 || ''} onChange={(e) => handleContactChange(index, 'phone1', e.target.value)} />
                    </Col>
                    <Col md={3}>
                      <Form.Label className="small mb-1">טלפון 2</Form.Label>
                      <Form.Control size="sm" value={contact.phone2 || ''} onChange={(e) => handleContactChange(index, 'phone2', e.target.value)} />
                    </Col>
                    <Col md={1} className="text-end">
                      <Button variant="link" className="text-danger p-0 mb-1" onClick={() => handleRemoveContact(index)} title="הסר">
                        <FiMinusCircle size={20} />
                      </Button>
                    </Col>
                  </Row>
                ))
              )}
            </div>

            <div className="d-flex justify-content-end pt-4 mt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button variant="light" onClick={handleCloseEdit} className="me-3 rounded-pill" style={{ fontWeight: '600', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 24px' }}>
                ביטול
              </Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm" style={{ fontWeight: '600', padding: '8px 24px' }}>
                שמור שינויים
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- חלון הוספת משימה חדש --- */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>משימה / תיעוד חדש</h4>
          <button type="button" onClick={() => setShowTaskModal(false)} className="btn-close" style={{ margin: 0 }}></button>
        </div>
        <Modal.Body className="p-4 bg-white">
          <Form onSubmit={handleAddTask}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">סוג</Form.Label>
              <Form.Select name="taskType" value={taskData.taskType} onChange={handleTaskChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                {taskTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">תוכן</Form.Label>
              <Form.Control as="textarea" rows={4} name="content" required value={taskData.content} onChange={handleTaskChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Check type="switch" name="isEncrypted" label={<span className="small text-danger fw-bold"><FiLock className="me-1" />הצפן תוכן זה</span>} checked={taskData.isEncrypted} onChange={handleTaskChange} />
            </Form.Group>
            <div className="d-flex justify-content-end pt-3 border-top">
              <Button variant="light" onClick={() => setShowTaskModal(false)} className="me-2 rounded-pill fw-bold">
                ביטול
              </Button>
              <Button variant="primary" type="submit" disabled={isSavingTask} className="rounded-pill px-4 fw-bold">
                {isSavingTask ? <Spinner size="sm" /> : 'שמור תיעוד'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- חלון שיבוץ חונך --- */}
      <Modal show={showPlacementModal} onHide={() => setShowPlacementModal(false)} dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>שיבוץ חונך חדש</h4>
          <button type="button" onClick={() => setShowPlacementModal(false)} className="btn-close" style={{ margin: 0 }}></button>
        </div>
        <Modal.Body className="p-4 bg-white">
          <Form onSubmit={handleAddPlacement}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">בחר חונך *</Form.Label>
              <Select
                options={tutors.map(t => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))}
                onChange={(s) => setPlacementData({ ...placementData, tutor: s ? s.value : '' })}
                placeholder="חיפוש חונך..."
                isSearchable
                isClearable
                isRtl
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({ ...base, borderRadius: '8px' }) }}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">תאריך התחלה *</Form.Label>
                  <Form.Control type="date" required value={placementData.startDate} onChange={(e) => setPlacementData({ ...placementData, startDate: e.target.value })} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">עלות משוערת</Form.Label>
                  <Form.Control type="number" value={placementData.paymentAmount} onChange={(e) => setPlacementData({ ...placementData, paymentAmount: e.target.value })} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end pt-3 border-top mt-2">
              <Button variant="light" onClick={() => setShowPlacementModal(false)} className="me-2 rounded-pill fw-bold">
                ביטול
              </Button>
              <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm">
                צור שיבוץ 🔗
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- חלון עריכת משלם קבוע --- */}
      <Modal show={showPayerEditModal} onHide={() => setShowPayerEditModal(false)} size="lg" dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>עריכת פרטי משלם קיים</h4>
          <button type="button" onClick={() => setShowPayerEditModal(false)} className="btn-close" style={{ margin: 0 }}></button>
        </div>
        <Modal.Body className="p-4 bg-white">
          <Form onSubmit={handleUpdatePayer}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">שם מלא / מוסד</Form.Label>
                  <Form.Control type="text" name="name" required value={payerFormData.name || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">ת.ז / ח.פ</Form.Label>
                  <Form.Control type="text" name="identifier" required value={payerFormData.identifier || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">אמצעי תשלום מועדף</Form.Label>
                  <Form.Select name="paymentMethod" value={payerFormData.paymentMethod || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <option value="credit_card">אשראי (נדרים פלוס)</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="cash">מזומן</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">טלפון נייד</Form.Label>
                  <Form.Control type="text" name="phone" value={payerFormData.phone || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end pt-3 border-top mt-4">
              <Button variant="light" onClick={() => setShowPayerEditModal(false)} className="me-2 rounded-pill fw-bold">
                ביטול
              </Button>
              <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm">
                שמור פרטי משלם
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default StudentProfile;