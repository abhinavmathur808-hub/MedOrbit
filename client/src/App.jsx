import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorProfileEdit from './pages/Doctor/DoctorProfileEdit';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import PatientProfile from './pages/Patient/PatientProfile';
import UserProfile from './pages/UserProfile/UserProfile';
import Doctors from './pages/Doctors/Doctors';
import BookAppointment from './pages/Appointment/BookAppointment';
import MyAppointments from './pages/Appointment/MyAppointments';
import Room from './pages/Room/Room';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AddArticle from './pages/AddArticle';
import Article from './pages/Article';
import OAuthCallback from './pages/OAuthCallback';
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/room/');

  return (
    <>
      <ScrollToTop />

      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/book-appointment/:id" element={<BookAppointment />} />
        <Route path="/article/:id" element={<Article />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        <Route path="/profile" element={<UserProfile />} />

        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/doctor/profile/edit" element={<DoctorProfileEdit />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />

        <Route path="/patient/profile" element={<PatientProfile />} />

        <Route path="/appointments" element={<MyAppointments />} />

        <Route path="/room/:roomId" element={<Room />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/add-article"
          element={
            <AdminRoute>
              <AddArticle />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;

