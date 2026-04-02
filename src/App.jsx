import { useState, useEffect, useCallback } from "react";

// ===================== CONSTANTS =====================
const SUPER_ADMIN_EMAIL = "superadmin@caryagolf.com";
const SUPER_ADMIN_PASSWORD = "Carya2024!";

const DEPARTMENTS = [
  "Resepsiyon",
  "Restoran",
  "Mutfak",
  "Bahçe & Saha",
  "Güvenlik",
  "Housekeeping",
  "Pro Shop",
  "Spa & Wellness",
  "Teknik Servis",
  "İnsan Kaynakları",
];

const SHIFT_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "İzin", "OFF"];
const SHIFT_COLORS = {
  A: "#2d6a4f", B: "#1e6091", C: "#7b2d8b", D: "#c77dff",
  E: "#f4a261", F: "#e76f51", G: "#2a9d8f", H: "#e9c46a",
  İzin: "#6c757d", OFF: "#343a40",
};

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAYS_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// ===================== INITIAL DATA =====================
const INITIAL_USERS = [
  {
    id: "super1",
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    name: "Süper Admin",
    phone: "+90 555 000 0000",
    role: "superadmin",
    department: "Yönetim",
    approved: true,
    notifications: [],
  },
];

const INITIAL_TASKS = {};
DEPARTMENTS.forEach((dept) => {
  INITIAL_TASKS[dept] = [
    { id: `${dept}-1`, text: "Açılış kontrolü yapıldı", category: "Açılış" },
    { id: `${dept}-2`, text: "Ekipman kontrolü tamamlandı", category: "Güvenlik" },
    { id: `${dept}-3`, text: "Günlük rapor hazırlandı", category: "Raporlama" },
  ];
});

// ===================== STORAGE HELPERS =====================
const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};
const load = (key, def) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
};

