"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

// Type definitions matching the data structure
type Student = {
  _i?: number;
  gr: string;
  name: string;
  father: string;
  class: string;
  bform: string;
  cnic: string;
  admission: string;
  dob: string;
  cast: string;
  mobile: string;
  gender: string;
  religion: string;
  idmark: string;
  address: string;
};

const DEFAULT_CLASSES = [
  '6A','6B','6C',
  '7A','7B','7C',
  '8A','8B','8C',
  '9A','9B','9C',
  '10A','10B','10C'
];

export default function DashboardApp() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'dashboard' | 'students'>('dashboard');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [customClasses, setCustomClasses] = useState<string[]>([]);
  const [printCount, setPrintCount] = useState<number>(0);
  
  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClass, setImportClass] = useState('');
  
  // Form State
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Student>({
    gr: '', name: '', father: '', class: '', bform: '', cnic: '',
    admission: '', dob: '2008-06-01', cast: '', mobile: '', gender: '',
    religion: '', idmark: '', address: ''
  });
  
  // UI State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | ''>('');
  const [toastShow, setToastShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [newClassInput, setNewClassInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Print State
  const [printData, setPrintData] = useState<Student[]>([]);

  // Load data on mount
  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('bise_students') || '[]');
    const c = JSON.parse(localStorage.getItem('bise_classes') || '[]');
    const p = parseInt(localStorage.getItem('bise_prints') || '0');
    setStudents(s);
    setCustomClasses(c);
    setPrintCount(p);
    setMounted(true);
  }, []);

  // Save data effects
  useEffect(() => {
    if (mounted) localStorage.setItem('bise_students', JSON.stringify(students));
  }, [students, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem('bise_classes', JSON.stringify(customClasses));
  }, [customClasses, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem('bise_prints', printCount.toString());
  }, [printCount, mounted]);

  const allClasses = [...DEFAULT_CLASSES, ...customClasses];

  // Helper Functions
  const showToast = (msg: string, type: 'success' | 'error' | '' = '') => {
    setToastMessage(msg);
    setToastType(type);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2900);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parts[2]}-${months[parseInt(parts[1])-1]}-${parts[0]}`;
  };

  // Shared CNIC/B-Form formatter: 00000-0000000-0
  const applyCNICFormat = (val: string): string => {
    let v = val.replace(/\D/g, '');
    if (v.length > 13) v = v.slice(0, 13);
    let out = v;
    if (v.length > 5)  out = v.slice(0, 5) + '-' + v.slice(5);
    if (v.length > 12) out = v.slice(0, 5) + '-' + v.slice(5, 12) + '-' + v.slice(12);
    return out;
  };

  const formatCNIC = (val: string) => {
    setFormData(prev => ({ ...prev, cnic: applyCNICFormat(val) }));
  };

  const formatBForm = (val: string) => {
    setFormData(prev => ({ ...prev, bform: applyCNICFormat(val) }));
  };

  const handleGrChange = (val: string) => {
    // Only digits, max 7
    const v = val.replace(/\D/g, '').slice(0, 7);
    setFormData(prev => ({ ...prev, gr: v }));
  };

  const formatMobile = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    const out = v.length > 4 ? v.slice(0, 4) + '-' + v.slice(4) : v;
    setFormData(prev => ({ ...prev, mobile: out }));
  };

  // Validation
  const validateForm = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const f = formData;
    if (!f.class)                                   e.class    = 'Class is required';
    if (!f.gr)                                       e.gr       = 'GR No is required';
    else if (!/^\d{7}$/.test(f.gr))                 e.gr       = 'GR No must be exactly 7 digits';
    else if (students.some((s, i) => s.gr === f.gr && i !== editIndex))
                                                     e.gr       = 'This GR No already exists';
    if (!f.bform)                                   e.bform    = 'B. Form No is required';
    else if (!/^\d{5}-\d{7}-\d$/.test(f.bform))    e.bform    = 'Format: 00000-0000000-0';
    if (!f.name)                                     e.name     = 'Student name is required';
    if (!f.father)                                   e.father   = "Father's name is required";
    if (!f.cnic)                                     e.cnic     = 'Father CNIC is required';
    else if (!/^\d{5}-\d{7}-\d$/.test(f.cnic))     e.cnic     = 'Format: 00000-0000000-0';
    if (!f.admission)                               e.admission= 'Admission date is required';
    if (!f.dob)                                     e.dob      = 'Date of birth is required';
    if (!f.cast)                                    e.cast     = 'Caste is required';
    if (!f.mobile)                                  e.mobile   = 'Mobile number is required';
    else if (f.mobile.replace(/\D/g,'').length < 11) e.mobile  = 'Enter valid 11-digit mobile';
    if (!f.gender)                                  e.gender   = 'Gender is required';
    if (!f.religion)                                e.religion = 'Religion is required';
    if (!f.idmark)                                  e.idmark   = 'Identification mark is required';
    if (!f.address)                                 e.address  = 'Address is required';
    return e;
  };

  // Operations
  const openAddModal = () => {
    setEditIndex(null);
    setFormErrors({});
    setFormData({
      gr: '', name: '', father: '', class: formData.class || '', bform: '', cnic: '',
      admission: new Date().toISOString().split('T')[0], dob: '2008-06-01', cast: '', mobile: '', gender: '',
      religion: '', idmark: '', address: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    setEditIndex(idx);
    setFormErrors({});
    setFormData({...students[idx]});
    setIsFormModalOpen(true);
  };

  const saveStudent = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('⚠️ Please fix all highlighted errors before saving', 'error');
      return;
    }
    setFormErrors({});
    const { name } = formData;

    if (editIndex !== null) {
      const updated = [...students];
      updated[editIndex] = formData;
      setStudents(updated);
      showToast(`✅ ${name} updated`, 'success');
      setIsFormModalOpen(false);
    } else {
      setStudents([...students, formData]);
      showToast(`✅ ${name} saved — ready for next entry`, 'success');
      const savedClass = formData.class;
      setFormErrors({});
      setFormData({
        ...formData, gr: '', name: '', father: '', class: savedClass, bform: '', cnic: '',
        cast: '', mobile: '', gender: '', religion: '', idmark: '', address: ''
      });
    }
  };

  const deleteStudent = (idx: number) => {
    if (!confirm(`Delete "${students[idx].name}"? This cannot be undone.`)) return;
    const updated = [...students];
    updated.splice(idx, 1);
    setStudents(updated);
    showToast('🗑️ Student deleted');
  };

  const addCustomClass = () => {
    const val = newClassInput.trim().toUpperCase();
    if (!val) { showToast('⚠️ Enter a class name', 'error'); return; }
    if (allClasses.includes(val)) { showToast(`⚠️ "${val}" already exists`, 'error'); return; }
    setCustomClasses([...customClasses, val]);
    setNewClassInput('');
    showToast(`✅ Class "${val}" added`, 'success');
  };

  const deleteCustomClass = (idx: number) => {
    const name = customClasses[idx];
    if (!confirm(`Remove class "${name}"?`)) return;
    const updated = [...customClasses];
    updated.splice(idx, 1);
    setCustomClasses(updated);
    showToast(`🗑️ "${name}" removed`);
  };

  // Print Logic
  const printOne = (idx: number) => {
    setPrintData([students[idx]]);
    setIsPrintModalOpen(true);
  };

  const printAll = () => {
    if (!students.length) { showToast('⚠️ No students to print', 'error'); return; }
    // Sort logic or filter if needed, but for now just pass students
    setPrintData(students);
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    setPrintCount(prev => prev + 1);
    setIsPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Import Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!importClass) {
      showToast('⚠️ Please select a class first', 'error');
      // allow selecting another file later
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) {
          showToast('⚠️ The uploaded file is empty', 'error');
          return;
        }

        const newStudents: Student[] = data.map((row: any) => {
          // Flexible mapping: look for various common headers
          const getField = (...keys: string[]) => {
            for (const key of keys) {
              const val = row[key] !== undefined ? String(row[key]) : undefined;
              if (val) return val.trim();
            }
            return '';
          };

          return {
            gr: getField('GR Number', 'GR No', 'GR', 'gr_no', 'Gr No'),
            name: getField('Student Name', 'Name', 'Full Name', 'student_name', 'name'),
            father: getField('Father Name', "Father's Name", 'Father', 'father_name'),
            class: importClass,
            bform: getField('B. Form Number', 'B. Form', 'BForm', 'bform_no', 'bform'),
            cnic: getField('Father CNIC', 'CNIC', 'father_cnic', 'cnic'),
            admission: getField('Admission Date', 'Admission', 'Date of Admission', 'admission_date') || new Date().toISOString().split('T')[0],
            dob: getField('Date of Birth', 'DOB', 'dob', 'date_of_birth') || '2008-06-01',
            cast: getField('Caste', 'Cast', 'cast', 'caste'),
            mobile: getField('Mobile Number', 'Mobile', 'Phone', 'mobile_no', 'mobile'),
            gender: getField('Gender', 'Sex', 'gender'),
            religion: getField('Religion', 'religion'),
            idmark: getField('Identification Mark', 'ID Mark', 'idmark', 'identification_mark'),
            address: getField('Address', 'address')
          };
        });

        // Add to state
        setStudents(prev => [...prev, ...newStudents]);
        setIsImportModalOpen(false);
        showToast(`✅ Successfully imported ${newStudents.length} students into ${importClass}`, 'success');
      } catch (err) {
        console.error("Import Error: ", err);
        showToast('⚠️ Error parsing the file. Please check format.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  // Derived Data
  const recentStudents = [...students].slice(-6).reverse();
  const filteredStudents = students.map((s, i) => ({...s, _i: i})).filter(s => 
    (!classFilter || s.class === classFilter) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (s.gr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (s.bform || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (s.father || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (s.mobile || '').includes(searchQuery))
  );

  const usedClassesCount = new Set(students.map(s => s.class).filter(Boolean)).size;

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Govt. High School<br/>Thari Mirwah</h1>
          <span>Student Records System</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Main</div>
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className={`nav-item ${view === 'students' ? 'active' : ''}`} onClick={() => setView('students')}>
            <span className="nav-icon">👨‍🎓</span> All Students
          </button>
          <div className="nav-label">Actions</div>
          <button className="nav-item" onClick={openAddModal}>
             <span className="nav-icon">➕</span> Add Student
          </button>
          <button className="nav-item" onClick={() => setIsClassModalOpen(true)}>
             <span className="nav-icon">🏫</span> Manage Classes
          </button>
          <button className="nav-item" onClick={printAll}>
             <span className="nav-icon">🖨️</span> Print All Forms
          </button>
        </nav>
        <div className="sidebar-footer">
          <div style={{marginBottom:'10px',color:'rgba(255,255,255,0.3)',fontSize:'.72rem',textAlign:'center'}}>Govt. H/S Thari Mirwah · 2025–26</div>
          <button
            onClick={handleLogout}
            style={{width:'100%',padding:'9px 14px',background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.3)',
              borderRadius:'8px',color:'rgba(255,100,80,0.85)',fontSize:'.8rem',fontWeight:'600',
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
              fontFamily:"'DM Sans',sans-serif",transition:'all .18s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(192,57,43,0.3)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(192,57,43,0.15)';}}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div id="view-dashboard">
            <div className="topbar">
              <div className="topbar-title"><h2>Dashboard</h2><p>Overview of student records</p></div>
              <div style={{display:'flex', gap:'10px'}}>
                <button className="btn btn-ghost" style={{background:'#f1f5f9', border:'1px solid #cbd5e1'}} onClick={() => { setIsImportModalOpen(true); setImportClass(''); }}>📥 Import excel/csv</button>
                <button className="btn btn-primary" onClick={openAddModal}>＋ Add Student</button>
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon">👨‍🎓</div>
                <div><div className="stat-num">{students.length}</div><div className="stat-label">Total Students</div></div>
              </div>
              <div className="stat-card" style={{ borderLeftColor: '#2851b5' }}>
                <div className="stat-icon">🏫</div>
                <div><div className="stat-num">{usedClassesCount}</div><div className="stat-label">Active Classes</div></div>
              </div>
              <div className="stat-card" style={{ borderLeftColor: '#1a7a4a' }}>
                <div className="stat-icon">🖨️</div>
                <div><div className="stat-num">{printCount}</div><div className="stat-label">Sessions Printed</div></div>
              </div>
            </div>
            
            <div className="table-card">
              <div style={{ padding: '18px 20px', borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--navy)' }}>Recent Students</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setView('students')}>View All →</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>GR No</th><th>Student Name</th><th>Class</th>
                    <th>B. Form No</th><th>Father's Name</th><th>Mobile</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {recentStudents.length === 0 ? (
                      <tr><td colSpan={7}><div className="empty-state">
                        <div className="e-icon">📭</div><p>No students yet. Click "Add Student" to begin.</p></div></td></tr>
                    ) : (
                      recentStudents.map((s, idx) => {
                        const originalIdx = students.length - 1 - idx;
                        return (
                          <tr key={originalIdx}>
                            <td><span className="td-badge td-badge-gold">{s.gr || '—'}</span></td>
                            <td className="td-name">{s.name}</td>
                            <td><span className="td-badge td-badge-green">{s.class || '—'}</span></td>
                            <td>{s.bform || '—'}</td>
                            <td>{s.father}</td>
                            <td>{s.mobile || '—'}</td>
                            <td><div className="action-btns">
                              <button className="btn btn-gold btn-sm" onClick={() => printOne(originalIdx)}>🖨️</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(originalIdx)}>✏️</button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteStudent(originalIdx)}>🗑️</button>
                            </div></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ALL STUDENTS VIEW */}
        {view === 'students' && (
          <div id="view-students">
            <div className="topbar">
              <div className="topbar-title"><h2>All Students</h2><p>{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} enrolled</p></div>
              <div style={{display:'flex', gap:'10px'}}>
                <button className="btn btn-ghost" style={{background:'#f1f5f9', border:'1px solid #cbd5e1'}} onClick={() => { setIsImportModalOpen(true); setImportClass(''); }}>📥 Import excel/csv</button>
                <button className="btn btn-primary" onClick={openAddModal}>＋ Add Student</button>
              </div>
            </div>
            <div className="toolbar">
              <div className="search-wrap">
                <span className="s-icon">🔍</span>
                <input type="text" placeholder="Search by name, GR No, B. Form, father…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <select className="filter-select" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                <option value="">All Classes</option>
                {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-gold" onClick={printAll}>🖨️ Print All</button>
            </div>
            
            <div className="table-card">
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>GR No</th><th>Student Name</th><th>Class</th><th>B. Form No</th>
                    <th>Father's Name</th><th>CNIC</th><th>DOB</th><th>Admission</th><th>Mobile</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={10}><div className="empty-state">
                        <div className="e-icon">🔍</div><p>No matching students found.</p></div></td></tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s._i}>
                          <td><span className="td-badge td-badge-gold">{s.gr || '—'}</span></td>
                          <td className="td-name">{s.name}</td>
                          <td><span className="td-badge td-badge-green">{s.class || '—'}</span></td>
                          <td>{s.bform || '—'}</td>
                          <td>{s.father}</td>
                          <td>{s.cnic || '—'}</td>
                          <td>{fmtDate(s.dob)}</td>
                          <td>{fmtDate(s.admission)}</td>
                          <td>{s.mobile || '—'}</td>
                          <td><div className="action-btns">
                            <button className="btn btn-gold btn-sm" onClick={() => printOne(s._i!)}>🖨️</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(s._i!)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteStudent(s._i!)}>🗑️</button>
                          </div></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FORM MODAL */}
      <div className={`overlay ${isFormModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsFormModalOpen(false) }}>
        <div className="modal">
          <div className="modal-header">
            <h3>{editIndex !== null ? `Edit — ${formData.name}` : 'Add New Student'}</h3>
            <button className="modal-close" onClick={() => setIsFormModalOpen(false)}>✕</button>
          </div>
          
          <div className="class-banner">
            <span className="class-banner-label">📚 Class <span style={{color:'#f87c7c'}}>*</span></span>
            <select
              value={formData.class}
              onChange={e => { setFormData({...formData, class: e.target.value}); setFormErrors(prev => ({...prev, class: ''})); }}
              style={formErrors.class ? {borderColor:'var(--red)'} : {}}
            >
              <option value="">— Select Class —</option>
              {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {formErrors.class && <span style={{color:'#f87c7c',fontSize:'.75rem',fontWeight:600}}>{formErrors.class}</span>}
            <button className="add-class-btn" onClick={() => setIsClassModalOpen(true)}>＋ New Class</button>
          </div>

          <div className="modal-body">
            <div className="form-grid">

              {/* Row 1: GR No | B. Form No | Mobile */}
              <div className={`form-group ${formErrors.gr ? 'field-invalid' : ''}`}>
                <label className="field-label">GR No <span style={{color:'var(--red)'}}>*</span></label>
                <input type="text" inputMode="numeric" placeholder="7 digits e.g. 1234567"
                  maxLength={7} value={formData.gr}
                  onChange={e => { handleGrChange(e.target.value); setFormErrors(prev => ({...prev, gr: ''})); }} />
                <span className="input-hint">Exactly 7 digits, unique</span>
                <span className="input-error">{formErrors.gr}</span>
              </div>
              <div className={`form-group ${formErrors.bform ? 'field-invalid' : ''}`}>
                <label className="field-label">B. Form No <span style={{color:'var(--red)'}}>*</span></label>
                <input type="text" inputMode="numeric" placeholder="00000-0000000-0"
                  maxLength={15} value={formData.bform}
                  onChange={e => { formatBForm(e.target.value); setFormErrors(prev => ({...prev, bform: ''})); }} />
                <span className="input-hint">Auto: 00000-0000000-0</span>
                <span className="input-error">{formErrors.bform}</span>
              </div>
              <div className={`form-group ${formErrors.mobile ? 'field-invalid' : ''}`}>
                <label className="field-label">Mobile <span style={{color:'var(--red)'}}>*</span></label>
                <input type="tel" placeholder="0300-1234567" maxLength={12} value={formData.mobile}
                  onChange={e => { formatMobile(e.target.value); setFormErrors(prev => ({...prev, mobile: ''})); }} />
                <span className="input-hint">Auto: XXXX-XXXXXXX</span>
                <span className="input-error">{formErrors.mobile}</span>
              </div>

              {/* Row 2: Student Name (spans 2) | Admission Date */}
              <div className={`form-group ${formErrors.name ? 'field-invalid' : ''}`} style={{gridColumn:'span 2'}}>
                <label className="field-label">Student Name <span style={{color:'var(--red)'}}>*</span></label>
                <input type="text" placeholder="Full name of student" value={formData.name}
                  onChange={e => { setFormData({...formData, name: e.target.value}); setFormErrors(prev => ({...prev, name: ''})); }} />
                <span className="input-error">{formErrors.name}</span>
              </div>
              <div className={`form-group ${formErrors.admission ? 'field-invalid' : ''}`}>
                <label className="field-label">Admission Date <span style={{color:'var(--red)'}}>*</span></label>
                <input type="date" value={formData.admission}
                  onChange={e => { setFormData({...formData, admission: e.target.value}); setFormErrors(prev => ({...prev, admission: ''})); }} />
                <span className="input-error">{formErrors.admission}</span>
              </div>

              {/* Row 3: Father's Name | Father CNIC | DOB */}
              <div className={`form-group ${formErrors.father ? 'field-invalid' : ''}`}>
                <label className="field-label">Father's Name <span style={{color:'var(--red)'}}>*</span></label>
                <input type="text" placeholder="Father's full name" value={formData.father}
                  onChange={e => { setFormData({...formData, father: e.target.value}); setFormErrors(prev => ({...prev, father: ''})); }} />
                <span className="input-error">{formErrors.father}</span>
              </div>
              <div className={`form-group ${formErrors.cnic ? 'field-invalid' : ''}`}>
                <label className="field-label">Father CNIC <span style={{color:'var(--red)'}}>*</span></label>
                <input type="text" inputMode="numeric" placeholder="00000-0000000-0"
                  maxLength={15} value={formData.cnic}
                  onChange={e => { formatCNIC(e.target.value); setFormErrors(prev => ({...prev, cnic: ''})); }} />
                <span className="input-hint">Auto: 00000-0000000-0</span>
                <span className="input-error">{formErrors.cnic}</span>
              </div>
              <div className={`form-group ${formErrors.dob ? 'field-invalid' : ''}`}>
                <label className="field-label">Date of Birth <span style={{color:'var(--red)'}}>*</span></label>
                <input type="date" value={formData.dob}
                  onChange={e => { setFormData({...formData, dob: e.target.value}); setFormErrors(prev => ({...prev, dob: ''})); }} />
                <span className="input-error">{formErrors.dob}</span>
              </div>

              {/* Row 4: Caste | Gender | Religion */}
              <div className={`form-group ${formErrors.cast ? 'field-invalid' : ''}`}>
                <label className="field-label">Caste <span style={{color:'var(--red)'}}>*</span></label>
                <input type="text" placeholder="e.g. Soomro" value={formData.cast}
                  onChange={e => { setFormData({...formData, cast: e.target.value}); setFormErrors(prev => ({...prev, cast: ''})); }} />
                <span className="input-error">{formErrors.cast}</span>
              </div>
              <div className={`form-group ${formErrors.gender ? 'field-invalid' : ''}`}>
                <label className="field-label">Gender <span style={{color:'var(--red)'}}>*</span></label>
                <select className="field-select" value={formData.gender}
                  onChange={e => { setFormData({...formData, gender: e.target.value}); setFormErrors(prev => ({...prev, gender: ''})); }}>
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <span className="input-error">{formErrors.gender}</span>
              </div>
              <div className={`form-group ${formErrors.religion ? 'field-invalid' : ''}`}>
                <label className="field-label">Religion <span style={{color:'var(--red)'}}>*</span></label>
                <select className="field-select" value={formData.religion}
                  onChange={e => { setFormData({...formData, religion: e.target.value}); setFormErrors(prev => ({...prev, religion: ''})); }}>
                  <option value="">— Select —</option>
                  <option value="Islam">Islam</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Hinduism">Hinduism</option>
                  <option value="Other">Other</option>
                </select>
                <span className="input-error">{formErrors.religion}</span>
              </div>

              {/* Row 5: Identification Mark (spans 2) | empty or address start */}
              <div className={`form-group ${formErrors.idmark ? 'field-invalid' : ''}`} style={{gridColumn:'span 2'}}>
                <label className="field-label">Identification Mark <span style={{color:'var(--red)'}}>*</span></label>
                <input type="text" placeholder="e.g. Mole on right cheek" value={formData.idmark}
                  onChange={e => { setFormData({...formData, idmark: e.target.value}); setFormErrors(prev => ({...prev, idmark: ''})); }} />
                <span className="input-error">{formErrors.idmark}</span>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'2px'}}>
                <span style={{fontSize:'.7rem',color:'var(--muted)',fontStyle:'italic'}}>All fields marked <span style={{color:'var(--red)'}}>*</span> are required</span>
              </div>

              {/* Row 6: Address full width */}
              <div className={`form-group full ${formErrors.address ? 'field-invalid' : ''}`}>
                <label className="field-label">Address <span style={{color:'var(--red)'}}>*</span></label>
                <textarea placeholder="Full residential address…" value={formData.address}
                  onChange={e => { setFormData({...formData, address: e.target.value}); setFormErrors(prev => ({...prev, address: ''})); }} />
                <span className="input-error">{formErrors.address}</span>
              </div>

            </div>
          </div>

          
          <div className="modal-footer">
            <span className="footer-note">{editIndex !== null ? '✏️ Editing existing record — form will close after save' : '💡 Form auto-resets after save — stays open for next entry'}</span>
            <div style={{display: 'flex', gap: '10px'}}>
              <button className="btn btn-ghost" onClick={() => setIsFormModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={saveStudent}>💾 Save Student</button>
            </div>
          </div>
        </div>
      </div>

      {/* IMPORT MODAL */}
      <div className={`overlay ${isImportModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsImportModalOpen(false) }}>
        <div className="modal" style={{maxWidth: '480px'}}>
          <div className="modal-header">
            <h3>📥 Import Excel / CSV</h3>
            <button className="modal-close" onClick={() => setIsImportModalOpen(false)}>✕</button>
          </div>
          
          <div className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div className="class-banner" style={{margin: 0}}>
              <span className="class-banner-label">📚 Target Class <span style={{color:'#f87c7c'}}>*</span></span>
              <select
                value={importClass}
                onChange={e => setImportClass(e.target.value)}
              >
                <option value="">— Select Class —</option>
                {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{
              border: '2px dashed #cbd5e1', 
              borderRadius: '8px', 
              padding: '30px', 
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <div style={{fontSize: '2rem', marginBottom: '10px'}}>📄</div>
              <h4 style={{margin: '0 0 5px 0', color: 'var(--navy)'}}>Click to Upload File</h4>
              <p style={{margin: 0, fontSize: '.8rem', color: 'var(--muted)'}}>Supports .xlsx and .csv files</p>
              <input 
                type="file" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%'
                }}
              />
            </div>
            
            <div style={{background: 'rgba(240, 173, 78, 0.1)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #f0ad4e'}}>
              <strong>💡 Note:</strong>
              <p style={{margin: '5px 0 0 0', fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.4}}>
                The import process will bypass standard required field validations. Missing data will just be left blank. Make sure your file has headers like "GR Number", "Name", "Father Name", etc.
              </p>
            </div>
          </div>
          
          <div className="modal-footer" style={{justifyContent: 'flex-end'}}>
            <button className="btn btn-ghost" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </div>

      {/* MANAGE CLASSES MODAL */}
      <div className={`overlay ${isClassModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsClassModalOpen(false) }}>
        <div className="modal" style={{maxWidth: '420px'}}>
          <div className="modal-header">
            <h3>🏫 Manage Classes</h3>
            <button className="modal-close" onClick={() => setIsClassModalOpen(false)}>✕</button>
          </div>
          <div className="modal-body">
            <p style={{fontSize: '.84rem', color: 'var(--muted)', marginBottom: '14px'}}>
              Classes 6A–10C are built-in. Add custom classes (e.g. 11A, Science-A) below.
            </p>
            <div style={{display: 'flex', gap: '10px', marginBottom: '4px'}}>
              <input type="text" placeholder="e.g. 11A or Science-A" 
                style={{flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '.875rem', outline: 'none', color: 'var(--text)'}}
                value={newClassInput} 
                onChange={e => setNewClassInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && addCustomClass()} />
              <button className="btn btn-green" onClick={addCustomClass}>Add</button>
            </div>
            
            <div className="classes-list">
              {DEFAULT_CLASSES.map(c => (
                <div key={c} className="class-item is-default">
                  <span>📚 {c}</span>
                  <span style={{fontSize: '.7rem', color: 'var(--muted)', background: '#e8f0fe', padding: '2px 8px', borderRadius: '10px'}}>built-in</span>
                </div>
              ))}
              {customClasses.map((c, i) => (
                <div key={c} className="class-item is-custom">
                   <span>🏫 {c}</span>
                   <button className="class-del-btn" onClick={() => deleteCustomClass(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer" style={{justifyContent: 'flex-end'}}>
            <button className="btn btn-primary" onClick={() => setIsClassModalOpen(false)}>✓ Done</button>
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      <div className={`print-overlay ${isPrintModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsPrintModalOpen(false) }}>
        <div className="print-modal">
          <div className="print-modal-header">
            <h3>🖨️ Print Preview</h3>
            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <button className="btn btn-primary btn-sm" onClick={executePrint}>Print</button>
              <button className="modal-close" onClick={() => setIsPrintModalOpen(false)}>✕</button>
            </div>
          </div>
          <div className="print-preview">
             {printData.map((s, idx) => (
               <div key={idx} className="print-form">
                 <div className="pf-header">
                   <div>
                     <h2>Govt. High School Thari Mirwah</h2>
                     <div className="pf-school">Student Registration Form · Academic Year 2025–26</div>
                   </div>
                   <div className="pf-meta">
                     <span className="pf-class-tag">{s.class || '—'}</span>
                     <span className="pf-sr">GR# {s.gr || String(idx+1).padStart(3, '0')}</span>
                   </div>
                 </div>
                 <div className="pf-grid">
                    <div className="pf-field"><div className="pf-label">GR No</div><div className="pf-value">{s.gr || '—'}</div></div>
                    <div className="pf-field"><div className="pf-label">B. Form No</div><div className="pf-value">{s.bform || '—'}</div></div>
                    <div className="pf-field pf-full"><div className="pf-label">Student Name</div><div className="pf-value">{s.name || '—'}</div></div>
                    <div className="pf-field"><div className="pf-label">Father's Name</div><div className="pf-value">{s.father || '—'}</div></div>
                    <div className="pf-field"><div className="pf-label">Father CNIC</div><div className="pf-value">{s.cnic || '—'}</div></div>
                    <div className="pf-field"><div className="pf-label">Date of Admission</div><div className="pf-value">{fmtDate(s.admission)}</div></div>
                    <div className="pf-field"><div className="pf-label">Date of Birth</div><div className="pf-value">{fmtDate(s.dob)}</div></div>
                    <div className="pf-field"><div className="pf-label">Caste</div><div className="pf-value">{s.cast || '—'}</div></div>
                    <div className="pf-field"><div className="pf-label">Mobile Number</div><div className="pf-value">{s.mobile || '—'}</div></div>
                    <div className="pf-field"><div className="pf-label">Gender</div><div className="pf-value">{s.gender || '—'}</div></div>
                    <div className="pf-field"><div className="pf-label">Religion</div><div className="pf-value">{s.religion || '—'}</div></div>
                    <div className="pf-field pf-full"><div className="pf-label">Identification Mark</div><div className="pf-value">{s.idmark || '—'}</div></div>
                    <div className="pf-field pf-full"><div className="pf-label">Address</div><div className="pf-value">{s.address || '—'}</div></div>
                 </div>
                 <div className="pf-footer">
                   <div>Generated: {new Date().toLocaleDateString('en-GB')}</div>
                   <div className="pf-sig-line">Principal's Signature</div>
                 </div>
               </div>
             ))}
          </div>
          <div style={{padding: '10px 26px 18px', textAlign: 'right'}}>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsPrintModalOpen(false)}>Close</button>
          </div>
        </div>
      </div>
      
      {/* PRINT AREA */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body > *:not(#print-wrap) { display: none !important; }
          #print-wrap { display: block !important; position: static !important; inset: 0; padding: 10mm 12mm; background: #fff; }
          .print-form{border:2px solid #0f2744;border-radius:8px;padding:18px 22px;
            font-family:'DM Sans',Arial,sans-serif;margin-bottom:14px;page-break-inside:avoid; width: 100%;}
          .pf-header{display:flex;justify-content:space-between;align-items:flex-start;
            border-bottom:2px solid #0f2744;padding-bottom:10px;margin-bottom:13px}
          .pf-header h2{font-size:1rem;color:#0f2744;font-weight:900;font-family:Georgia,serif}
          .pf-school{font-size:.67rem;color:#666;margin-top:2px}
          .pf-meta{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
          .pf-sr{background:#0f2744;color:#c8973a;padding:3px 10px;border-radius:4px;font-size:.7rem;font-weight:700}
          .pf-class-tag{background:#e8f5e9;color:#1a7a4a;padding:3px 10px;border-radius:4px;font-size:.7rem;font-weight:700}
          .pf-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px}
          .pf-field{border-bottom:1px solid #ccc;padding-bottom:3px}
          .pf-label{font-size:.59rem;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:1px}
          .pf-value{font-size:.88rem;font-weight:700;font-style:italic;color:#0f2744}
          .pf-full{grid-column:1/-1}
          .pf-footer{display:flex;justify-content:space-between;align-items:flex-end;
            margin-top:13px;padding-top:9px;border-top:1px dashed #aaa;font-size:.68rem;color:#888}
          .pf-sig-line{border-top:1.5px solid #333;width:150px;padding-top:3px;text-align:center;font-size:.67rem}
        }
      `}} />
      <div id="print-wrap" style={{display: 'none'}}>
        {printData.map((s, idx) => (
           <div key={idx} className="print-form">
           <div className="pf-header">
             <div>
               <h2>Govt. High School Thari Mirwah</h2>
               <div className="pf-school">Student Registration Form · Academic Year 2025–26</div>
             </div>
             <div className="pf-meta">
               <span className="pf-class-tag">{s.class || '—'}</span>
               <span className="pf-sr">GR# {s.gr || String(idx+1).padStart(3, '0')}</span>
             </div>
           </div>
           <div className="pf-grid">
              <div className="pf-field"><div className="pf-label">GR No</div><div className="pf-value">{s.gr || '—'}</div></div>
              <div className="pf-field"><div className="pf-label">B. Form No</div><div className="pf-value">{s.bform || '—'}</div></div>
              <div className="pf-field pf-full"><div className="pf-label">Student Name</div><div className="pf-value">{s.name || '—'}</div></div>
              <div className="pf-field"><div className="pf-label">Father's Name</div><div className="pf-value">{s.father || '—'}</div></div>
              <div className="pf-field"><div className="pf-label">Father CNIC</div><div className="pf-value">{s.cnic || '—'}</div></div>
              <div className="pf-field"><div className="pf-label">Date of Admission</div><div className="pf-value">{fmtDate(s.admission)}</div></div>
              <div className="pf-field"><div className="pf-label">Date of Birth</div><div className="pf-value">{fmtDate(s.dob)}</div></div>
              <div className="pf-field"><div className="pf-label">Caste</div><div className="pf-value">{s.cast || '—'}</div></div>
              <div className="pf-field"><div className="pf-label">Mobile Number</div><div className="pf-value">{s.mobile || '—'}</div></div>
              <div className="pf-field"><div className="pf-label">Gender</div><div className="pf-value">{s.gender || '—'}</div></div>
              <div className="pf-field"><div className="pf-label">Religion</div><div className="pf-value">{s.religion || '—'}</div></div>
              <div className="pf-field pf-full"><div className="pf-label">Identification Mark</div><div className="pf-value">{s.idmark || '—'}</div></div>
              <div className="pf-field pf-full"><div className="pf-label">Address</div><div className="pf-value">{s.address || '—'}</div></div>
           </div>
           <div className="pf-footer">
             <div>Generated: {new Date().toLocaleDateString('en-GB')}</div>
             <div className="pf-sig-line">Principal's Signature</div>
           </div>
         </div>
        ))}
      </div>

      {/* TOAST */}
      <div className={`toast ${toastShow ? 'show' : ''} ${toastType}`}>
        {toastMessage}
      </div>
    </>
  );
}
