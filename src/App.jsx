import { useState, useEffect, useCallback } from "react";

// ===================== CONSTANTS =====================
const SUPER_ADMIN_EMAIL = "superadmin@caryagolf.com";
const SUPER_ADMIN_PASSWORD = "Carya2024!";

const DEPARTMENTS = [
  "Resepsiyon","Restoran","Mutfak","Bahçe & Saha","Güvenlik",
  "Housekeeping","Pro Shop","Spa & Wellness","Teknik Servis","İnsan Kaynakları",
];

const SHIFT_LETTERS = ["A","B","C","D","E","F","G","H","İzin","OFF"];
const SHIFT_COLORS = {
  A:"#2d6a4f",B:"#1e6091",C:"#7b2d8b",D:"#c77dff",
  E:"#f4a261",F:"#e76f51",G:"#2a9d8f",H:"#e9c46a",
  İzin:"#6c757d",OFF:"#343a40",
};

const DAYS = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

const MEMBERSHIP_TYPES = ["Altın","Platin","Standart","VIP","Aile","Kurumsal"];

// ===================== INITIAL DATA =====================
const INITIAL_USERS = [{
  id:"super1",email:SUPER_ADMIN_EMAIL,password:SUPER_ADMIN_PASSWORD,
  name:"Süper Admin",phone:"+90 555 000 0000",role:"superadmin",
  department:"Yönetim",approved:true,notifications:[],
}];

const INITIAL_TASKS = {};
DEPARTMENTS.forEach((dept) => {
  INITIAL_TASKS[dept] = [
    {id:`${dept}-1`,text:"Açılış kontrolü yapıldı",category:"Açılış"},
    {id:`${dept}-2`,text:"Ekipman kontrolü tamamlandı",category:"Güvenlik"},
    {id:`${dept}-3`,text:"Günlük rapor hazırlandı",category:"Raporlama"},
  ];
});

// ===================== STORAGE HELPERS =====================
const save = (key,val) => { try { localStorage.setItem(key,JSON.stringify(val)); } catch {} };
const load = (key,def) => {
  try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; }
  catch { return def; }
};

// ===================== DATE HELPERS =====================
const today = () => new Date().toISOString().slice(0,10);
const isExpired = (endDate) => endDate && endDate < today();
const isExpiringSoon = (endDate) => {
  if (!endDate) return false;
  const diff = (new Date(endDate) - new Date(today())) / (1000*60*60*24);
  return diff >= 0 && diff <= 30;
};

// ===================== MAIN APP =====================
export default function App() {
  const [users,setUsers] = useState(()=>load("cg_users",INITIAL_USERS));
  const [currentUser,setCurrentUser] = useState(()=>load("cg_current",null));
  const [page,setPage] = useState("login");
  const [activeTab,setActiveTab] = useState("shift");
  const [shifts,setShifts] = useState(()=>load("cg_shifts",{}));
  const [menus,setMenus] = useState(()=>load("cg_menus",{}));
  const [taskDefs,setTaskDefs] = useState(()=>load("cg_taskdefs",INITIAL_TASKS));
  const [taskLogs,setTaskLogs] = useState(()=>load("cg_tasklogs",{}));
  const [taskNotes,setTaskNotes] = useState(()=>load("cg_tasknotes",{}));
  const [notifications,setNotifications] = useState(()=>load("cg_notifs",{}));
  const [members,setMembers] = useState(()=>load("cg_members",[]));
  const [noShows,setNoShows] = useState(()=>load("cg_noshows",[]));

  useEffect(()=>{ save("cg_users",users); },[users]);
  useEffect(()=>{ save("cg_current",currentUser); },[currentUser]);
  useEffect(()=>{ save("cg_shifts",shifts); },[shifts]);
  useEffect(()=>{ save("cg_menus",menus); },[menus]);
  useEffect(()=>{ save("cg_taskdefs",taskDefs); },[taskDefs]);
  useEffect(()=>{ save("cg_tasklogs",taskLogs); },[taskLogs]);
  useEffect(()=>{ save("cg_tasknotes",taskNotes); },[taskNotes]);
  useEffect(()=>{ save("cg_notifs",notifications); },[notifications]);
  useEffect(()=>{ save("cg_members",members); },[members]);
  useEffect(()=>{ save("cg_noshows",noShows); },[noShows]);

  const isAdmin = currentUser?.role==="admin"||currentUser?.role==="superadmin";
  const isSuperAdmin = currentUser?.role==="superadmin";

  const addNotification = useCallback((deptOrAll,message,fromUser) => {
    const notif = {
      id:Date.now()+Math.random(),message,from:fromUser,
      time:new Date().toLocaleString("tr-TR"),read:false,
    };
    setNotifications((prev) => {
      const updated = {...prev};
      users.forEach((u) => {
        if (deptOrAll==="all"||u.department===deptOrAll||u.role==="admin"||u.role==="superadmin") {
          updated[u.id] = [...(updated[u.id]||[]),notif];
        }
      });
      return updated;
    });
  },[users]);

  // Inject membership expiry notifications for admins
  useEffect(() => {
    if (!currentUser || (!isAdmin)) return;
    const expiredCount = members.filter(m=>isExpired(m.endDate)).length;
    const soonCount = members.filter(m=>isExpiringSoon(m.endDate)).length;
    // We don't auto-inject here to avoid spam; handled via memberNotifCount below
  },[members,currentUser,isAdmin]);

  const myNotifications = currentUser?(notifications[currentUser.id]||[]):[];
  const unreadCount = myNotifications.filter(n=>!n.read).length;

  // Member expiry badge for admins
  const expiredMemberCount = isAdmin ? members.filter(m=>isExpired(m.endDate)).length : 0;
  const memberAlertCount = isAdmin ? members.filter(m=>isExpired(m.endDate)||isExpiringSoon(m.endDate)).length : 0;

  const markNotifRead = () => {
    if (!currentUser) return;
    setNotifications((prev) => ({
      ...prev,
      [currentUser.id]:(prev[currentUser.id]||[]).map(n=>({...n,read:true})),
    }));
  };

  if (!currentUser||page==="login") {
    return <AuthScreen users={users} setUsers={setUsers} onLogin={(u)=>{setCurrentUser(u);setPage("app");}} />;
  }

  return (
    <MainApp
      currentUser={currentUser} users={users} setUsers={setUsers}
      isAdmin={isAdmin} isSuperAdmin={isSuperAdmin}
      activeTab={activeTab} setActiveTab={setActiveTab}
      shifts={shifts} setShifts={setShifts}
      menus={menus} setMenus={setMenus}
      taskDefs={taskDefs} setTaskDefs={setTaskDefs}
      taskLogs={taskLogs} setTaskLogs={setTaskLogs}
      taskNotes={taskNotes} setTaskNotes={setTaskNotes}
      members={members} setMembers={setMembers}
      noShows={noShows} setNoShows={setNoShows}
      memberAlertCount={memberAlertCount}
      myNotifications={myNotifications} unreadCount={unreadCount}
      markNotifRead={markNotifRead} addNotification={addNotification}
      onLogout={()=>{setCurrentUser(null);setPage("login");}}
    />
  );
}

