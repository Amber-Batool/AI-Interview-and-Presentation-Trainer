// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import "./NotificationsPage.css";

// // ── Static notifications (replace with API call when backend is ready) ────────
// const INITIAL_NOTIFICATIONS = [
//   {
//     id: 1,
//     type: "session",
//     icon: "🎤",
//     title: "New Presentation Session Complete",
//     message: "Your latest voice practice session has been analyzed. Fluency score: 8/10.",
//     time: "2 minutes ago",
//     read: false,
//   },
//   {
//     id: 2,
//     type: "feedback",
//     icon: "📊",
//     title: "AI Feedback Ready",
//     message: "Your interview session feedback is ready. Overall score: 76%. Click to review tips.",
//     time: "1 hour ago",
//     read: false,
//   },
//   {
//     id: 3,
//     type: "streak",
//     icon: "🔥",
//     title: "3-Day Streak! Keep it up",
//     message: "You have practiced 3 days in a row. Consistency is the key to improvement!",
//     time: "5 hours ago",
//     read: false,
//   },
//   {
//     id: 4,
//     type: "session",
//     icon: "💼",
//     title: "Interview Session Saved",
//     message: "Your mock interview on React Development has been saved to your history.",
//     time: "Yesterday",
//     read: true,
//   },
//   {
//     id: 5,
//     type: "system",
//     icon: "✨",
//     title: "New Feature: Camera Mode",
//     message: "Camera mode now supports real-time posture and eye contact analysis. Try it now!",
//     time: "2 days ago",
//     read: true,
//   },
//   {
//     id: 6,
//     type: "feedback",
//     icon: "💡",
//     title: "Weekly Progress Report",
//     message: "Your average score this week is 82% — up 4% from last week. Great progress!",
//     time: "3 days ago",
//     read: true,
//   },
//   {
//     id: 7,
//     type: "streak",
//     icon: "🏆",
//     title: "Achievement Unlocked",
//     message: "You completed 10 practice sessions! You have earned the 'Dedicated Learner' badge.",
//     time: "4 days ago",
//     read: true,
//   },
//   {
//     id: 8,
//     type: "system",
//     icon: "🔒",
//     title: "Security Alert",
//     message: "A new login was detected from your account. If this was not you, change your password.",
//     time: "5 days ago",
//     read: true,
//   },
// ];

// const FILTERS = [
//   { id: "all",      label: "All",       icon: "🔔" },
//   { id: "session",  label: "Sessions",  icon: "🎤" },
//   { id: "feedback", label: "Feedback",  icon: "📊" },
//   { id: "streak",   label: "Streaks",   icon: "🔥" },
//   { id: "system",   label: "System",    icon: "⚙️" },
// ];

// const TYPE_COLORS = {
//   session:  { bg: "rgba(26,26,46,0.07)",   border: "rgba(26,26,46,0.14)",   dot: "#1a1a2e" },
//   feedback: { bg: "rgba(201,168,76,0.10)", border: "rgba(201,168,76,0.28)", dot: "#c9a84c" },
//   streak:   { bg: "rgba(231,76,60,0.07)",  border: "rgba(231,76,60,0.18)",  dot: "#e74c3c" },
//   system:   { bg: "rgba(39,174,96,0.07)",  border: "rgba(39,174,96,0.18)",  dot: "#27ae60" },
// };

// export default function NotificationsPage() {
//   const navigate = useNavigate();
//   const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
//   const [activeFilter, setActiveFilter] = useState("all");
//   const [toast, setToast] = useState(null);

//   const showToast = (msg) => {
//     setToast(msg);
//     setTimeout(() => setToast(null), 2800);
//   };

//   // ── Mark single as read ──────────────────────────────────────────────
//   const markRead = (id) => {
//     setNotifications((prev) =>
//       prev.map((n) => (n.id === id ? { ...n, read: true } : n))
//     );
//   };

//   // ── Mark all as read ─────────────────────────────────────────────────
//   const markAllRead = () => {
//     setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
//     showToast("All notifications marked as read.");
//   };

//   // ── Delete single ────────────────────────────────────────────────────
//   const deleteOne = (id) => {
//     setNotifications((prev) => prev.filter((n) => n.id !== id));
//   };

//   // ── Clear all ────────────────────────────────────────────────────────
//   const clearAll = () => {
//     setNotifications([]);
//     showToast("All notifications cleared.");
//   };

//   // ── Filtered list ────────────────────────────────────────────────────
//   const filtered =
//     activeFilter === "all"
//       ? notifications
//       : notifications.filter((n) => n.type === activeFilter);

//   const unreadCount = notifications.filter((n) => !n.read).length;

//   return (
//     <div className="np-page">
//       <Header />

