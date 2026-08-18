# Virtual Patient English — Frontend Arxitekturasi

Ushbu hujjat **Virtual Patient English** platformasining frontend qismi arxitekturasi, komponentlar strukturasi, state management, Role-based Routing va responsive UI tamoyillarini o'z ichiga oladi.

---

## 1. Texnologiyalar Steki (Frontend Tech Stack)

- **Kutubxona:** React.js (v18+)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Vanilla CSS + Utility classes)
- **Routing:** React Router DOM (v6+)
- **State Management:** React Context API (`AuthContext`)
- **Network Client:** Axios (Interceptors bilan JWT avtomatik biriktirish)
- **Icons:** Remix Icons (`remixicon`)

---

## 2. Kataloqlar Tuzilishi (`frontend/src`)

```
frontend/src/
├── assets/             # Rasmlar, logotiplar va static medialar
├── components/         # Qayta ishlatiluvchi UI komponentlar
│   ├── common/         # Button, Input, Modal, Badge, Spinner
│   ├── layout/         # Sidebar, Navbar, Footer, LayoutWrapper
│   ├── student/        # Stepper, ChatWindow, PhrasebookDrawer, Scorecard
│   ├── teacher/        # StudentTable, GroupCard, ExportModal
│   └── admin/          # ScenarioEditor, VocabTable, UserForm
├── contexts/           # AuthContext, ModulContext
│   └── AuthContext.jsx # Login, Logout, JWT token va foydalanuvchi holati
├── lib/                # Axios instance va utility helperlar
│   └── api.js          # Base URL va Interceptor sozlamalari
├── pages/              # Sahifa komponentlari (Rollar bo'yicha)
│   ├── auth/           # Login.jsx, Register.jsx
│   ├── student/        # Dashboard, Modules, ModuleDetail, Grammar, Forum, Profile
│   ├── teacher/        # Dashboard, Groups, GroupDetail, StudentDetail, Reports
│   └── admin/          # Overview, Users, Groups, ContentManager, Settings
├── App.jsx             # Main Router va Route Guards
├── main.jsx            # Entry point
└── index.css           # Tailwind direktivalari va custom uslublar
```

---

## 3. Role-Based Routing va Qo'riqchilar (Route Guards)

`App.jsx` faylida foydalanuvchi roliga qarab yo'naltirishlarni himoyalovchi komponentlar (`ProtectedRoute`) ishlatiladi:

```jsx
// ProtecedRoute misoli
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

---

## 4. Dars Sikli Komponenti — Step-by-Step Stepper

Talaba modul ichiga kirganda (`/student/modules/:id`), 7 ta bosqichni boshqaruvchi Stepper komponenti faollashadi:

1. **`VocabularyStep.jsx`:** Flashcard va audio pleerlar bilan lug'atni taqdim etadi.
2. **`PhrasebookStep.jsx`:** Kategoriya bo'yicha tayyor iboralar va izohlarni ko'rsatadi.
3. **`VirtualPatientChat.jsx`:**
   - Real-time chat ro'yxati
   - Web Speech API microphone tugmasi
   - Off-canvas **`PhrasebookDrawer`** (bosganda inputga matn ko'chiradi)
4. **`AIFeedbackCard.jsx`:** Progress barlar bilan 5 ta mezon (Grammar, Clinical...) baholarini va xatolar ro'yxatini ko'rsatadi.
5. **`RetryStep.jsx`:** Qayta urinish uchun eslatmalar va qayta boshlash tugmasi.
6. **`FinalChallengeChat.jsx`:** Shpargalkasiz va yordamsiz murakkab chat.
7. **`QuizStep.jsx`:** 4 variantli test paneli va yakuniy ball hesoblash.

---

## 5. Responsive UI va Mobile-First Yondashuvi

1. **Breakpoints:**
   - Mobil (< 768px): Sidebar yashiriladi va Off-canvas drawer (Hamburger menu) sifatida ochiladi.
   - Desktop (>= 768px): Sidebar doimiy ravishda ochiq va chap tomonda `w-64` kenglikda turadi.
2. **Chat Oynasi:**
   - Mobil ekranlarda 100% ekran kengligida (`w-full`), paddinglar `p-3`, tugma balandliklari kamida `44px` (touch friendly).