// ===================== MAIN APP =====================
export default function App() {
  const [users, setUsers] = useState(() => load("cg_users", INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState(() => load("cg_current", null));
  const [page, setPage] = useState("login");
  const [activeTab, setActiveTab] = useState("shift");
  const [shifts, setShifts] = useState(() => load("cg_shifts", {}));
  const [menus, setMenus] = useState(() => load("cg_menus", {}));
  const [taskDefs, setTaskDefs] = useState(() => load("cg_taskdefs", INITIAL_TASKS));
  const [taskLogs, setTaskLogs] = useState(() => load("cg_tasklogs", {}));
  const [taskNotes, setTaskNotes] = useState(() => load("cg_tasknotes", {}));
  const [notifications, setNotifications] = useState(() => load("cg_notifs", {}));

  useEffect(() => { save("cg_users", users); }, [users]);
  useEffect(() => { save("cg_current", currentUser); }, [currentUser]);
  useEffect(() => { save("cg_shifts", shifts); }, [shifts]);
  useEffect(() => { save("cg_menus", menus); }, [menus]);
  useEffect(() => { save("cg_taskdefs", taskDefs); }, [taskDefs]);
  useEffect(() => { save("cg_tasklogs", taskLogs); }, [taskLogs]);
  useEffect(() => { save("cg_tasknotes", taskNotes); }, [taskNotes]);
  useEffect(() => { save("cg_notifs", notifications); }, [notifications]);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isSuperAdmin = currentUser?.role === "superadmin";

  const addNotification = useCallback((deptOrAll, message, fromUser) => {
    const notif = {
      id: Date.now() + Math.random(),
      message,
      from: fromUser,
      time: new Date().toLocaleString("tr-TR"),
      read: false,
    };
    setNotifications((prev) => {
      const updated = { ...prev };
      users.forEach((u) => {
        if (deptOrAll === "all" || u.department === deptOrAll || u.role === "admin" || u.role === "superadmin") {
          updated[u.id] = [...(updated[u.id] || []), notif];
        }
      });
      return updated;
    });
  }, [users]);

  const myNotifications = currentUser ? (notifications[currentUser.id] || []) : [];
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const markNotifRead = () => {
    if (!currentUser) return;
    setNotifications((prev) => ({
      ...prev,
      [currentUser.id]: (prev[currentUser.id] || []).map((n) => ({ ...n, read: true })),
    }));
  };

  if (!currentUser || page === "login") {
    return (
      <AuthScreen
        users={users}
        setUsers={setUsers}
        onLogin={(u) => { setCurrentUser(u); setPage("app"); }}
      />
    );
  }

  return (
    <MainApp
      currentUser={currentUser}
      users={users}
      setUsers={setUsers}
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      shifts={shifts}
      setShifts={setShifts}
      menus={menus}
      setMenus={setMenus}
      taskDefs={taskDefs}
      setTaskDefs={setTaskDefs}
      taskLogs={taskLogs}
      setTaskLogs={setTaskLogs}
      taskNotes={taskNotes}
      setTaskNotes={setTaskNotes}
      myNotifications={myNotifications}
      unreadCount={unreadCount}
      markNotifRead={markNotifRead}
      addNotification={addNotification}
      onLogout={() => { setCurrentUser(null); setPage("login"); }}
    />
  );
}

// ===================== AUTH SCREEN =====================
function AuthScreen({ users, setUsers, onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = () => {
    const u = users.find((u) => u.email === email && u.password === password);
    if (!u) return setError("E-posta veya şifre hatalı.");
    if (!u.approved) return setError("Hesabınız henüz onaylanmamış. Admin onayı bekleniyor.");
    setError("");
    onLogin(u);
  };

  const handleRegister = () => {
    if (!name || !email || !password || !phone) return setError("Tüm alanları doldurunuz.");
    if (users.find((u) => u.email === email)) return setError("Bu e-posta zaten kayıtlı.");
    const newUser = {
      id: Date.now().toString(),
      email, password, name, phone, department,
      role: "user", approved: false, notifications: [],
    };
    setUsers((prev) => [...prev, newUser]);
    setSuccess("Kaydınız alındı. Admin onayı bekleniyor.");
    setMode("login");
    setError("");
  };

  const handleReset = () => {
    const u = users.find((u) => u.email === resetEmail);
    if (!u) return setError("Bu e-posta kayıtlı değil.");
    setSuccess(`Şifre sıfırlama bağlantısı ${resetEmail} adresine gönderildi. (Demo: Mevcut şifreniz: ${u.password})`);
    setResetMode(false);
    setError("");
  };

  return (
    <div style={styles.authBg}>
      <div style={styles.authCard}>
        <div style={styles.authLogo}>
          <span style={styles.logoIcon}>⛳</span>
          <div>
            <div style={styles.logoTitle}>CARYA</div>
            <div style={styles.logoSub}>GOLF KULÜBÜ</div>
          </div>
        </div>

        {!resetMode ? (
          <>
            <div style={styles.authTabs}>
              <button style={{ ...styles.authTab, ...(mode === "login" ? styles.authTabActive : {}) }} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Giriş Yap</button>
              <button style={{ ...styles.authTab, ...(mode === "register" ? styles.authTabActive : {}) }} onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>Kayıt Ol</button>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}
            {success && <div style={styles.successBox}>{success}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>E-posta</label>
              <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@caryagolf.com" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Şifre</label>
              <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {mode === "register" && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Ad Soyad</label>
                  <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Telefon</label>
                  <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 555 000 0000" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Departman</label>
                  <select style={styles.input} value={department} onChange={(e) => setDepartment(e.target.value)}>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </>
            )}

            <button style={styles.btnPrimary} onClick={mode === "login" ? handleLogin : handleRegister}>
              {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
            </button>

            {mode === "login" && (
              <button style={styles.btnLink} onClick={() => { setResetMode(true); setError(""); }}>
                Şifremi Unuttum
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ ...styles.authTabs, marginBottom: 16 }}>
              <div style={{ color: "#c9a84c", fontWeight: 700, fontSize: 14 }}>Şifre Sıfırlama</div>
            </div>
            {error && <div style={styles.errorBox}>{error}</div>}
            {success && <div style={styles.successBox}>{success}</div>}
            <div style={styles.formGroup}>
              <label style={styles.label}>Kayıtlı E-posta Adresiniz</label>
              <input style={styles.input} type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="ornek@caryagolf.com" />
            </div>
            <button style={styles.btnPrimary} onClick={handleReset}>Sıfırlama Bağlantısı Gönder</button>
            <button style={styles.btnLink} onClick={() => setResetMode(false)}>← Giriş Ekranına Dön</button>
          </>
        )}
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================
function MainApp(props) {
  const { currentUser, activeTab, setActiveTab, myNotifications, unreadCount, markNotifRead, onLogout, isAdmin, isSuperAdmin, users, setUsers } = props;
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div style={styles.appContainer}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 22 }}>⛳</span>
          <div>
            <div style={styles.headerTitle}>CARYA GOLF</div>
            <div style={styles.headerSub}>Yönetim Sistemi</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn} onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markNotifRead(); }}>
            🔔 {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
          </button>
          <button style={styles.iconBtn} onClick={() => setShowProfile(!showProfile)}>
            👤 <span style={{ fontSize: 12, marginLeft: 4 }}>{currentUser.name.split(" ")[0]}</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS DROPDOWN */}
      {showNotifs && (
        <div style={styles.notifDropdown}>
          <div style={styles.notifHeader}>Bildirimler</div>
          {myNotifications.length === 0 ? (
            <div style={styles.notifEmpty}>Bildirim yok</div>
          ) : (
            [...myNotifications].reverse().slice(0, 20).map((n) => (
              <div key={n.id} style={{ ...styles.notifItem, background: n.read ? "transparent" : "rgba(201,168,76,0.08)" }}>
                <div style={styles.notifMsg}>{n.message}</div>
                <div style={styles.notifMeta}>{n.from} • {n.time}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PROFILE DROPDOWN */}
      {showProfile && (
        <div style={styles.notifDropdown}>
          <div style={styles.notifHeader}>Profil</div>
          <div style={{ padding: "12px 16px", color: "#ccc", fontSize: 13 }}>
            <div><b style={{ color: "#fff" }}>{currentUser.name}</b></div>
            <div>{currentUser.email}</div>
            <div>{currentUser.phone}</div>
            <div>{currentUser.department}</div>
            <div style={{ marginTop: 4, color: "#c9a84c", textTransform: "uppercase", fontSize: 11 }}>{currentUser.role}</div>
          </div>
          <button style={{ ...styles.btnDanger, margin: "0 16px 16px" }} onClick={onLogout}>Çıkış Yap</button>
        </div>
      )}

      {/* TABS */}
      <div style={styles.tabs}>
        {[
          { key: "shift", label: "📅 Shift" },
          { key: "menu", label: "🍽️ Menü" },
          { key: "tasks", label: "✅ Görevler" },
          ...(isAdmin ? [{ key: "admin", label: "⚙️ Admin" }] : []),
        ].map((t) => (
          <button key={t.key} style={{ ...styles.tab, ...(activeTab === t.key ? styles.tabActive : {}) }} onClick={() => { setActiveTab(t.key); setShowNotifs(false); setShowProfile(false); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {activeTab === "shift" && <ShiftTab {...props} />}
        {activeTab === "menu" && <MenuTab {...props} />}
        {activeTab === "tasks" && <TasksTab {...props} />}
        {activeTab === "admin" && isAdmin && <AdminTab {...props} />}
      </div>
    </div>
  );
}

// ===================== SHIFT TAB =====================
function ShiftTab({ shifts, setShifts, users, isAdmin, currentUser }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [selectedDept, setSelectedDept] = useState("Tumü");

  const getWeekDates = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(weekOffset);
  const weekKey = weekDates[0].toISOString().slice(0, 10);
  const weekShifts = shifts[weekKey] || {};

  const setShift = (userId, dayIdx, val) => {
    setShifts((prev) => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [userId]: { ...(prev[weekKey]?.[userId] || {}), [dayIdx]: val },
      },
    }));
  };

  const allApproved = users.filter((u) => u.approved && u.role !== "superadmin");
  const activeDepts = DEPARTMENTS.filter((d) => allApproved.some((u) => u.department === d));
  const deptList = ["Tumü", ...activeDepts];
  const filteredUsers = selectedDept === "Tumü" ? allApproved : allApproved.filter((u) => u.department === selectedDept);

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Shift Planlaması</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button style={styles.btnSmall} onClick={() => setWeekOffset((p) => p - 1)}>Önceki</button>
          <span style={{ color: "#c9a84c", fontSize: 13, minWidth: 120, textAlign: "center" }}>
            {weekDates[0].toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })} - {weekDates[6].toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <button style={styles.btnSmall} onClick={() => setWeekOffset((p) => p + 1)}>Sonraki</button>
        </div>
      </div>

      {/* DEPARTMAN FİLTRE BUTONLARI */}
      <div style={styles.deptFilterBar}>
        {deptList.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDept(d)}
            style={{
              ...styles.deptFilterBtn,
              ...(selectedDept === d ? styles.deptFilterBtnActive : {}),
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div style={styles.shiftLegend}>
          {SHIFT_LETTERS.map((l) => (
            <button key={l} onClick={() => setSelectedLetter(l)} style={{ ...styles.shiftBadge, background: SHIFT_COLORS[l] || "#444", border: selectedLetter === l ? "2px solid #fff" : "2px solid transparent", opacity: selectedLetter === l ? 1 : 0.7 }}>
              {l}
            </button>
          ))}
          <span style={{ color: "#888", fontSize: 12 }}>Secip hucreye tikla</span>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div style={styles.menuEmpty}>Bu departmanda personel bulunmuyor.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.shiftTable}>
            <thead>
              <tr>
                <th style={styles.shiftTh}>Personel</th>
                {weekDates.map((d, i) => (
                  <th key={i} style={styles.shiftTh}>
                    <div style={{ fontSize: 11, color: "#888" }}>{DAYS[i]}</div>
                    <div style={{ fontSize: 13 }}>{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={styles.shiftTd}>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{u.department}</div>
                  </td>
                  {weekDates.map((_, dayIdx) => {
                    const val = weekShifts[u.id]?.[dayIdx] || "";
                    return (
                      <td key={dayIdx} style={styles.shiftCell} onClick={() => isAdmin && setShift(u.id, dayIdx, selectedLetter)}>
                        {val && (
                          <span style={{ ...styles.shiftBadge, background: SHIFT_COLORS[val] || "#444", cursor: isAdmin ? "pointer" : "default" }}>
                            {val}
                          </span>
                        )}
                        {!val && isAdmin && <span style={styles.shiftEmpty}>+</span>}
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
function MenuTab({ menus, setMenus, isAdmin }) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [editMode, setEditMode] = useState(false);
  const [menuText, setMenuText] = useState("");

  const currentMenu = menus[selectedDate] || "";

  useEffect(() => {
    setMenuText(menus[selectedDate] || "");
  }, [selectedDate, menus]);

  const saveMenu = () => {
    setMenus((prev) => ({ ...prev, [selectedDate]: menuText }));
    setEditMode(false);
  };

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>🍽️ Günlük Menü</h2>
        <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setEditMode(false); }} style={styles.dateInput} />
      </div>

      <div style={styles.menuCard}>
        <div style={styles.menuDateTitle}>
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div style={{ borderBottom: "1px solid #2a2a2a", marginBottom: 16 }} />

        {!editMode ? (
          <>
            {currentMenu ? (
              <pre style={styles.menuContent}>{currentMenu}</pre>
            ) : (
              <div style={styles.menuEmpty}>Bu tarih için menü girilmemiş.</div>
            )}
            {isAdmin && (
              <button style={{ ...styles.btnPrimary, marginTop: 16 }} onClick={() => setEditMode(true)}>
                {currentMenu ? "✏️ Düzenle" : "➕ Menü Ekle"}
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>Öğle Yemeği Listesi</div>
            <textarea
              style={styles.textarea}
              rows={12}
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              placeholder={"Örnek:\nÇorba: Mercimek Çorbası\nAna Yemek: Fırın Tavuk\nYan: Pilav, Salata\nTatlı: Sütlaç"}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={styles.btnPrimary} onClick={saveMenu}>💾 Kaydet</button>
              <button style={styles.btnSecondary} onClick={() => { setEditMode(false); setMenuText(currentMenu); }}>İptal</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===================== TASKS TAB =====================
function TasksTab({ currentUser, users, taskDefs, setTaskDefs, taskLogs, setTaskLogs, taskNotes, setTaskNotes, addNotification, isAdmin }) {
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingDept, setEditingDept] = useState(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [noteInput, setNoteInput] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);

  const logKey = (dept, date) => `${dept}__${date}`;

  const toggleTask = (dept, taskId) => {
    const key = logKey(dept, selectedDate);
    const existing = taskLogs[key]?.[taskId];
    if (existing) {
      setTaskLogs((prev) => {
        const updated = { ...prev[key] };
        delete updated[taskId];
        return { ...prev, [key]: updated };
      });
    } else {
      setTaskLogs((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [taskId]: { by: currentUser.name, time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) },
        },
      }));
    }
  };

  const addNote = (dept, taskId) => {
    const text = noteInput[taskId];
    if (!text?.trim()) return;
    const key = logKey(dept, selectedDate);
    const note = { text, by: currentUser.name, time: new Date().toLocaleString("tr-TR") };
    setTaskNotes((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [taskId]: [...((prev[key]?.[taskId]) || []), note] },
    }));
    addNotification(dept, `📌 ${dept} - Not: "${text}" (${currentUser.name})`, currentUser.name);
    setNoteInput((prev) => ({ ...prev, [taskId]: "" }));
    setShowNoteFor(null);
  };

  const addTask = (dept) => {
    if (!newTaskText.trim()) return;
    const newTask = { id: `${dept}-${Date.now()}`, text: newTaskText, category: "Genel" };
    setTaskDefs((prev) => ({ ...prev, [dept]: [...(prev[dept] || []), newTask] }));
    setNewTaskText("");
  };

  const removeTask = (dept, taskId) => {
    setTaskDefs((prev) => ({ ...prev, [dept]: prev[dept].filter((t) => t.id !== taskId) }));
  };

  if (!selectedDept) {
    return (
      <div>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>✅ Departman Görevleri</h2>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={styles.dateInput} />
        </div>
        <div style={styles.deptGrid}>
          {DEPARTMENTS.map((dept) => {
            const key = logKey(dept, selectedDate);
            const tasks = taskDefs[dept] || [];
            const done = Object.keys(taskLogs[key] || {}).length;
            const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
            return (
              <div key={dept} style={styles.deptCard} onClick={() => setSelectedDept(dept)}>
                <div style={styles.deptName}>{dept}</div>
                <div style={styles.deptProgress}>
                  <div style={{ ...styles.deptBar, width: `${pct}%` }} />
                </div>
                <div style={styles.deptMeta}>{done}/{tasks.length} tamamlandı · %{pct}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const key = logKey(selectedDept, selectedDate);
  const tasks = taskDefs[selectedDept] || [];
  const logs = taskLogs[key] || {};
  const notes = taskNotes[key] || {};

  return (
    <div>
      <div style={styles.sectionHeader}>
        <button style={styles.btnSmall} onClick={() => { setSelectedDept(null); setEditingDept(null); }}>← Geri</button>
        <h2 style={styles.sectionTitle}>{selectedDept}</h2>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={styles.dateInput} />
      </div>

      {isAdmin && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <input style={{ ...styles.input, flex: 1 }} value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Yeni görev ekle..." onKeyDown={(e) => e.key === "Enter" && addTask(selectedDept)} />
          <button style={styles.btnPrimary} onClick={() => addTask(selectedDept)}>+ Ekle</button>
        </div>
      )}

      <div style={styles.taskList}>
        {tasks.map((task) => {
          const log = logs[task.id];
          const taskNoteList = notes[task.id] || [];
          return (
            <div key={task.id} style={styles.taskItem}>
              <div style={styles.taskRow}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                  <div style={{ ...styles.checkbox, background: log ? "#c9a84c" : "transparent" }} onClick={() => toggleTask(selectedDept, task.id)}>
                    {log && "✓"}
                  </div>
                  <div>
                    <div style={{ ...styles.taskText, textDecoration: log ? "line-through" : "none", color: log ? "#666" : "#ddd" }}>{task.text}</div>
                    {log && <div style={styles.taskMeta}>✓ {log.by} • {log.time}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={styles.noteBtn} onClick={() => setShowNoteFor(showNoteFor === task.id ? null : task.id)}>📝 Not</button>
                  {isAdmin && <button style={styles.deleteBtn} onClick={() => removeTask(selectedDept, task.id)}>🗑</button>}
                </div>
              </div>

              {taskNoteList.length > 0 && (
                <div style={styles.noteList}>
                  {taskNoteList.map((n, i) => (
                    <div key={i} style={styles.noteItem}>
                      <span style={styles.noteText}>"{n.text}"</span>
                      <span style={styles.noteMeta}> — {n.by}, {n.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {showNoteFor === task.id && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input style={{ ...styles.input, flex: 1 }} value={noteInput[task.id] || ""} onChange={(e) => setNoteInput((prev) => ({ ...prev, [task.id]: e.target.value }))} placeholder="Not girin ve Enter'a basın..." onKeyDown={(e) => e.key === "Enter" && addNote(selectedDept, task.id)} />
                  <button style={styles.btnPrimary} onClick={() => addNote(selectedDept, task.id)}>Gönder</button>
                </div>
              )}
            </div>
          );
        })}
        {tasks.length === 0 && <div style={styles.menuEmpty}>Henüz görev eklenmemiş.</div>}
      </div>
    </div>
  );
}

// ===================== ADMIN TAB =====================
function AdminTab({ users, setUsers, currentUser, isSuperAdmin }) {
  const [tab, setTab] = useState("users");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", phone: "", department: DEPARTMENTS[0], role: "user" });
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const pendingUsers = users.filter((u) => !u.approved && u.role !== "superadmin");
  const allUsers = users.filter((u) => u.role !== "superadmin");

  const approveUser = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, approved: true } : u));
  };

  const rejectUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const deleteUser = (id) => {
    if (window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const promoteToAdmin = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: "admin" } : u));
  };

  const demoteToUser = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: "user" } : u));
  };

  const handleAddUser = () => {
    setAddError("");
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.phone) {
      return setAddError("Tüm alanları doldurunuz.");
    }
    if (users.find((u) => u.email === newUser.email)) {
      return setAddError("Bu e-posta zaten kayıtlı.");
    }
    const u = {
      id: Date.now().toString(),
      ...newUser,
      approved: true,
    };
    setUsers((prev) => [...prev, u]);
    setAddSuccess(`${newUser.name} başarıyla eklendi!`);
    setNewUser({ name: "", email: "", password: "", phone: "", department: DEPARTMENTS[0], role: "user" });
    setTimeout(() => { setAddSuccess(""); setShowAddForm(false); }, 2000);
  };

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>⚙️ Yönetim Paneli</h2>
        <button style={{ ...styles.btnPrimary, width: "auto", padding: "8px 18px" }} onClick={() => { setShowAddForm(!showAddForm); setAddError(""); setAddSuccess(""); }}>
          {showAddForm ? "✕ İptal" : "➕ Kullanıcı Ekle"}
        </button>
      </div>

      {/* MANUEL KULLANICI EKLEME FORMU */}
      {showAddForm && (
        <div style={styles.addUserForm}>
          <div style={{ color: "#c9a84c", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Yeni Kullanıcı Ekle</div>
          {addError && <div style={styles.errorBox}>{addError}</div>}
          {addSuccess && <div style={styles.successBox}>{addSuccess}</div>}
          <div style={styles.addUserGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Ad Soyad *</label>
              <input style={styles.input} value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} placeholder="Ad Soyad" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>E-posta *</label>
              <input style={styles.input} type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="ornek@caryagolf.com" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Şifre *</label>
              <input style={styles.input} value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="Geçici şifre" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Telefon *</label>
              <input style={styles.input} value={newUser.phone} onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))} placeholder="+90 555 000 0000" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Departman</label>
              <select style={styles.input} value={newUser.department} onChange={(e) => setNewUser((p) => ({ ...p, department: e.target.value }))}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rol</label>
              <select style={styles.input} value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}>
                <option value="user">Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button style={{ ...styles.btnPrimary, marginTop: 8 }} onClick={handleAddUser}>✓ Kullanıcıyı Kaydet</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, marginTop: 16 }}>
        <button style={{ ...styles.btnSmall, ...(tab === "users" ? { background: "#c9a84c", color: "#111" } : {}) }} onClick={() => setTab("users")}>
          Tüm Kullanıcılar ({allUsers.length})
        </button>
        <button style={{ ...styles.btnSmall, ...(tab === "pending" ? { background: "#c9a84c", color: "#111" } : {}) }} onClick={() => setTab("pending")}>
          Bekleyen {pendingUsers.length > 0 && `(${pendingUsers.length})`}
        </button>
      </div>

      {tab === "pending" && (
        <div>
          {pendingUsers.length === 0 ? (
            <div style={styles.menuEmpty}>Bekleyen kayıt yok.</div>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} style={styles.userCard}>
                <div>
                  <div style={styles.userName}>{u.name}</div>
                  <div style={styles.userMeta}>{u.email} • {u.phone}</div>
                  <div style={styles.userMeta}>{u.department}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnApprove} onClick={() => approveUser(u.id)}>✓ Onayla</button>
                  <button style={styles.btnDanger} onClick={() => rejectUser(u.id)}>✕ Reddet</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "users" && (
        <div>
          {allUsers.length === 0 && <div style={styles.menuEmpty}>Henüz kullanıcı yok.</div>}
          {allUsers.map((u) => (
            <div key={u.id} style={styles.userCard}>
              <div>
                <div style={styles.userName}>
                  {u.name} {!u.approved && <span style={{ color: "#f4a261", fontSize: 11 }}>(Onay Bekleniyor)</span>}
                </div>
                <div style={styles.userMeta}>{u.email} • {u.phone}</div>
                <div style={styles.userMeta}>{u.department} • <span style={{ color: "#c9a84c" }}>{u.role.toUpperCase()}</span></div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {isSuperAdmin && u.role === "user" && <button style={styles.btnSmall} onClick={() => promoteToAdmin(u.id)}>Admin Yap</button>}
                {isSuperAdmin && u.role === "admin" && <button style={styles.btnSmall} onClick={() => demoteToUser(u.id)}>Admin Kaldır</button>}
                {!u.approved && <button style={styles.btnApprove} onClick={() => approveUser(u.id)}>Onayla</button>}
                {isSuperAdmin && <button style={styles.btnDanger} onClick={() => deleteUser(u.id)}>🗑 Sil</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== STYLES =====================
const styles = {
  authBg: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d1a0d 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Georgia', serif",
  },
  authCard: {
    background: "#161616",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
  },
  authLogo: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
    justifyContent: "center",
  },
  logoIcon: { fontSize: 40 },
  logoTitle: { fontSize: 22, fontWeight: 900, color: "#c9a84c", letterSpacing: 4, fontFamily: "Georgia, serif" },
  logoSub: { fontSize: 10, color: "#888", letterSpacing: 3, textTransform: "uppercase" },
  authTabs: { display: "flex", gap: 0, marginBottom: 24, borderRadius: 8, overflow: "hidden", border: "1px solid #2a2a2a" },
  authTab: { flex: 1, padding: "10px", background: "transparent", color: "#888", border: "none", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" },
  authTabActive: { background: "#c9a84c", color: "#111", fontWeight: 700 },
  formGroup: { marginBottom: 16 },
  label: { display: "block", color: "#888", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  input: { width: "100%", padding: "10px 14px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none" },
  btnPrimary: { width: "100%", padding: "12px", background: "#c9a84c", color: "#111", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif" },
  btnSecondary: { padding: "10px 16px", background: "#2a2a2a", color: "#ccc", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  btnLink: { width: "100%", padding: "10px", background: "transparent", color: "#888", border: "none", cursor: "pointer", fontSize: 13, marginTop: 8 },
  btnDanger: { padding: "8px 14px", background: "#7b1d1d", color: "#ff8080", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  btnApprove: { padding: "8px 14px", background: "#1d4d2a", color: "#6dff9e", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  btnSmall: { padding: "7px 14px", background: "#2a2a2a", color: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  errorBox: { background: "#3a0d0d", border: "1px solid #7b1d1d", borderRadius: 8, padding: "10px 14px", color: "#ff8080", fontSize: 13, marginBottom: 16 },
  successBox: { background: "#0d3a1a", border: "1px solid #1d6b3a", borderRadius: 8, padding: "10px 14px", color: "#6dff9e", fontSize: 13, marginBottom: 16 },
  appContainer: { minHeight: "100vh", background: "#0d0d0d", fontFamily: "Georgia, serif", color: "#fff" },
  header: { background: "#111", borderBottom: "1px solid #1e1e1e", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 16, fontWeight: 900, color: "#c9a84c", letterSpacing: 2 },
  headerSub: { fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase" },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  iconBtn: { background: "transparent", border: "1px solid #2a2a2a", color: "#ccc", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, background: "#e76f51", color: "#fff", borderRadius: "50%", fontSize: 10, padding: "0 5px", minWidth: 16, textAlign: "center" },
  notifDropdown: { position: "absolute", top: 60, right: 16, width: 320, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, zIndex: 200, maxHeight: 400, overflowY: "auto", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" },
  notifHeader: { padding: "14px 16px", borderBottom: "1px solid #2a2a2a", color: "#c9a84c", fontWeight: 700, fontSize: 13 },
  notifEmpty: { padding: 20, color: "#555", textAlign: "center", fontSize: 13 },
  notifItem: { padding: "12px 16px", borderBottom: "1px solid #1a1a1a" },
  notifMsg: { color: "#ddd", fontSize: 13 },
  notifMeta: { color: "#666", fontSize: 11, marginTop: 4 },
  tabs: { display: "flex", background: "#111", borderBottom: "1px solid #1e1e1e", padding: "0 12px", overflowX: "auto" },
  tab: { padding: "14px 20px", background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif", whiteSpace: "nowrap", borderBottom: "2px solid transparent" },
  tabActive: { color: "#c9a84c", borderBottom: "2px solid #c9a84c" },
  content: { padding: "24px 20px", maxWidth: 1100, margin: "0 auto" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  sectionTitle: { color: "#c9a84c", fontSize: 20, fontWeight: 700, margin: 0 },
  dateInput: { padding: "8px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13 },
  shiftLegend: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" },
  shiftTable: { width: "100%", borderCollapse: "collapse", minWidth: 600 },
  shiftTh: { padding: "10px 8px", background: "#161616", color: "#888", fontSize: 12, textAlign: "center", border: "1px solid #1e1e1e", fontWeight: 600 },
  shiftTd: { padding: "10px 12px", border: "1px solid #1e1e1e", background: "#111" },
  shiftCell: { padding: "8px", border: "1px solid #1e1e1e", textAlign: "center", cursor: "pointer", background: "#111", transition: "background 0.15s" },
  shiftBadge: { display: "inline-block", padding: "4px 10px", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", minWidth: 32, textAlign: "center" },
  shiftEmpty: { color: "#333", fontSize: 18 },
  menuCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 16, padding: 28 },
  menuDateTitle: { color: "#c9a84c", fontSize: 18, fontWeight: 700, marginBottom: 16, textTransform: "capitalize" },
  menuContent: { color: "#ddd", fontSize: 15, lineHeight: 1.8, fontFamily: "Georgia, serif", whiteSpace: "pre-wrap" },
  menuEmpty: { color: "#555", textAlign: "center", padding: 40, fontSize: 14 },
  textarea: { width: "100%", padding: "12px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#ddd", fontSize: 14, fontFamily: "Georgia, serif", resize: "vertical", boxSizing: "border-box" },
  deptGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  deptCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 14, padding: 20, cursor: "pointer", transition: "border-color 0.2s", ":hover": { borderColor: "#c9a84c" } },
  deptName: { color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 12 },
  deptProgress: { background: "#2a2a2a", borderRadius: 4, height: 6, marginBottom: 8 },
  deptBar: { background: "#c9a84c", height: 6, borderRadius: 4, transition: "width 0.3s" },
  deptMeta: { color: "#666", fontSize: 12 },
  taskList: { display: "flex", flexDirection: "column", gap: 12 },
  taskItem: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 },
  taskRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  checkbox: { width: 22, height: 22, border: "2px solid #c9a84c", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontWeight: 900, fontSize: 13, flexShrink: 0, transition: "background 0.2s" },
  taskText: { fontSize: 14, lineHeight: 1.5, transition: "all 0.2s" },
  taskMeta: { color: "#c9a84c", fontSize: 11, marginTop: 4 },
  noteBtn: { padding: "6px 10px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#888", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
  deleteBtn: { padding: "6px 10px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#e76f51", cursor: "pointer", fontSize: 12 },
  noteList: { marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e1e1e" },
  noteItem: { padding: "6px 0", fontSize: 13 },
  noteText: { color: "#aaa" },
  noteMeta: { color: "#555" },
  userCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  userName: { color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 4 },
  userMeta: { color: "#888", fontSize: 12 },
  addUserForm: { background: "#161616", border: "1px solid #c9a84c33", borderRadius: 14, padding: 24, marginBottom: 20 },
  addUserGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 },
  deptFilterBar: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, padding: "12px 0" },
  deptFilterBtn: { padding: "7px 14px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 20, color: "#888", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif", whiteSpace: "nowrap", transition: "all 0.15s" },
  deptFilterBtnActive: { background: "#c9a84c", color: "#111", border: "1px solid #c9a84c", fontWeight: 700 },
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        