//       <main className="np-main">
//         {/* Background orbs */}
//         <span className="np-orb np-orb-1" />
//         <span className="np-orb np-orb-2" />

//         <div className="np-wrap">

//           {/* ── Page header ── */}
//           <div className="np-page-header">
//             <div className="np-page-title">
//               <h1>
//                 Notifications
//                 {unreadCount > 0 && (
//                   <span className="np-unread-badge">{unreadCount}</span>
//                 )}
//               </h1>
//               <p>Stay updated on your practice sessions, feedback, and achievements.</p>
//             </div>

//             <div className="np-page-actions">
//               {unreadCount > 0 && (
//                 <button className="np-action-btn" onClick={markAllRead}>
//                   ✓ Mark all read
//                 </button>
//               )}
//               {notifications.length > 0 && (
//                 <button className="np-action-btn danger" onClick={clearAll}>
//                   🗑️ Clear all
//                 </button>
//               )}
//               <button className="np-back-btn" onClick={() => navigate("/dashboard")}>
//                 ← Dashboard
//               </button>
//             </div>
//           </div>

//           {/* ── Filter tabs ── */}
//           <div className="np-filters">
//             {FILTERS.map((f) => {
//               const count =
//                 f.id === "all"
//                   ? notifications.length
//                   : notifications.filter((n) => n.type === f.id).length;
//               return (
//                 <button
//                   key={f.id}
//                   className={`np-filter-btn ${activeFilter === f.id ? "active" : ""}`}
//                   onClick={() => setActiveFilter(f.id)}
//                 >
//                   <span>{f.icon}</span>
//                   {f.label}
//                   {count > 0 && (
//                     <span className="np-filter-count">{count}</span>
//                   )}
//                 </button>
//               );
//             })}
//           </div>

//           {/* ── Notification list ── */}
//           <div className="np-list">
//             {filtered.length === 0 ? (
//               <div className="np-empty">
//                 <span className="np-empty-icon">🔕</span>
//                 <h3>No notifications</h3>
//                 <p>
//                   {activeFilter === "all"
//                     ? "You're all caught up! Complete a practice session to see updates here."
//                     : `No ${activeFilter} notifications yet.`}
//                 </p>
//                 <button className="np-empty-btn" onClick={() => navigate("/dashboard")}>
//                   Start Practicing →
//                 </button>
//               </div>
//             ) : (
//               filtered.map((n, i) => {
//                 const colors = TYPE_COLORS[n.type] || TYPE_COLORS.system;
//                 return (
//                   <div
//                     key={n.id}
//                     className={`np-item ${n.read ? "read" : "unread"}`}
//                     style={{ animationDelay: `${i * 0.05}s` }}
//                     onClick={() => markRead(n.id)}
//                   >
//                     {/* Unread dot */}
//                     {!n.read && (
//                       <span
//                         className="np-dot"
//                         style={{ background: colors.dot }}
//                       />
//                     )}

//                     {/* Icon */}
//                     <div
//                       className="np-item-icon"
//                       style={{
//                         background: colors.bg,
//                         border: `1px solid ${colors.border}`,
//                       }}
//                     >
//                       {n.icon}
//                     </div>

//                     {/* Content */}
//                     <div className="np-item-content">
//                       <div className="np-item-top">
//                         <h4 className={n.read ? "" : "bold"}>{n.title}</h4>
//                         <span className="np-item-time">{n.time}</span>
//                       </div>
//                       <p className="np-item-msg">{n.message}</p>
//                     </div>

//                     {/* Delete */}
//                     <button
//                       className="np-item-delete"
//                       onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
//                       title="Remove"
//                     >
//                       ×
//                     </button>
//                   </div>
//                 );
//               })
//             )}
//           </div>

//         </div>

//         {/* Toast */}
//         {toast && <div className="np-toast">{toast}</div>}
//       </main>

//       <Footer />
//     </div>
//   );
// }




























import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./NotificationsPage.css";

const API = "http://127.0.0.1:8000/api";

const FILTERS = [
  { id: "all",      label: "All",       icon: "🔔" },
  { id: "session",  label: "Sessions",  icon: "🎤" },
  { id: "feedback", label: "Feedback",  icon: "📊" },
  { id: "streak",   label: "Streaks",   icon: "🔥" },
  { id: "system",   label: "System",    icon: "⚙️" },
];

