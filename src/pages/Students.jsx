import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import {
  FiSearch,
  FiPlus,
  FiUser,
  FiFileText,
  FiTrash2,
  FiLock,
  FiPlusCircle,
  FiMinusCircle,
  FiCalendar,
  FiMapPin
} from 'react-icons/fi';
import Select from 'react-select';

function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [payers, setPayers] = useState([]);
  const [placements, setPlacements] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('');
  const [filterPlacementStatus, setFilterPlacementStatus] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  // מאגר ערים ורחובות
  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);
  const [isSearchingStreets, setIsSearchingStreets] = useState(false);

  useEffect(() => {
    fetchStudentsAndData();

    // שליפת רשימת הערים מהשרת שלך
    fetch(import.meta.env.VITE_API_URL + '/api/geo/cities')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCities(data);
        }
      })
      .catch(err => console.error("שגיאה בטעינת ערים מהשרת:", err));

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
    };
  }, []);

  const fetchStudentsAndData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, payersRes, placementsRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + '/api/students'),
        fetch(import.meta.env.VITE_API_URL + '/api/payers'),
        fetch(import.meta.env.VITE_API_URL + '/api/placements')
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (payersRes.ok) setPayers(await payersRes.json());
      if (placementsRes.ok) setPlacements(await placementsRes.json());

    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציה לשליפת רחובות מהשרת לפי עיר נבחרת
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

  const getPlacementStatus = (hasActivePlacement) => {
    if (hasActivePlacement) {
      return { text: 'משובץ', style: { backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0' } };
    } else {
      return { text: 'ממתין לשיבוץ', style: { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } };
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${name}?`)) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setStudents(students.filter(student => student._id !== id));
      } else {
        alert('🔴 שגיאה במחיקה');
      }
    } catch (error) {
      alert('🔴 שגיאת תקשורת');
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`;
    const matchText = fullName.includes(searchTerm) || (student.idNumber && student.idNumber.includes(searchTerm));
    const matchInstitute = filterInstitute === '' || student.institute === filterInstitute;
    let matchPlacement = true;
    if (filterPlacementStatus === 'פעיל') matchPlacement = student.hasActivePlacement === true;
    if (filterPlacementStatus === 'ללא') matchPlacement = student.hasActivePlacement === false;
    return matchText && matchInstitute && matchPlacement;
  });

  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', idNumber: '', birthDate: '',
    fatherName: '', motherName: '', phone1: '', phone2: '', phone3: '', email: '',
    street: '', houseNumber: '', address: '', city: '', zipCode: '',
    institute: '', contacts: [], payer: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(date);
      const dayMatch = formatted.match(/^\d+/);
      if (dayMatch) formatted = formatted.replace(dayMatch[0], numberToGematria(parseInt(dayMatch[0], 10)));
      const yearMatch = formatted.match(/\d{4}/);
      if (yearMatch) formatted = formatted.replace(yearMatch[0], numberToGematria(parseInt(yearMatch[0], 10)));
      return formatted;
    } catch (error) { return ''; }
  };

  const handleAddContact = () => {
    setFormData({ ...formData, contacts: [...formData.contacts, { name: '', phone: '', relation: '' }] });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullAddress = `${formData.street || ''} ${formData.houseNumber || ''}`.trim();
    const dataToSend = { ...formData, address: fullAddress };
    if (!dataToSend.payer || dataToSend.payer === "") delete dataToSend.payer;

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        handleClose();
        setFormData({
          firstName: '', lastName: '', idNumber: '', birthDate: '', phone1: '', phone2: '', phone3: '', email: '',
          street: '', houseNumber: '', address: '', city: '', zipCode: '', institute: '', contacts: [], payer: ''
        });
        fetchStudentsAndData();
      } else {
        const data = await response.json();
        alert('🔴 שגיאה: ' + (data.message || 'שגיאה בשמירה'));
      }
    } catch (error) {
      alert('🔴 שגיאת תקשורת');
    }
  };

  const uniqueInstitutesList = [...new Set(students.map(s => s.institute).filter(Boolean))];

  // אפשרויות ל-Select של המשלמים
  const payerOptions = payers.map(payer => ({
    value: payer._id,
    label: `${payer.name} (${payer.identifier})`
  }));

  return (
    <Container className="pt-3 mb-5" dir="rtl">
      <div className="pb-4 pt-3 mb-4" style={{ position: 'sticky', top: '68px', backgroundColor: '#f8fafc', zIndex: 100, borderBottom: '1px solid #e2e8f0' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 style={{ color: '#0f172a', fontWeight: '800' }} className="mb-1">ניהול תלמידים</h2>
            <p style={{ color: '#64748b' }} className="mb-0">צפייה והוספת תלמידים</p>
          </div>
          <Button variant="primary" className="rounded-pill px-4 py-2 shadow-sm fw-bold" onClick={handleShow}>
            <FiPlus size={18} /> הוסף תלמיד
          </Button>
        </div>

        <Row className="g-3">
          <Col md={5} lg={4}>
            <InputGroup className="shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <InputGroup.Text className="bg-white border-end-0">
                <FiSearch color="#94a3b8" />
              </InputGroup.Text>
              <Form.Control placeholder="חיפוש..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
            </InputGroup>
          </Col>
          <Col md={3} lg={3}>
            <Form.Select className="shadow-sm h-100" style={{ borderRadius: '12px' }} value={filterInstitute} onChange={(e) => setFilterInstitute(e.target.value)}>
              <option value="">כל המוסדות</option>
              {uniqueInstitutesList.map((inst, idx) => (<option key={idx} value={inst}>{inst}</option>))}
            </Form.Select>
          </Col>
          <Col md={4} lg={3}>
            <Form.Select className="shadow-sm h-100" style={{ borderRadius: '12px' }} value={filterPlacementStatus} onChange={(e) => setFilterPlacementStatus(e.target.value)}>
              <option value="">סטטוס שיבוץ (הכל)</option>
              <option value="פעיל">שיבוץ פעיל</option>
              <option value="ללא">ממתינים</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <div className="table-responsive">
            <Table hover className="align-middle border-light mb-0">
              <thead>
                <tr>
                  <th className="bg-light text-muted fw-bold p-3">שם התלמיד</th>
                  <th className="bg-light text-muted fw-bold p-3">ת.ז.</th>
                  <th className="bg-light text-muted fw-bold p-3">מוסד</th>
                  <th className="bg-light text-muted fw-bold p-3">סטטוס</th>
                  <th className="bg-light text-muted fw-bold p-3 text-end">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" style={{color: '#2563eb'}} /></td></tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const status = getPlacementStatus(student.hasActivePlacement);
                    return (
                      <tr key={student._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/${student._id}`)}>
                        <td className="fw-bold text-primary p-3">{student.firstName} {student.lastName}</td>
                        <td className="p-3">{student.idNumber}</td>
                        <td className="p-3">{student.institute || 'לא הוגדר'}</td>
                        <td className="p-3"><span className="rounded-pill d-inline-block text-center px-3 py-1 fw-bold" style={{ fontSize: '0.85rem', ...status.style }}>{status.text}</span></td>
                        <td className="text-end p-3" onClick={(e) => e.stopPropagation()}>
                           <Button variant="light" size="sm" className="me-2 rounded-pill shadow-sm" onClick={() => navigate(`/student/${student._id}`)}><FiFileText /></Button>
                           <Button variant="light" size="sm" className="rounded-pill shadow-sm text-danger" onClick={(e) => handleDelete(e, student._id, student.firstName)}><FiTrash2 /></Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="text-center py-5 text-muted">לא נמצאו תלמידים.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} size="xl" dir="rtl" backdrop="static">
        <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderTopRightRadius: '8px', borderTopLeftRadius: '8px' }}>
          <h4 style={{ fontWeight: '800', color: '#0f172a', margin: 0 }}>הוספת תלמיד חדש</h4>
          <button type="button" onClick={handleClose} className="btn-close" style={{ margin: 0 }}></button>
        </div>

        <Modal.Body className="p-4 bg-white" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleSubmit}>
            <div className="p-3 mb-4 rounded-3 border" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
              <Form.Group>
                <Form.Label className="fw-bold small mb-2 d-flex align-items-center gap-2" style={{ color: '#0284c7' }}>
                  <FiUser /> שיוך למשלם קבוע
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

            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">פרטים אישיים</h6>
            <Row className="align-items-start mb-3">
              <Col md={3}><Form.Group><Form.Label className="small fw-bold">שם פרטי *</Form.Label><Form.Control type="text" name="firstName" required value={formData.firstName} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label className="small fw-bold">שם משפחה *</Form.Label><Form.Control type="text" name="lastName" required value={formData.lastName} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={2}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock /> תעודת זהות *</Form.Label><Form.Control type="text" name="idNumber" required value={formData.idNumber} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={4}>
                <Form.Label className="small fw-bold text-danger"><FiCalendar /> תאריך לידה *</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} style={{ borderRadius: '8px', flex: 1 }} />
                  <div className="d-flex align-items-center justify-content-center px-2 bg-light border rounded" style={{ flex: 1, fontSize: '0.85rem' }}>{getHebrewDate(formData.birthDate) || 'תאריך עברי'}</div>
                </div>
              </Col>
            </Row>

            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">הורים ומוסד</h6>
            <Row className="mb-4">
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">שם האב</Form.Label><Form.Control type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="small fw-bold">שם האם</Form.Label><Form.Control type="text" name="motherName" value={formData.motherName} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">מוסד לימודי</Form.Label>
                  <Form.Select name="institute" value={formData.institute} onChange={handleChange} style={{ borderRadius: '8px' }}>
                    <option value="">-- בחר מוסד --</option>
                    <option value="ישיבת חברון">ישיבת חברון</option>
                    <option value="ישיבת מיר">ישיבת מיר</option>
                    <option value="אחר">אחר</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">כתובת ומיקום (מהמאגר שלך)</h6>
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
                      
                      // השלמת מיקוד לערי מפתח
                      if (cityName === "ירושלים") newZip = "91000";
                      if (cityName === "בני ברק") newZip = "51000";

                      // עדכון סטייט
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
                      control: base => ({ ...base, borderRadius: '8px', border: '2px solid #2563eb' }) 
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
                      control: base => ({ ...base, borderRadius: '8px' }) 
                    }}
                  />
                </Form.Group>
              </Col>
              
              <Col md={2}><Form.Group><Form.Label className="small fw-bold">מס' בניין *</Form.Label><Form.Control type="text" name="houseNumber" value={formData.houseNumber} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label className="small fw-bold">מיקוד</Form.Label><Form.Control type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
            </Row>

            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3 mt-4">פרטי התקשרות</h6>
            <Row className="mb-4">
              <Col md={4}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/> טלפון 1 *</Form.Label><Form.Control type="text" name="phone1" required value={formData.phone1} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/> טלפון 2</Form.Label><Form.Control type="text" name="phone2" value={formData.phone2} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label className="small fw-bold text-danger"><FiLock className="me-1"/> אימייל</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} style={{ borderRadius: '8px' }} /></Form.Group></Col>
            </Row>

            <div className="mt-4 p-3 bg-light rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">אנשי קשר נוספים</h6>
                <Button variant="outline-primary" size="sm" onClick={handleAddContact} className="rounded-pill fw-bold"><FiPlusCircle className="me-1"/> הוסף איש קשר</Button>
              </div>
              {formData.contacts.length === 0 ? (<div className="text-muted small text-center py-2">לא הוגדרו אנשי קשר נוספים.</div>) : (
                formData.contacts.map((contact, index) => (
                  <Row key={index} className="mb-2 align-items-end">
                    <Col md={4}><Form.Label className="small mb-1">שם</Form.Label><Form.Control size="sm" value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} /></Col>
                    <Col md={3}><Form.Label className="small mb-1">טלפון</Form.Label><Form.Control size="sm" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} /></Col>
                    <Col md={4}><Form.Label className="small mb-1">קרבה</Form.Label><Form.Control size="sm" value={contact.relation} onChange={(e) => handleContactChange(index, 'relation', e.target.value)} /></Col>
                    <Col md={1} className="text-end"><Button variant="link" className="text-danger p-0" onClick={() => handleRemoveContact(index)}><FiMinusCircle size={20} /></Button></Col>
                  </Row>
                ))
              )}
            </div>

            <div className="d-flex justify-content-end pt-4 mt-3 border-top">
              <Button variant="light" onClick={handleClose} className="me-3 rounded-pill fw-bold px-4">ביטול</Button>
              <Button variant="primary" type="submit" className="rounded-pill shadow-sm fw-bold px-4">שמור תלמיד</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}

export default Students;