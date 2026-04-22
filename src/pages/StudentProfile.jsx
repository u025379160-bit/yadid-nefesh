import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, ListGroup, Spinner, Modal, Form } from 'react-bootstrap';
import { FiArrowRight, FiEdit2, FiUser, FiMapPin, FiFileText, FiCheckSquare, FiTrash2, FiCreditCard, FiUserPlus, FiUserCheck, FiSettings, FiLock, FiPlusCircle, FiMinusCircle, FiCalendar } from 'react-icons/fi';
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
    associatedToType: 'student', associatedToId: id, taskType: 'תיעוד פעילות', content: '', status: 'published', isEncrypted: false
  });

  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementData, setPlacementData] = useState({
    tutor: '', startDate: new Date().toISOString().split('T')[0], paymentAmount: '', paymentMethod: 'credit_card', status: 'פעיל'
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
            .then(res => res.json()).then(data => setHebrewBirthDate(data.hebrew)).catch(err => console.log(err));
        }
      }
      
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (payersRes.ok) setPayers(await payersRes.json());
      if (tutorsRes.ok) setTutors(await tutorsRes.json());
      
      if (placementsRes.ok) {
        const allPlacements = await placementsRes.json();
        setPlacements(allPlacements.filter(p => p.student && p.student._id === id));
      }
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const calculateAge = (dob) => {
    if (!dob) return '';
    const ageDt = new Date(Date.now() - new Date(dob).getTime()); 
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
      let formatted = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
      const dayMatch = formatted.match(/^\d+/);
      if (dayMatch) formatted = formatted.replace(dayMatch[0], numberToGematria(parseInt(dayMatch[0], 10)));
      const yearMatch = formatted.match(/\d{4}/);
      if (yearMatch) formatted = formatted.replace(yearMatch[0], numberToGematria(parseInt(yearMatch[0], 10)));
      return formatted;
    } catch (error) { return ''; }
  };

  const handleOpenPayerEdit = () => {
    const activePayer = payers.find(p => p._id === (student.payer?._id || student.payer));
    if (activePayer) {
      setPayerFormData(activePayer);
      setShowPayerEditModal(true);
    }
  };

  const handlePayerChange = (e) => setPayerFormData({ ...payerFormData, [e.target.name]: e.target.value });

  const handleUpdatePayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payers/${payerFormData._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payerFormData),
      });
      if (response.ok) { setShowPayerEditModal(false); fetchData(); } 
      else alert('שגיאה בעדכון המשלם');
    } catch (error) { alert('שגיאת תקשורת בעדכון המשלם'); }
  };

  const handleQuickSetPayer = async () => {
    if (!student.fatherName) { alert("יש להזין שם אב בפרטי התלמיד."); return; }
    const existingPayer = payers.find(p => p.name.trim() === student.fatherName.trim());
    if (existingPayer) {
      if (window.confirm(`💡 מצאנו משלם קיים בשם "${existingPayer.name}". לשייך אליו?`)) {
        try {
          setLoading(true);
          await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payer: existingPayer._id }) });
          fetchData(); 
        } catch (error) { alert("שגיאה: " + error.message); } finally { setLoading(false); }
        return; 
      }
    }
    if (!window.confirm(`להקים משלם חדש בשם "${student.fatherName}" ולשייך?`)) return;
    try {
      setLoading(true);
      const payerRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: student.fatherName, identifier: student.idNumber + "-P", phone: student.phone1, payerType: 'individual', notes: `נוצר אוטומטית` }),
      });
      if (!payerRes.ok) throw new Error("שגיאה ביצירה");
      const newPayer = await payerRes.json();
      await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payer: newPayer._id }) });
      fetchData(); 
    } catch (error) { alert("שגיאה: " + error.message); } finally { setLoading(false); }
  };

  const filteredPlacements = placements.filter(p => {
    if (!p.startDate) return false;
    const pDate = new Date(p.startDate);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);
    return (pDate.getFullYear() < sYear || (pDate.getFullYear() === sYear && pDate.getMonth() + 1 <= sMonth)) && p.status !== 'לא פעיל';
  });

  const totalMonthlyCost = filteredPlacements.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

  const handleOpenEdit = () => {
    setFormData({ ...student, birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '', payer: student.payer?._id || student.payer || '', contacts: student.contacts || [] });
    setShowEditModal(true);
  };
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleContactChange = (index, field, value) => { const newC = [...formData.contacts]; newC[index][field] = value; setFormData({ ...formData, contacts: newC }); };
  const handleAddContact = () => setFormData({ ...formData, contacts: [...(formData.contacts || []), { contactType: '', role: '', name: '', phone1: '', phone2: '' }] });
  const handleRemoveContact = (index) => setFormData({ ...formData, contacts: formData.contacts.filter((_, i) => i !== index) });

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) { setShowEditModal(false); fetchData(); } else alert('שגיאה בעדכון התלמיד');
    } catch (error) { alert('שגיאת תקשורת'); }
  };

  const handleTaskChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const handleAddTask = async (e) => {
    e.preventDefault();
    setIsSavingTask(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...taskData, createdBy: 'מערכת' }) });
      if (response.ok) {
        const tasksRes = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}/tasks`);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        setShowTaskModal(false);
      }
    } catch (error) { alert('שגיאה בשמירה'); } finally { setIsSavingTask(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('האם למחוק משימה זו?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) setTasks(tasks.filter(t => t._id !== taskId));
    } catch (error) { alert('שגיאה במחיקה'); }
  };

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    if (!placementData.tutor) return alert("חובה לבחור חונך");
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/placements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...placementData, student: id }) });
      if (response.ok) { setShowPlacementModal(false); setPlacementData({ tutor: '', startDate: new Date().toISOString().split('T')[0], paymentAmount: '', paymentMethod: 'credit_card', status: 'פעיל' }); fetchData(); }
    } catch (error) { alert('שגיאה ביצירת שיבוץ'); }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" style={{color: '#2563eb'}} /></Container>;
  if (!student) return <Container className="mt-5 text-center"><h3>תלמיד לא נמצא 😕</h3></Container>;

  const activePayerObj = payers.find(p => p._id === (student.payer?._id || student.payer));
  const payerOptions = payers.map(p => ({ value: p._id, label: `${p.name} (${p.identifier}) - ${p.payerType === 'individual' ? 'פרטי' : 'מוסד'}` }));

  return (
    <Container className="mt-4 mb-5" dir="rtl">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" className="border shadow-sm text-muted p-2" onClick={() => navigate('/students')} title="חזרה">
            <FiArrowRight size={20} />
          </Button>
          <div>
            <h3 style={{ color: '#0f172a', fontWeight: '800' }} className="mb-0">{student.firstName} {student.lastName}</h3>
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
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2"><FiUser /> פרטים אישיים</h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="text-muted d-block">ת.ז</small><span className="fw-bold" style={{ color: '#0f172a' }}>{student.idNumber}</span></div>
                    <div><small className="text-muted d-block">תאריך לידה (גיל)</small><span className="fw-bold">{student.birthDate ? new Date(student.birthDate).toLocaleDateString('he-IL') : '-'} {student.birthDate && <span className="ms-1" style={{color: '#2563eb'}}>({calculateAge(student.birthDate)})</span>}</span>{hebrewBirthDate && <div className="text-muted small">{hebrewBirthDate}</div>}</div>
                    <div><small className="text-muted d-block">הורים</small><span className="fw-bold">{student.fatherName || '-'} ו{student.motherName || '-'}</span></div>
                    <div><small className="text-muted d-block">מוסד לימודי</small><span className="fw-bold">{student.institute || 'לא צוין'}</span></div>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-muted mb-4 d-flex align-items-center gap-2 border-bottom pb-2"><FiMapPin /> התקשרות וגביה</h6>
                  <div className="d-flex flex-column gap-3">
                    <div><small className="text-muted d-block">טלפונים</small><span dir="ltr" className="fw-bold text-primary d-block">{student.phone1}</span>{student.phone2 && <span dir="ltr" className="text-muted small d-block">{student.phone2}</span>}</div>
                    <div><small className="text-muted d-block">כתובת</small><span className="fw-bold">{student.address || 'לא צוינה'}, מיקוד: {student.zipCode || '-'}</span></div>
                    <div className="p-3 rounded-4 border mt-2" style={{ backgroundColor: activePayerObj ? '#f0fdf4' : '#fff5f5', borderColor: activePayerObj ? '#bbf7d0' : '#fecaca' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted fw-bold small"><FiCreditCard className="me-1"/> משלם קבוע</small>
                        {!activePayerObj ? (
                          <Button variant="link" className="p-0 text-decoration-none small fw-bold" onClick={handleQuickSetPayer} style={{fontSize: '0.75rem'}}>הגדר אבא כמשלם</Button>
                        ) : (
                          <div className="d-flex gap-2">
                            <Button variant="link" className="p-0 text-primary text-decoration-none small fw-bold" onClick={handleOpenEdit} style={{fontSize: '0.75rem'}}>החלף משלם</Button>
                            <Button variant="link" className="p-0 text-muted text-decoration-none small fw-bold" onClick={handleOpenPayerEdit} style={{fontSize: '0.75rem'}}>ערוך פרטי משלם</Button>
                          </div>
                        )}
                      </div>
                      <span className={`fw-bold ${activePayerObj ? 'text-success' : 'text-danger'}`}>{activePayerObj ? activePayerObj.name : 'ללא שיוך'}</span>
                    </div>
                  </div>
                </Col>
              </Row>
              {student.contacts && student.contacts.length > 0 && (
                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold text-muted mb-3">אנשי קשר נוספים</h6>
                  <Row className="g-3">
                    {student.contacts.map((contact, idx) => (
                      <Col md={4} key={idx}>
                        <div className="p-3 border rounded-4 bg-light h-100 shadow-sm">
                          <div className="d-flex justify-content-between align-items-start mb-1"><span className="fw-bold">{contact.name}</span><Badge bg="secondary">{contact.contactType || 'אחר'}</Badge></div>
                          <div className="text-muted small mb-1">{contact.role}</div><div className="text-primary small fw-bold" dir="ltr">{contact.phone1}</div>
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
                <Form.Control type="month" size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '140px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}/>
              </div>
              <div className="mb-3 mx-auto shadow-sm" style={{ backgroundColor: '#eff6ff', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><FiCreditCard size={28} /></div>
              <h6 className="fw-bold text-muted mb-2">עלות חונכויות לחודש זה</h6>
              <h2 className="display-5 fw-bold mb-1" style={{ color: '#0f172a' }}>₪{totalMonthlyCost.toLocaleString()}</h2>
              <p className="text-muted small mb-0">מבוסס על {filteredPlacements.length} שיבוצים פעילים</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0" style={{ color: '#0f172a' }}><FiFileText className="text-primary me-2" />שיבוצים פעילים</h5>
              <Button variant="primary" size="sm" className="fw-bold rounded-pill px-3 py-2 shadow-sm" onClick={() => setShowPlacementModal(true)}><FiUserPlus className="me-1" />שבץ חונך</Button>
            </Card.Header>
            <Card.Body className="p-4">
              <Table hover className="align-middle mb-0"><thead className="bg-light"><tr><th className="border-0 rounded-start">חונך</th><th className="border-0">סטטוס</th><th className="border-0">עלות</th><th className="border-0 rounded-end text-end">פעולות</th></tr></thead>
                <tbody>
                  {filteredPlacements.length === 0 ? (<tr><td colSpan="4" className="text-center py-4 text-muted">אין שיבוצים.</td></tr>) : (
                    filteredPlacements.map(p => (
                      <tr key={p._id}>
                        <td className="fw-bold" style={{ color: '#0f172a' }}>{p.tutor ? `${p.tutor.firstName} ${p.tutor.lastName}` : 'נמחק'}</td>
                        <td><Badge bg={p.status === 'פעיל' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill">{p.status}</Badge></td>
                        <td className="fw-bold text-success">₪{Number(p.paymentAmount || 0).toLocaleString()}</td>
                        <td className="text-end"><Button variant="light" size="sm" className="rounded-pill border shadow-sm fw-bold px-3" onClick={() => p.tutor && navigate(`/tutor/${p.tutor._id}`)}>מעבר</Button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0" style={{ color: '#0f172a' }}><FiCheckSquare className="text-warning me-2" />משימות ותיעוד</h5>
              <Button variant="light" size="sm" className="fw-bold rounded-pill px-3 py-2 border shadow-sm" onClick={() => setShowTaskModal(true)}>+ הוסף</Button>
            </Card.Header>
            <Card.Body className="p-4">
              <ListGroup variant="flush">
                {tasks.length === 0 ? (<div className="text-center p-4 text-muted bg-light rounded-4 border-dashed">אין משימות.</div>) : (
                  tasks.map((t) => (
                    <ListGroup.Item key={t._id} className="px-0 py-3 border-bottom d-flex justify-content-between align-items-start">
                      <div className="ms-2 me-auto"><div className="fw-bold">{t.taskType || t.title}</div><small className="text-muted">{t.isEncrypted ? <span className="text-danger"><FiLock/> מוצפן</span> : t.content}</small></div>
                      <div className="d-flex align-items-center gap-2"><Badge bg="info" className="rounded-pill">{t.status}</Badge><Button variant="light" size="sm" className="border text-danger rounded-circle p-1" onClick={() => handleDeleteTask(t._id)}><FiTrash2 /></Button></div>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* -- חלון עריכת תלמיד (כולל התאריך העברי) -- */}
      <Modal show={showEditModal} onHide={handleCloseEdit} size="xl" dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>עריכת פרטי תלמיד</h4>
          <button type="button" onClick={handleCloseEdit} className="btn-close" style={{ margin: 0 }}></button>
        </div>
        <Modal.Body className="p-4 bg-white" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleUpdateStudent}>
            <Form.Group className="mb-4 p-3 bg-light rounded border"><Form.Label className="fw-bold small text-primary"><FiUser className="me-1"/>שיוך למשלם קבוע (החלף משלם)</Form.Label><Select options={payerOptions} value={payerOptions.find(o => o.value === formData.payer) || null} onChange={s => setFormData({ ...formData, payer: s ? s.value : '' })} isSearchable isClearable isRtl menuPortalTarget={document.body} styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px'}) }}/></Form.Group>
            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">פרטים אישיים</h6>
            <Row className="mb-3">
              <Col md={3}><Form.Group><Form.Label className="small fw-bold">שם פרטי</Form.Label><Form.Control type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} style={{borderRadius:'8px'}}/></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label className="small fw-bold">שם משפחה</Form.Label><Form.Control type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} style={{borderRadius:'8px'}}/></Form.Group></Col>
              <Col md={2}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock/> ת.ז</Form.Label><Form.Control type="text" name="idNumber" value={formData.idNumber || ''} onChange={handleChange} style={{borderRadius:'8px', backgroundColor:'#fff5f5'}}/></Form.Group></Col>
              <Col md={4}>
                <Form.Label className="small fw-bold text-danger"><FiCalendar/> תאריך לידה</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} style={{borderRadius:'8px', backgroundColor:'#fff5f5', flex:1}}/>
                  <div className="d-flex align-items-center justify-content-center px-3" style={{borderRadius:'8px', backgroundColor:'#f8fafc', border:'1px solid #e2e8f0', flex:1, fontWeight:'600'}}>{getHebrewDate(formData.birthDate) || 'עברי'}</div>
                </div>
              </Col>
            </Row>
            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">הורים ומוסד</h6>
            <Row className="mb-3">
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">שם האב</Form.Label><Form.Control type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} style={{borderRadius:'8px'}}/></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">שם האם</Form.Label><Form.Control type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} style={{borderRadius:'8px'}}/></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">מוסד לימודי</Form.Label><Form.Control type="text" name="institute" value={formData.institute || ''} onChange={handleChange} style={{borderRadius:'8px'}}/></Form.Group></Col>
            </Row>
            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">התקשרות (מוצפן)</h6>
            <Row className="mb-3">
              <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock/> טלפון 1</Form.Label><Form.Control type="text" name="phone1" value={formData.phone1 || ''} onChange={handleChange} style={{borderRadius:'8px', backgroundColor:'#fff5f5'}}/></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock/> טלפון 2</Form.Label><Form.Control type="text" name="phone2" value={formData.phone2 || ''} onChange={handleChange} style={{borderRadius:'8px', backgroundColor:'#fff5f5'}}/></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label className="small fw-bold">כתובת</Form.Label><Form.Control type="text" name="address" value={formData.address || ''} onChange={handleChange} style={{borderRadius:'8px'}}/></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end pt-3 border-top mt-4">
              <Button variant="light" onClick={handleCloseEdit} className="me-2 rounded-pill fw-bold">ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill fw-bold shadow-sm px-4">שמור שינויים</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* -- חלון הוספת משימה -- */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>משימה / תיעוד חדש</h4>
          <button type="button" onClick={() => setShowTaskModal(false)} className="btn-close" style={{ margin: 0 }}></button>
        </div>
        <Modal.Body className="p-4 bg-white">
          <Form onSubmit={handleAddTask}>
            <Form.Group className="mb-3"><Form.Label className="fw-bold small">סוג</Form.Label><Form.Select name="taskType" value={taskData.taskType} onChange={handleTaskChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}>{taskTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}</Form.Select></Form.Group>
            <Form.Group className="mb-3"><Form.Label className="fw-bold small">תוכן</Form.Label><Form.Control as="textarea" rows={4} name="content" required value={taskData.content} onChange={handleTaskChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group>
            <Form.Group className="mb-4"><Form.Check type="switch" name="isEncrypted" label={<span className="small text-danger fw-bold"><FiLock className="me-1"/>הצפן תוכן זה</span>} checked={taskData.isEncrypted} onChange={handleTaskChange} /></Form.Group>
            <div className="d-flex justify-content-end pt-3 border-top"><Button variant="light" onClick={() => setShowTaskModal(false)} className="me-2 rounded-pill fw-bold">ביטול</Button><Button variant="primary" type="submit" disabled={isSavingTask} className="rounded-pill px-4 fw-bold">{isSavingTask ? <Spinner size="sm"/> : 'שמור תיעוד'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* -- חלון שיבוץ חונך -- */}
      <Modal show={showPlacementModal} onHide={() => setShowPlacementModal(false)} dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>שיבוץ חונך חדש</h4>
          <button type="button" onClick={() => setShowPlacementModal(false)} className="btn-close" style={{ margin: 0 }}></button>
        </div>
        <Modal.Body className="p-4 bg-white">
          <Form onSubmit={handleAddPlacement}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">בחר חונך *</Form.Label>
              <Select options={tutors.map(t => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))} onChange={(s) => setPlacementData({ ...placementData, tutor: s ? s.value : '' })} placeholder="חיפוש חונך..." isSearchable isClearable isRtl menuPortalTarget={document.body} styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }), control: base => ({...base, borderRadius: '8px'}) }}/>
            </Form.Group>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small">תאריך התחלה *</Form.Label><Form.Control type="date" required value={placementData.startDate} onChange={(e) => setPlacementData({...placementData, startDate: e.target.value})} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-bold small">עלות משוערת</Form.Label><Form.Control type="number" value={placementData.paymentAmount} onChange={(e) => setPlacementData({...placementData, paymentAmount: e.target.value})} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end pt-3 border-top mt-2"><Button variant="light" onClick={() => setShowPlacementModal(false)} className="me-2 rounded-pill fw-bold">ביטול</Button><Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm">צור שיבוץ 🔗</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* -- חלון עריכת פרטי משלם נפרד ! -- */}
      <Modal show={showPayerEditModal} onHide={() => setShowPayerEditModal(false)} size="lg" dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>עריכת פרטי משלם קיים</h4>
          <button type="button" onClick={() => setShowPayerEditModal(false)} className="btn-close" style={{ margin: 0 }}></button>
        </div>
        <Modal.Body className="p-4 bg-white">
          <Form onSubmit={handleUpdatePayer}>
            <Row className="mb-3">
              <Col md={6}><Form.Group><Form.Label className="fw-bold small">שם מלא / מוסד</Form.Label><Form.Control type="text" name="name" required value={payerFormData.name || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label className="fw-bold small">ת.ז / ח.פ</Form.Label><Form.Control type="text" name="identifier" required value={payerFormData.identifier || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}><Form.Group><Form.Label className="fw-bold small">אמצעי תשלום מועדף</Form.Label><Form.Select name="paymentMethod" value={payerFormData.paymentMethod || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }}><option value="credit_card">אשראי (נדרים פלוס)</option><option value="bank_transfer">העברה בנקאית</option><option value="cash">מזומן</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label className="fw-bold small">טלפון נייד</Form.Label><Form.Control type="text" name="phone" value={payerFormData.phone || ''} onChange={handlePayerChange} style={{ borderRadius: '8px', backgroundColor: '#f8fafc' }} /></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end pt-3 border-top mt-4"><Button variant="light" onClick={() => setShowPayerEditModal(false)} className="me-2 rounded-pill fw-bold">ביטול</Button><Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm">שמור פרטי משלם</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default StudentProfile;