// ===================== AUTH SCREEN =====================
function AuthScreen({users,setUsers,onLogin}) {
  const [mode,setMode] = useState("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [department,setDepartment] = useState(DEPARTMENTS[0]);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [resetMode,setResetMode] = useState(false);
  const [resetEmail,setResetEmail] = useState("");

  const handleLogin = () => {
    const u = users.find(u=>u.email===email&&u.password===password);
    if (!u) return setError("E-posta veya şifre hatalı.");
    if (!u.approved) return setError("Hesabınız henüz onaylanmamış.");
    setError(""); onLogin(u);
  };
  const handleRegister = () => {
    if (!name||!email||!password||!phone) return setError("Tüm alanları doldurunuz.");
    if (users.find(u=>u.email===email)) return setError("Bu e-posta zaten kayıtlı.");
    setUsers(prev=>[...prev,{id:Date.now().toString(),email,password,name,phone,department,role:"user",approved:false,notifications:[]}]);
    setSuccess("Kaydınız alındı. Admin onayı bekleniyor.");
    setMode("login"); setError("");
  };
  const handleReset = () => {
    const u = users.find(u=>u.email===resetEmail);
    if (!u) return setError("Bu e-posta kayıtlı değil.");
    setSuccess(`Demo: Mevcut şifreniz: ${u.password}`);
    setResetMode(false); setError("");
  };

  return (
    <div style={S.authBg}>
      <div style={S.authCard}>
        <div style={S.authLogo}>
          <span style={{fontSize:40}}>⛳</span>
          <div>
            <div style={S.logoTitle}>CARYA</div>
            <div style={S.logoSub}>GOLF KULÜBÜ</div>
          </div>
        </div>
        {!resetMode ? (
          <>
            <div style={S.authTabs}>
              <button style={{...S.authTab,...(mode==="login"?S.authTabActive:{})}} onClick={()=>{setMode("login");setError("");setSuccess("");}}>Giriş Yap</button>
              <button style={{...S.authTab,...(mode==="register"?S.authTabActive:{})}} onClick={()=>{setMode("register");setError("");setSuccess("");}}>Kayıt Ol</button>
            </div>
            {error&&<div style={S.errorBox}>{error}</div>}
            {success&&<div style={S.successBox}>{success}</div>}
            <div style={S.formGroup}><label style={S.label}>E-posta</label><input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@caryagolf.com"/></div>
            <div style={S.formGroup}><label style={S.label}>Şifre</label><input style={S.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div>
            {mode==="register"&&<>
              <div style={S.formGroup}><label style={S.label}>Ad Soyad</label><input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Ad Soyad"/></div>
              <div style={S.formGroup}><label style={S.label}>Telefon</label><input style={S.input} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+90 555 000 0000"/></div>
              <div style={S.formGroup}><label style={S.label}>Departman</label><select style={S.input} value={department} onChange={e=>setDepartment(e.target.value)}>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div>
            </>}
            <button style={S.btnPrimary} onClick={mode==="login"?handleLogin:handleRegister}>{mode==="login"?"Giriş Yap":"Kayıt Ol"}</button>
            {mode==="login"&&<button style={S.btnLink} onClick={()=>{setResetMode(true);setError("");}}>Şifremi Unuttum</button>}
          </>
        ):(
          <>
            <div style={{color:"#c9a84c",fontWeight:700,fontSize:14,marginBottom:16}}>Şifre Sıfırlama</div>
            {error&&<div style={S.errorBox}>{error}</div>}
            {success&&<div style={S.successBox}>{success}</div>}
            <div style={S.formGroup}><label style={S.label}>Kayıtlı E-posta</label><input style={S.input} type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="ornek@caryagolf.com"/></div>
            <button style={S.btnPrimary} onClick={handleReset}>Sıfırlama Gönder</button>
            <button style={S.btnLink} onClick={()=>setResetMode(false)}>← Geri Dön</button>
          </>
        )}
      </div>
    </div>
  );
}

// ===================== MAIN APP SHELL =====================
function MainApp(props) {
  const {currentUser,activeTab,setActiveTab,myNotifications,unreadCount,markNotifRead,onLogout,isAdmin,memberAlertCount} = props;
  const [showNotifs,setShowNotifs] = useState(false);
  const [showProfile,setShowProfile] = useState(false);

  const totalAlerts = unreadCount + (isAdmin ? memberAlertCount : 0);

  return (
    <div style={S.appContainer}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={{fontSize:22}}>⛳</span>
          <div><div style={S.headerTitle}>CARYA GOLF</div><div style={S.headerSub}>Yönetim Sistemi</div></div>
        </div>
        <div style={S.headerRight}>
          {isAdmin && memberAlertCount > 0 && (
            <button style={{...S.iconBtn,borderColor:"#e76f51",color:"#e76f51"}} onClick={()=>{setActiveTab("members");setShowNotifs(false);setShowProfile(false);}}>
              👥 <span style={{...S.badge,background:"#e76f51"}}>{memberAlertCount}</span>
            </button>
          )}
          <button style={S.iconBtn} onClick={()=>{setShowNotifs(!showNotifs);if(!showNotifs)markNotifRead();setShowProfile(false);}}>
            🔔 {unreadCount>0&&<span style={S.badge}>{unreadCount}</span>}
          </button>
          <button style={S.iconBtn} onClick={()=>{setShowProfile(!showProfile);setShowNotifs(false);}}>
            👤 <span style={{fontSize:12,marginLeft:4}}>{currentUser.name.split(" ")[0]}</span>
          </button>
        </div>
      </div>

      {showNotifs&&(
        <div style={S.notifDropdown}>
          <div style={S.notifHeader}>Bildirimler</div>
          {myNotifications.length===0?<div style={S.notifEmpty}>Bildirim yok</div>:
            [...myNotifications].reverse().slice(0,20).map(n=>(
              <div key={n.id} style={{...S.notifItem,background:n.read?"transparent":"rgba(201,168,76,0.08)"}}>
                <div style={S.notifMsg}>{n.message}</div>
                <div style={S.notifMeta}>{n.from} • {n.time}</div>
              </div>
            ))
          }
        </div>
      )}

      {showProfile&&(
        <div style={S.notifDropdown}>
          <div style={S.notifHeader}>Profil</div>
          <div style={{padding:"12px 16px",color:"#ccc",fontSize:13}}>
            <div><b style={{color:"#fff"}}>{currentUser.name}</b></div>
            <div>{currentUser.email}</div><div>{currentUser.phone}</div><div>{currentUser.department}</div>
            <div style={{marginTop:4,color:"#c9a84c",textTransform:"uppercase",fontSize:11}}>{currentUser.role}</div>
          </div>
          <button style={{...S.btnDanger,margin:"0 16px 16px"}} onClick={onLogout}>Çıkış Yap</button>
        </div>
      )}

      {/* TABS */}
      <div style={S.tabs}>
        {[
          {key:"shift",label:"📅 Shift"},
          {key:"menu",label:"🍽️ Menü"},
          {key:"tasks",label:"✅ Görevler"},
          {key:"noshow",label:"🚫 No-Show"},
          ...(isAdmin?[{key:"members",label:"👥 Üyeler"},{key:"admin",label:"⚙️ Admin"}]:[]),
        ].map(t=>(
          <button key={t.key} style={{...S.tab,...(activeTab===t.key?S.tabActive:{})}}
            onClick={()=>{setActiveTab(t.key);setShowNotifs(false);setShowProfile(false);}}>
            {t.label}
            {t.key==="members"&&isAdmin&&memberAlertCount>0&&(
              <span style={{...S.badge,position:"relative",top:-1,right:-4,fontSize:10}}>{memberAlertCount}</span>
            )}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {activeTab==="shift"&&<ShiftTab {...props}/>}
        {activeTab==="menu"&&<MenuTab {...props}/>}
        {activeTab==="tasks"&&<TasksTab {...props}/>}
        {activeTab==="noshow"&&<NoShowTab {...props}/>}
        {activeTab==="members"&&isAdmin&&<MembersTab {...props}/> }
        {activeTab==="admin"&&isAdmin&&<AdminTab {...props}/>}
      </div>
    </div>
  );
}

// ===================== SHIFT TAB =====================
function ShiftTab({shifts,setShifts,users,isAdmin}) {
  const [weekOffset,setWeekOffset] = useState(0);
  const [selectedLetter,setSelectedLetter] = useState("A");
  const [selectedDept,setSelectedDept] = useState("Tumü");

  const getWeekDates=(offset=0)=>{
    const now=new Date(); const day=now.getDay();
    const monday=new Date(now);
    monday.setDate(now.getDate()-(day===0?6:day-1)+offset*7);
    return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});
  };
  const weekDates=getWeekDates(weekOffset);
  const weekKey=weekDates[0].toISOString().slice(0,10);
  const weekShifts=shifts[weekKey]||{};
  const setShift=(userId,dayIdx,val)=>{
    setShifts(prev=>({...prev,[weekKey]:{...prev[weekKey],[userId]:{...(prev[weekKey]?.[userId]||{}),[dayIdx]:val}}}));
  };
  const allApproved=users.filter(u=>u.approved&&u.role!=="superadmin");
  const activeDepts=DEPARTMENTS.filter(d=>allApproved.some(u=>u.department===d));
  const deptList=["Tumü",...activeDepts];
  const filteredUsers=selectedDept==="Tumü"?allApproved:allApproved.filter(u=>u.department===selectedDept);

  return (
    <div>
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>Shift Planlaması</h2>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button style={S.btnSmall} onClick={()=>setWeekOffset(p=>p-1)}>Önceki</button>
          <span style={{color:"#c9a84c",fontSize:13,minWidth:120,textAlign:"center"}}>
            {weekDates[0].toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})} - {weekDates[6].toLocaleDateString("tr-TR",{day:"2-digit",month:"short",year:"numeric"})}
          </span>
          <button style={S.btnSmall} onClick={()=>setWeekOffset(p=>p+1)}>Sonraki</button>
        </div>
      </div>
      <div style={S.deptFilterBar}>
        {deptList.map(d=>(
          <button key={d} onClick={()=>setSelectedDept(d)} style={{...S.deptFilterBtn,...(selectedDept===d?S.deptFilterBtnActive:{})}}>{d}</button>
        ))}
      </div>
      {isAdmin&&(
        <div style={S.shiftLegend}>
          {SHIFT_LETTERS.map(l=>(
            <button key={l} onClick={()=>setSelectedLetter(l)} style={{...S.shiftBadge,background:SHIFT_COLORS[l]||"#444",border:selectedLetter===l?"2px solid #fff":"2px solid transparent",opacity:selectedLetter===l?1:0.7}}>{l}</button>
          ))}
          <span style={{color:"#888",fontSize:12}}>Seçip hücreye tıkla</span>
        </div>
      )}
      {filteredUsers.length===0?<div style={S.menuEmpty}>Bu departmanda personel bulunmuyor.</div>:(
        <div style={{overflowX:"auto"}}>
          <table style={S.shiftTable}>
            <thead>
              <tr>
                <th style={S.shiftTh}>Personel</th>
                {weekDates.map((d,i)=>(
                  <th key={i} style={S.shiftTh}><div style={{fontSize:11,color:"#888"}}>{DAYS[i]}</div><div style={{fontSize:13}}>{d.getDate()}</div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u=>(
                <tr key={u.id}>
                  <td style={S.shiftTd}><div style={{fontWeight:600,color:"#fff",fontSize:13}}>{u.name}</div><div style={{fontSize:11,color:"#888"}}>{u.department}</div></td>
                  {weekDates.map((_,dayIdx)=>{
                    const val=weekShifts[u.id]?.[dayIdx]||"";
                    return (
                      <td key={dayIdx} style={S.shiftCell} onClick={()=>isAdmin&&setShift(u.id,dayIdx,selectedLetter)}>
                        {val&&<span style={{...S.shiftBadge,background:SHIFT_COLORS[val]||"#444",cursor:isAdmin?"pointer":"default"}}>{val}</span>}
                        {!val&&isAdmin&&<span style={S.shiftEmpty}>+</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===================== MENU TAB =====================
function MenuTab({menus,setMenus,isAdmin}) {
  const todayStr = new Date().toISOString().slice(0,10);
  const [selectedDate,setSelectedDate] = useState(todayStr);
  const [editMode,setEditMode] = useState(false);
  const [menuText,setMenuText] = useState("");
  const currentMenu = menus[selectedDate]||"";
  useEffect(()=>{ setMenuText(menus[selectedDate]||""); },[selectedDate,menus]);
  const saveMenu=()=>{ setMenus(prev=>({...prev,[selectedDate]:menuText})); setEditMode(false); };

  return (
    <div>
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>🍽️ Günlük Menü</h2>
        <input type="date" value={selectedDate} onChange={e=>{setSelectedDate(e.target.value);setEditMode(false);}} style={S.dateInput}/>
      </div>
      <div style={S.menuCard}>
        <div style={S.menuDateTitle}>{new Date(selectedDate+"T12:00:00").toLocaleDateString("tr-TR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        <div style={{borderBottom:"1px solid #2a2a2a",marginBottom:16}}/>
        {!editMode?(
          <>
            {currentMenu?<pre style={S.menuContent}>{currentMenu}</pre>:<div style={S.menuEmpty}>Bu tarih için menü girilmemiş.</div>}
            {isAdmin&&<button style={{...S.btnPrimary,marginTop:16}} onClick={()=>setEditMode(true)}>{currentMenu?"✏️ Düzenle":"➕ Menü Ekle"}</button>}
          </>
        ):(
          <>
            <textarea style={S.textarea} rows={12} value={menuText} onChange={e=>setMenuText(e.target.value)} placeholder={"Örnek:\nÇorba: Mercimek Çorbası\nAna Yemek: Fırın Tavuk\nYan: Pilav, Salata\nTatlı: Sütlaç"}/>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button style={S.btnPrimary} onClick={saveMenu}>💾 Kaydet</button>
              <button style={S.btnSecondary} onClick={()=>{setEditMode(false);setMenuText(currentMenu);}}>İptal</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===================== TASKS TAB =====================
function TasksTab({currentUser,taskDefs,setTaskDefs,taskLogs,setTaskLogs,taskNotes,setTaskNotes,addNotification,isAdmin}) {
  const [selectedDept,setSelectedDept] = useState(null);
  const [selectedDate,setSelectedDate] = useState(new Date().toISOString().slice(0,10));
  const [newTaskText,setNewTaskText] = useState("");
  const [noteInput,setNoteInput] = useState({});
  const [showNoteFor,setShowNoteFor] = useState(null);
  const logKey=(dept,date)=>`${dept}__${date}`;
  const toggleTask=(dept,taskId)=>{
    const key=logKey(dept,selectedDate);
    const existing=taskLogs[key]?.[taskId];
    if (existing) {
      setTaskLogs(prev=>{const updated={...prev[key]};delete updated[taskId];return{...prev,[key]:updated};});
    } else {
      setTaskLogs(prev=>({...prev,[key]:{...prev[key],[taskId]:{by:currentUser.name,time:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}}}));
    }
  };
  const addNote=(dept,taskId)=>{
    const text=noteInput[taskId];
    if (!text?.trim()) return;
    const key=logKey(dept,selectedDate);
    const note={text,by:currentUser.name,time:new Date().toLocaleString("tr-TR")};
    setTaskNotes(prev=>({...prev,[key]:{...(prev[key]||{}),[taskId]:[...((prev[key]?.[taskId])||[]),note]}}));
    addNotification(dept,`📌 ${dept} - Not: "${text}" (${currentUser.name})`,currentUser.name);
    setNoteInput(prev=>({...prev,[taskId]:""})); setShowNoteFor(null);
  };
  const addTask=(dept)=>{
    if (!newTaskText.trim()) return;
    setTaskDefs(prev=>({...prev,[dept]:[...(prev[dept]||[]),{id:`${dept}-${Date.now()}`,text:newTaskText,category:"Genel"}]}));
    setNewTaskText("");
  };
  const removeTask=(dept,taskId)=>{ setTaskDefs(prev=>({...prev,[dept]:prev[dept].filter(t=>t.id!==taskId)})); };

  if (!selectedDept) {
    return (
      <div>
        <div style={S.sectionHeader}>
          <h2 style={S.sectionTitle}>✅ Departman Görevleri</h2>
          <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={S.dateInput}/>
        </div>
        <div style={S.deptGrid}>
          {DEPARTMENTS.map(dept=>{
            const key=logKey(dept,selectedDate);
            const tasks=taskDefs[dept]||[];
            const done=Object.keys(taskLogs[key]||{}).length;
            const pct=tasks.length?Math.round((done/tasks.length)*100):0;
            return (
              <div key={dept} style={S.deptCard} onClick={()=>setSelectedDept(dept)}>
                <div style={S.deptName}>{dept}</div>
                <div style={S.deptProgress}><div style={{...S.deptBar,width:`${pct}%`}}/></div>
                <div style={S.deptMeta}>{done}/{tasks.length} tamamlandı · %{pct}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const key=logKey(selectedDept,selectedDate);
  const tasks=taskDefs[selectedDept]||[];
  const logs=taskLogs[key]||{};
  const notes=taskNotes[key]||{};

  return (
    <div>
      <div style={S.sectionHeader}>
        <button style={S.btnSmall} onClick={()=>setSelectedDept(null)}>← Geri</button>
        <h2 style={S.sectionTitle}>{selectedDept}</h2>
        <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={S.dateInput}/>
      </div>
      {isAdmin&&(
        <div style={{marginBottom:16,display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...S.input,flex:1,width:"auto",minWidth:0}} value={newTaskText} onChange={e=>setNewTaskText(e.target.value)} placeholder="Yeni görev ekle..." onKeyDown={e=>e.key==="Enter"&&addTask(selectedDept)}/>
          <button style={{...S.btnPrimary,width:"auto",padding:"10px 18px",flexShrink:0}} onClick={()=>addTask(selectedDept)}>+ Ekle</button>
        </div>
      )}
      <div style={S.taskList}>
        {tasks.map(task=>{
          const log=logs[task.id];
          const taskNoteList=notes[task.id]||[];
          return (
            <div key={task.id} style={S.taskItem}>
              <div style={S.taskRow}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,flex:1}}>
                  <div style={{...S.checkbox,background:log?"#c9a84c":"transparent"}} onClick={()=>toggleTask(selectedDept,task.id)}>{log&&"✓"}</div>
                  <div>
                    <div style={{...S.taskText,textDecoration:log?"line-through":"none",color:log?"#666":"#ddd"}}>{task.text}</div>
                    {log&&<div style={S.taskMeta}>✓ {log.by} • {log.time}</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={S.noteBtn} onClick={()=>setShowNoteFor(showNoteFor===task.id?null:task.id)}>📝 Not</button>
                  {isAdmin&&<button style={S.deleteBtn} onClick={()=>removeTask(selectedDept,task.id)}>🗑</button>}
                </div>
              </div>
              {taskNoteList.length>0&&(
                <div style={S.noteList}>
                  {taskNoteList.map((n,i)=>(
                    <div key={i} style={S.noteItem}>
                      <span style={S.noteText}>"{n.text}"</span>
                      <span style={S.noteMeta}> — {n.by}, {n.time}</span>
                    </div>
                  ))}
                </div>
              )}
              {showNoteFor===task.id&&(
                <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                  <input style={{...S.input,flex:1,width:"auto",minWidth:0}} value={noteInput[task.id]||""} onChange={e=>setNoteInput(prev=>({...prev,[task.id]:e.target.value}))} placeholder="Not girin..." onKeyDown={e=>e.key==="Enter"&&addNote(selectedDept,task.id)}/>
                  <button style={{...S.btnPrimary,width:"auto",padding:"10px 18px",flexShrink:0}} onClick={()=>addNote(selectedDept,task.id)}>Gönder</button>
                </div>
              )}
            </div>
          );
        })}
        {tasks.length===0&&<div style={S.menuEmpty}>Henüz görev eklenmemiş.</div>}
      </div>
    </div>
  );
}

// ===================== MEMBERS TAB =====================
function MembersTab({members,setMembers}) {
  const [showForm,setShowForm] = useState(false);
  const [search,setSearch] = useState("");
  const [filterType,setFilterType] = useState("Tümü");
  const [filterStatus,setFilterStatus] = useState("Tümü");
  const [editingId,setEditingId] = useState(null);
  const [form,setForm] = useState({
    name:"",email:"",phone:"",membershipType:MEMBERSHIP_TYPES[0],
    startDate:"",endDate:"",notes:"",
  });
  const [formError,setFormError] = useState("");

  const todayStr = today();

  const resetForm = () => {
    setForm({name:"",email:"",phone:"",membershipType:MEMBERSHIP_TYPES[0],startDate:"",endDate:"",notes:""});
    setFormError(""); setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (m) => {
    setForm({name:m.name,email:m.email,phone:m.phone,membershipType:m.membershipType,startDate:m.startDate,endDate:m.endDate,notes:m.notes||""});
    setEditingId(m.id); setShowForm(true); setFormError("");
  };

  const handleSave = () => {
    if (!form.name||!form.phone||!form.startDate||!form.endDate) return setFormError("Ad, telefon, başlangıç ve bitiş tarihi zorunludur.");
    if (form.endDate<form.startDate) return setFormError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
    if (editingId) {
      setMembers(prev=>prev.map(m=>m.id===editingId?{...m,...form}:m));
    } else {
      setMembers(prev=>[...prev,{id:Date.now().toString(),...form,createdAt:todayStr}]);
    }
    setShowForm(false); resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("Bu üyeyi silmek istediğinize emin misiniz?")) {
      setMembers(prev=>prev.filter(m=>m.id!==id));
    }
  };

  const getMemberStatus = (m) => {
    if (isExpired(m.endDate)) return "expired";
    if (isExpiringSoon(m.endDate)) return "soon";
    return "active";
  };

  const getDaysRemaining = (endDate) => {
    const diff = Math.ceil((new Date(endDate) - new Date(todayStr)) / (1000*60*60*24));
    return diff;
  };

  // Stats
  const totalMembers = members.length;
  const activeMembers = members.filter(m=>!isExpired(m.endDate)).length;
  const expiredMembers = members.filter(m=>isExpired(m.endDate)).length;
  const soonMembers = members.filter(m=>isExpiringSoon(m.endDate)).length;

  // Filtered
  let filtered = members.filter(m=>{
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search) || (m.email||"").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType==="Tümü" || m.membershipType===filterType;
    const status = getMemberStatus(m);
    const matchStatus = filterStatus==="Tümü" || (filterStatus==="Aktif"&&status==="active") || (filterStatus==="Süresi Dolan"&&status==="expired") || (filterStatus==="Yakında Bitiyor"&&status==="soon");
    return matchSearch && matchType && matchStatus;
  }).sort((a,b)=>a.endDate>b.endDate?1:-1);

  const statusColors = {active:"#2d6a4f",soon:"#c77d00",expired:"#7b1d1d"};
  const statusLabels = {active:"Aktif",soon:"Yakında Bitiyor",expired:"Süresi Dolmuş"};
  const statusTextColors = {active:"#6dff9e",soon:"#f4a261",expired:"#ff8080"};

  return (
    <div>
      {/* HEADER */}
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>👥 Üye Takip</h2>
        <button style={{...S.btnPrimary,width:"auto",padding:"9px 20px"}} onClick={showForm&&!editingId?()=>{setShowForm(false);resetForm();}:openAdd}>
          {showForm&&!editingId?"✕ İptal":"➕ Üye Ekle"}
        </button>
      </div>

      {/* STATS ROW */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginBottom:24}}>
        {[
          {label:"Toplam Üye",value:totalMembers,color:"#c9a84c",icon:"👥"},
          {label:"Aktif",value:activeMembers,color:"#6dff9e",icon:"✅"},
          {label:"Yakında Bitiyor",value:soonMembers,color:"#f4a261",icon:"⚠️"},
          {label:"Süresi Dolmuş",value:expiredMembers,color:"#ff8080",icon:"🔴"},
        ].map(stat=>(
          <div key={stat.label} style={{background:"#161616",border:"1px solid #2a2a2a",borderRadius:12,padding:"16px 18px",textAlign:"center"}}>
            <div style={{fontSize:22}}>{stat.icon}</div>
            <div style={{fontSize:26,fontWeight:900,color:stat.color,lineHeight:1.2}}>{stat.value}</div>
            <div style={{fontSize:11,color:"#666",marginTop:4}}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT FORM */}
      {showForm&&(
        <div style={{...S.addUserForm,marginBottom:24}}>
          <div style={{color:"#c9a84c",fontWeight:700,fontSize:15,marginBottom:16}}>
            {editingId?"✏️ Üye Düzenle":"➕ Yeni Üye Ekle"}
          </div>
          {formError&&<div style={S.errorBox}>{formError}</div>}
          <div style={S.addUserGrid}>
            <div style={S.formGroup}>
              <label style={S.label}>Ad Soyad *</label>
              <input style={S.input} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Ad Soyad"/>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Telefon *</label>
              <input style={S.input} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+90 555 000 0000"/>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>E-posta</label>
              <input style={S.input} type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="ornek@mail.com"/>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Üyelik Tipi</label>
              <select style={S.input} value={form.membershipType} onChange={e=>setForm(p=>({...p,membershipType:e.target.value}))}>
                {MEMBERSHIP_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Başlangıç Tarihi *</label>
              <input style={S.input} type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))}/>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Bitiş Tarihi *</label>
              <input style={S.input} type="date" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))}/>
            </div>
            <div style={{...S.formGroup,gridColumn:"1/-1"}}>
              <label style={S.label}>Notlar</label>
              <input style={S.input} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Opsiyonel notlar..."/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <button style={{...S.btnPrimary,flex:1}} onClick={handleSave}>
              {editingId?"💾 Güncelle":"✓ Kaydet"}
            </button>
            <button style={{...S.btnSecondary}} onClick={()=>{setShowForm(false);resetForm();}}>İptal</button>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        <input
          style={{...S.input,flex:1,minWidth:180,maxWidth:280}}
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 İsim, telefon veya e-posta ara..."
        />
        <select style={{...S.input,width:"auto"}} value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option>Tümü</option>
          {MEMBERSHIP_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select style={{...S.input,width:"auto"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          {["Tümü","Aktif","Yakında Bitiyor","Süresi Dolan"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {/* MEMBER LIST */}
      {filtered.length===0?(
        <div style={S.menuEmpty}>Üye bulunamadı.</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(m=>{
            const status = getMemberStatus(m);
            const daysLeft = getDaysRemaining(m.endDate);
            const isExp = status==="expired";
            const isSoon = status==="soon";
            return (
              <div key={m.id} style={{
                background: isExp?"rgba(123,29,29,0.35)":"#161616",
                border: isExp?"1px solid #7b1d1d": isSoon?"1px solid #c77d00":"1px solid #2a2a2a",
                borderRadius:12,
                padding:"16px 18px",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                flexWrap:"wrap",
                gap:12,
                transition:"all 0.2s",
              }}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                    <div style={{fontWeight:700,color:isExp?"#ff8080":"#fff",fontSize:15}}>{m.name}</div>
                    <span style={{
                      padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                      background:statusColors[status],color:statusTextColors[status],
                    }}>{statusLabels[status]}</span>
                    <span style={{padding:"2px 10px",borderRadius:20,fontSize:11,background:"#1a1a1a",color:"#c9a84c",border:"1px solid #2a2a2a"}}>
                      {m.membershipType}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:"#888",display:"flex",flexWrap:"wrap",gap:"4px 16px"}}>
                    <span>📞 {m.phone}</span>
                    {m.email&&<span>✉️ {m.email}</span>}
                    <span>📅 {m.startDate} → {m.endDate}</span>
                    {!isExp&&<span style={{color:isSoon?"#f4a261":"#6dff9e"}}>
                      {isSoon?`⚠️ ${daysLeft} gün kaldı`:`✅ ${daysLeft} gün kaldı`}
                    </span>}
                    {isExp&&<span style={{color:"#ff8080"}}>🔴 {Math.abs(daysLeft)} gün önce doldu</span>}
                  </div>
                  {m.notes&&<div style={{fontSize:12,color:"#666",marginTop:4,fontStyle:"italic"}}>"{m.notes}"</div>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={S.btnSmall} onClick={()=>{openEdit(m);setShowForm(true);}}>✏️ Düzenle</button>
                  <button style={S.btnDanger} onClick={()=>handleDelete(m.id)}>🗑 Sil</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== ADMIN TAB =====================
function AdminTab({users,setUsers,isSuperAdmin}) {
  const [tab,setTab] = useState("users");
  const [showAddForm,setShowAddForm] = useState(false);
  const [newUser,setNewUser] = useState({name:"",email:"",password:"",phone:"",department:DEPARTMENTS[0],role:"user"});
  const [addError,setAddError] = useState("");
  const [addSuccess,setAddSuccess] = useState("");

  const pendingUsers=users.filter(u=>!u.approved&&u.role!=="superadmin");
  const allUsers=users.filter(u=>u.role!=="superadmin");
  const approveUser=(id)=>setUsers(prev=>prev.map(u=>u.id===id?{...u,approved:true}:u));
  const rejectUser=(id)=>setUsers(prev=>prev.filter(u=>u.id!==id));
  const deleteUser=(id)=>{ if(window.confirm("Silmek istediğinize emin misiniz?")) setUsers(prev=>prev.filter(u=>u.id!==id)); };
  const promoteToAdmin=(id)=>setUsers(prev=>prev.map(u=>u.id===id?{...u,role:"admin"}:u));
  const demoteToUser=(id)=>setUsers(prev=>prev.map(u=>u.id===id?{...u,role:"user"}:u));
  const handleAddUser=()=>{
    setAddError("");
    if (!newUser.name||!newUser.email||!newUser.password||!newUser.phone) return setAddError("Tüm alanları doldurunuz.");
    if (users.find(u=>u.email===newUser.email)) return setAddError("Bu e-posta zaten kayıtlı.");
    setUsers(prev=>[...prev,{id:Date.now().toString(),...newUser,approved:true}]);
    setAddSuccess(`${newUser.name} başarıyla eklendi!`);
    setNewUser({name:"",email:"",password:"",phone:"",department:DEPARTMENTS[0],role:"user"});
    setTimeout(()=>{setAddSuccess("");setShowAddForm(false);},2000);
  };

  return (
    <div>
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>⚙️ Yönetim Paneli</h2>
        <button style={{...S.btnPrimary,width:"auto",padding:"8px 18px"}} onClick={()=>{setShowAddForm(!showAddForm);setAddError("");setAddSuccess("");}}>
          {showAddForm?"✕ İptal":"➕ Kullanıcı Ekle"}
        </button>
      </div>
      {showAddForm&&(
        <div style={S.addUserForm}>
          <div style={{color:"#c9a84c",fontWeight:700,fontSize:15,marginBottom:16}}>Yeni Kullanıcı Ekle</div>
          {addError&&<div style={S.errorBox}>{addError}</div>}
          {addSuccess&&<div style={S.successBox}>{addSuccess}</div>}
          <div style={S.addUserGrid}>
            <div style={S.formGroup}><label style={S.label}>Ad Soyad *</label><input style={S.input} value={newUser.name} onChange={e=>setNewUser(p=>({...p,name:e.target.value}))} placeholder="Ad Soyad"/></div>
            <div style={S.formGroup}><label style={S.label}>E-posta *</label><input style={S.input} type="email" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))} placeholder="ornek@caryagolf.com"/></div>
            <div style={S.formGroup}><label style={S.label}>Şifre *</label><input style={S.input} value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))} placeholder="Geçici şifre"/></div>
            <div style={S.formGroup}><label style={S.label}>Telefon *</label><input style={S.input} value={newUser.phone} onChange={e=>setNewUser(p=>({...p,phone:e.target.value}))} placeholder="+90 555 000 0000"/></div>
            <div style={S.formGroup}><label style={S.label}>Departman</label><select style={S.input} value={newUser.department} onChange={e=>setNewUser(p=>({...p,department:e.target.value}))}>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div>
            <div style={S.formGroup}><label style={S.label}>Rol</label><select style={S.input} value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))}><option value="user">Kullanıcı</option><option value="admin">Admin</option></select></div>
          </div>
          <button style={{...S.btnPrimary,marginTop:8}} onClick={handleAddUser}>✓ Kullanıcıyı Kaydet</button>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginBottom:20,marginTop:16}}>
        <button style={{...S.btnSmall,...(tab==="users"?{background:"#c9a84c",color:"#111"}:{})}} onClick={()=>setTab("users")}>Tüm Kullanıcılar ({allUsers.length})</button>
        <button style={{...S.btnSmall,...(tab==="pending"?{background:"#c9a84c",color:"#111"}:{})}} onClick={()=>setTab("pending")}>Bekleyen{pendingUsers.length>0?` (${pendingUsers.length})`:""}</button>
      </div>
      {tab==="pending"&&(
        pendingUsers.length===0?<div style={S.menuEmpty}>Bekleyen kayıt yok.</div>:
        pendingUsers.map(u=>(
          <div key={u.id} style={S.userCard}>
            <div><div style={S.userName}>{u.name}</div><div style={S.userMeta}>{u.email} • {u.phone}</div><div style={S.userMeta}>{u.department}</div></div>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnApprove} onClick={()=>approveUser(u.id)}>✓ Onayla</button>
              <button style={S.btnDanger} onClick={()=>rejectUser(u.id)}>✕ Reddet</button>
            </div>
          </div>
        ))
      )}
      {tab==="users"&&(
        allUsers.length===0?<div style={S.menuEmpty}>Henüz kullanıcı yok.</div>:
        allUsers.map(u=>(
          <div key={u.id} style={S.userCard}>
            <div>
              <div style={S.userName}>{u.name}{!u.approved&&<span style={{color:"#f4a261",fontSize:11}}> (Onay Bekleniyor)</span>}</div>
              <div style={S.userMeta}>{u.email} • {u.phone}</div>
              <div style={S.userMeta}>{u.department} • <span style={{color:"#c9a84c"}}>{u.role.toUpperCase()}</span></div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {isSuperAdmin&&u.role==="user"&&<button style={S.btnSmall} onClick={()=>promoteToAdmin(u.id)}>Admin Yap</button>}
              {isSuperAdmin&&u.role==="admin"&&<button style={S.btnSmall} onClick={()=>demoteToUser(u.id)}>Admin Kaldır</button>}
              {!u.approved&&<button style={S.btnApprove} onClick={()=>approveUser(u.id)}>Onayla</button>}
              {isSuperAdmin&&<button style={S.btnDanger} onClick={()=>deleteUser(u.id)}>🗑 Sil</button>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}


// ===================== NO-SHOW TAB =====================
function NoShowTab({currentUser,noShows,setNoShows,addNotification}) {
  const todayStr = new Date().toISOString().slice(0,10);
  const [date,setDate] = useState(todayStr);
  const [playerName,setPlayerName] = useState("");
  const [note,setNote] = useState("");
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [filterDate,setFilterDate] = useState("");

  const handleAdd = () => {
    if (!playerName.trim()) return setError("Oyuncu adı zorunludur.");
    const entry = {
      id: Date.now().toString(),
      date,
      playerName: playerName.trim(),
      note: note.trim(),
      reportedBy: currentUser.name,
      reportedAt: new Date().toLocaleString("tr-TR"),
    };
    setNoShows(prev=>[entry,...prev]);
    addNotification("Resepsiyon",`🚫 No-Show: ${playerName.trim()} (${date}) - ${note.trim()||"Not yok"}`,currentUser.name);
    setPlayerName(""); setNote(""); setError("");
    setSuccess(`${playerName.trim()} rezervasyon departmanına bildirildi.`);
    setTimeout(()=>setSuccess(""),3000);
  };

  const handleDelete = (id) => {
    setNoShows(prev=>prev.filter(n=>n.id!==id));
  };

  const filtered = filterDate
    ? noShows.filter(n=>n.date===filterDate)
    : noShows;

  return (
    <div>
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>🚫 No-Show Bildirimi</h2>
      </div>

      {/* FORM */}
      <div style={{background:"#161616",border:"1px solid #c9a84c33",borderRadius:14,padding:20,marginBottom:24}}>
        <div style={{color:"#c9a84c",fontWeight:700,fontSize:14,marginBottom:16}}>Yeni No-Show Kaydı</div>
        {error&&<div style={S.errorBox}>{error}</div>}
        {success&&<div style={S.successBox}>{success}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:12}}>
          <div style={S.formGroup}>
            <label style={S.label}>Tarih</label>
            <input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Oyuncu Adı *</label>
            <input style={S.input} value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="Ad Soyad" onKeyDown={e=>e.key==="Enter"&&handleAdd()}/>
          </div>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Not</label>
          <input style={S.input} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ek bilgi (opsiyonel)..." onKeyDown={e=>e.key==="Enter"&&handleAdd()}/>
        </div>
        <button style={{...S.btnPrimary,width:"auto",padding:"10px 24px"}} onClick={handleAdd}>
          📨 Rezervasyon Departmanına Bildir
        </button>
      </div>

      {/* LIST */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <span style={{color:"#888",fontSize:13}}>Tarih filtrele:</span>
        <input style={{...S.dateInput}} type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
        {filterDate&&<button style={S.btnSmall} onClick={()=>setFilterDate("")}>✕ Temizle</button>}
        <span style={{color:"#666",fontSize:12,marginLeft:"auto"}}>{filtered.length} kayıt</span>
      </div>

      {filtered.length===0?(
        <div style={S.menuEmpty}>No-show kaydı bulunamadı.</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(n=>(
            <div key={n.id} style={{background:"#161616",border:"1px solid #2a2a2a",borderRadius:12,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,color:"#fff",fontSize:15}}>🚫 {n.playerName}</span>
                  <span style={{background:"#2a1a1a",color:"#ff8080",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>No-Show</span>
                  <span style={{color:"#c9a84c",fontSize:12}}>📅 {n.date}</span>
                </div>
                {n.note&&<div style={{color:"#aaa",fontSize:13,marginBottom:4}}>📝 {n.note}</div>}
                <div style={{color:"#555",fontSize:11}}>Bildiren: {n.reportedBy} • {n.reportedAt}</div>
              </div>
              <button style={S.btnDanger} onClick={()=>handleDelete(n.id)}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== STYLES =====================
const S = {
  authBg:{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a0a 0%,#111 50%,#0d1a0d 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Georgia',serif"},
  authCard:{background:"#161616",border:"1px solid #2a2a2a",borderRadius:16,padding:"40px 36px",width:"100%",maxWidth:420,boxShadow:"0 24px 60px rgba(0,0,0,0.6)"},
  authLogo:{display:"flex",alignItems:"center",gap:14,marginBottom:32,justifyContent:"center"},
  logoTitle:{fontSize:22,fontWeight:900,color:"#c9a84c",letterSpacing:4,fontFamily:"Georgia,serif"},
  logoSub:{fontSize:10,color:"#888",letterSpacing:3,textTransform:"uppercase"},
  authTabs:{display:"flex",gap:0,marginBottom:24,borderRadius:8,overflow:"hidden",border:"1px solid #2a2a2a"},
  authTab:{flex:1,padding:"10px",background:"transparent",color:"#888",border:"none",cursor:"pointer",fontSize:14,fontFamily:"Georgia,serif"},
  authTabActive:{background:"#c9a84c",color:"#111",fontWeight:700},
  formGroup:{marginBottom:16},
  label:{display:"block",color:"#888",fontSize:12,marginBottom:6,textTransform:"uppercase",letterSpacing:1},
  input:{width:"100%",padding:"10px 14px",background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:8,color:"#fff",fontSize:14,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"},
  btnPrimary:{width:"100%",padding:"12px",background:"#c9a84c",color:"#111",border:"none",borderRadius:8,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"Georgia,serif"},
  btnSecondary:{padding:"10px 16px",background:"#2a2a2a",color:"#ccc",border:"none",borderRadius:8,cursor:"pointer",fontSize:13},
  btnLink:{width:"100%",padding:"10px",background:"transparent",color:"#888",border:"none",cursor:"pointer",fontSize:13,marginTop:8},
  btnDanger:{padding:"8px 14px",background:"#7b1d1d",color:"#ff8080",border:"none",borderRadius:6,cursor:"pointer",fontSize:12},
  btnApprove:{padding:"8px 14px",background:"#1d4d2a",color:"#6dff9e",border:"none",borderRadius:6,cursor:"pointer",fontSize:12},
  btnSmall:{padding:"7px 14px",background:"#2a2a2a",color:"#ccc",border:"none",borderRadius:6,cursor:"pointer",fontSize:12},
  errorBox:{background:"#3a0d0d",border:"1px solid #7b1d1d",borderRadius:8,padding:"10px 14px",color:"#ff8080",fontSize:13,marginBottom:16},
  successBox:{background:"#0d3a1a",border:"1px solid #1d6b3a",borderRadius:8,padding:"10px 14px",color:"#6dff9e",fontSize:13,marginBottom:16},
  appContainer:{minHeight:"100vh",background:"#0d0d0d",fontFamily:"Georgia,serif",color:"#fff"},
  header:{background:"#111",borderBottom:"1px solid #1e1e1e",padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100},
  headerLeft:{display:"flex",alignItems:"center",gap:12},
  headerTitle:{fontSize:16,fontWeight:900,color:"#c9a84c",letterSpacing:2},
  headerSub:{fontSize:9,color:"#555",letterSpacing:2,textTransform:"uppercase"},
  headerRight:{display:"flex",gap:8,alignItems:"center"},
  iconBtn:{background:"transparent",border:"1px solid #2a2a2a",color:"#ccc",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:14,position:"relative"},
  badge:{position:"absolute",top:-4,right:-4,background:"#e76f51",color:"#fff",borderRadius:"50%",fontSize:10,padding:"0 5px",minWidth:16,textAlign:"center"},
  notifDropdown:{position:"absolute",top:60,right:16,width:320,background:"#161616",border:"1px solid #2a2a2a",borderRadius:12,zIndex:200,maxHeight:400,overflowY:"auto",boxShadow:"0 16px 40px rgba(0,0,0,0.5)"},
  notifHeader:{padding:"14px 16px",borderBottom:"1px solid #2a2a2a",color:"#c9a84c",fontWeight:700,fontSize:13},
  notifEmpty:{padding:20,color:"#555",textAlign:"center",fontSize:13},
  notifItem:{padding:"12px 16px",borderBottom:"1px solid #1a1a1a"},
  notifMsg:{color:"#ddd",fontSize:13},
  notifMeta:{color:"#666",fontSize:11,marginTop:4},
  tabs:{display:"flex",background:"#111",borderBottom:"1px solid #1e1e1e",padding:"0 12px",overflowX:"auto"},
  tab:{padding:"14px 20px",background:"transparent",border:"none",color:"#666",cursor:"pointer",fontSize:13,fontFamily:"Georgia,serif",whiteSpace:"nowrap",borderBottom:"2px solid transparent",position:"relative"},
  tabActive:{color:"#c9a84c",borderBottom:"2px solid #c9a84c"},
  content:{padding:"24px 20px",maxWidth:1100,margin:"0 auto"},
  sectionHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12},
  sectionTitle:{color:"#c9a84c",fontSize:20,fontWeight:700,margin:0},
  dateInput:{padding:"8px 12px",background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:8,color:"#fff",fontSize:13},
  shiftLegend:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"},
  shiftTable:{width:"100%",borderCollapse:"collapse",minWidth:600},
  shiftTh:{padding:"10px 8px",background:"#161616",color:"#888",fontSize:12,textAlign:"center",border:"1px solid #1e1e1e",fontWeight:600},
  shiftTd:{padding:"10px 12px",border:"1px solid #1e1e1e",background:"#111"},
  shiftCell:{padding:"8px",border:"1px solid #1e1e1e",textAlign:"center",cursor:"pointer",background:"#111",transition:"background 0.15s"},
  shiftBadge:{display:"inline-block",padding:"4px 10px",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",minWidth:32,textAlign:"center"},
  shiftEmpty:{color:"#333",fontSize:18},
  menuCard:{background:"#161616",border:"1px solid #2a2a2a",borderRadius:16,padding:28},
  menuDateTitle:{color:"#c9a84c",fontSize:18,fontWeight:700,marginBottom:16,textTransform:"capitalize"},
  menuContent:{color:"#ddd",fontSize:15,lineHeight:1.8,fontFamily:"Georgia,serif",whiteSpace:"pre-wrap"},
  menuEmpty:{color:"#555",textAlign:"center",padding:40,fontSize:14},
  textarea:{width:"100%",padding:"12px 14px",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,color:"#ddd",fontSize:14,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"},
  deptGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16},
  deptCard:{background:"#161616",border:"1px solid #2a2a2a",borderRadius:14,padding:20,cursor:"pointer",transition:"border-color 0.2s"},
  deptName:{color:"#fff",fontWeight:700,fontSize:15,marginBottom:12},
  deptProgress:{background:"#2a2a2a",borderRadius:4,height:6,marginBottom:8},
  deptBar:{background:"#c9a84c",height:6,borderRadius:4,transition:"width 0.3s"},
  deptMeta:{color:"#666",fontSize:12},
  taskList:{display:"flex",flexDirection:"column",gap:12},
  taskItem:{background:"#161616",border:"1px solid #2a2a2a",borderRadius:12,padding:16},
  taskRow:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12},
  checkbox:{width:22,height:22,border:"2px solid #c9a84c",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#111",fontWeight:900,fontSize:13,flexShrink:0,transition:"background 0.2s"},
  taskText:{fontSize:14,lineHeight:1.5,transition:"all 0.2s"},
  taskMeta:{color:"#c9a84c",fontSize:11,marginTop:4},
  noteBtn:{padding:"6px 10px",background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:6,color:"#888",cursor:"pointer",fontSize:12,whiteSpace:"nowrap"},
  deleteBtn:{padding:"6px 10px",background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:6,color:"#e76f51",cursor:"pointer",fontSize:12},
  noteList:{marginTop:10,paddingTop:10,borderTop:"1px solid #1e1e1e"},
  noteItem:{padding:"6px 0",fontSize:13},
  noteText:{color:"#aaa"},
  noteMeta:{color:"#555"},
  userCard:{background:"#161616",border:"1px solid #2a2a2a",borderRadius:12,padding:16,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12},
  userName:{color:"#fff",fontWeight:700,fontSize:15,marginBottom:4},
  userMeta:{color:"#888",fontSize:12},
  addUserForm:{background:"#161616",border:"1px solid #c9a84c33",borderRadius:14,padding:24,marginBottom:20},
  addUserGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12},
  deptFilterBar:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,padding:"12px 0"},
  deptFilterBtn:{padding:"7px 14px",background:"#1e1e1e",border:"1px solid #2a2a2a",borderRadius:20,color:"#888",cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif",whiteSpace:"nowrap",transition:"all 0.15s"},
  deptFilterBtnActive:{background:"#c9a84c",color:"#111",border:"1px solid #c9a84c",fontWeight:700},
};