const TYPE_COLORS = {
  session:  { bg: "rgba(26,26,46,0.07)",   border: "rgba(26,26,46,0.14)",   dot: "#1a1a2e" },
  feedback: { bg: "rgba(201,168,76,0.10)", border: "rgba(201,168,76,0.28)", dot: "#c9a84c" },
  streak:   { bg: "rgba(231,76,60,0.07)",  border: "rgba(231,76,60,0.18)",  dot: "#e74c3c" },
  system:   { bg: "rgba(39,174,96,0.07)",  border: "rgba(39,174,96,0.18)",  dot: "#27ae60" },
};

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]        = useState(true);
  const [activeFilter,  setActiveFilter]   = useState("all");
  const [toast,         setToast]          = useState(null);

  // ── Get username ──────────────────────────────────────────────────────
  const getUsername = () => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u).name || "anonymous" : "anonymous";
    } catch { return "anonymous"; }
  };

  // ── Show toast ────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // ── Fetch notifications ───────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const username = getUsername();
      const res  = await fetch(`${API}/notifications?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Mark single read ──────────────────────────────────────────────────
  const markRead = async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) { console.error(err); }
  };

  // ── Mark all read ─────────────────────────────────────────────────────
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("All notifications marked as read.");
    try {
      const username = getUsername();
      await fetch(`${API}/notifications/read-all?username=${encodeURIComponent(username)}`,
        { method: "PATCH" });
    } catch (err) { console.error(err); }
  };

  // ── Delete one ────────────────────────────────────────────────────────
  const deleteOne = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`${API}/notifications/${id}`, { method: "DELETE" });
    } catch (err) { console.error(err); }
  };

  // ── Clear all ─────────────────────────────────────────────────────────
  const clearAll = async () => {
    setNotifications([]);
    showToast("All notifications cleared.");
    try {
      const username = getUsername();
      await fetch(`${API}/notifications/clear-all?username=${encodeURIComponent(username)}`,
        { method: "DELETE" });
    } catch (err) { console.error(err); }
  };

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="np-page">
      <Header />

      <main className="np-main">
        <span className="np-orb np-orb-1" />
        <span className="np-orb np-orb-2" />

        <div className="np-wrap">

          {/* ── Page header ── */}
          <div className="np-page-header">
            <div className="np-page-title">
              <h1>
                Notifications
                {unreadCount > 0 && (
                  <span className="np-unread-badge">{unreadCount}</span>
                )}
              </h1>
              <p>Stay updated on your practice sessions, feedback, and achievements.</p>
            </div>

            <div className="np-page-actions">
              {unreadCount > 0 && (
                <button className="np-action-btn" onClick={markAllRead}>
                  ✓ Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button className="np-action-btn danger" onClick={clearAll}>
                  🗑️ Clear all
                </button>
              )}
              <button className="np-back-btn" onClick={() => navigate("/dashboard")}>
                ← Dashboard
              </button>
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div className="np-filters">
            {FILTERS.map((f) => {
              const count =
                f.id === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.type === f.id).length;
              return (
                <button
                  key={f.id}
                  className={`np-filter-btn ${activeFilter === f.id ? "active" : ""}`}
                  onClick={() => setActiveFilter(f.id)}
                >
                  <span>{f.icon}</span>
                  {f.label}
                  {count > 0 && (
                    <span className="np-filter-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── List ── */}
          <div className="np-list">

            {/* Loading skeleton */}
            {loading && (
              <>
                {[1,2,3].map((i) => (
                  <div key={i} className="np-skeleton">
                    <div className="np-skeleton-icon" />
                    <div className="np-skeleton-lines">
                      <div className="np-skeleton-line wide" />
                      <div className="np-skeleton-line" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="np-empty">
                <span className="np-empty-icon">🔕</span>
                <h3>No notifications</h3>
                <p>
                  {activeFilter === "all"
                    ? "Complete a practice session to see updates here."
                    : `No ${activeFilter} notifications yet.`}
                </p>
                <button className="np-empty-btn" onClick={() => navigate("/dashboard")}>
                  Start Practicing →
                </button>
              </div>
            )}

            {/* Notification items */}
            {!loading && filtered.map((n, i) => {
              const colors = TYPE_COLORS[n.type] || TYPE_COLORS.system;
              return (
                <div
                  key={n.id}
                  className={`np-item ${n.read ? "read" : "unread"}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  {!n.read && (
                    <span className="np-dot" style={{ background: colors.dot }} />
                  )}

                  <div
                    className="np-item-icon"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    {n.icon}
                  </div>

                  <div className="np-item-content">
                    <div className="np-item-top">
                      <h4 className={n.read ? "" : "bold"}>{n.title}</h4>
                      <span className="np-item-time">{n.time}</span>
                    </div>
                    <p className="np-item-msg">{n.message}</p>
                  </div>

                  <button
                    className="np-item-delete"
                    onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

        </div>

        {toast && <div className="np-toast">{toast}</div>}
      </main>

      <Footer />
    </div>
  );
}