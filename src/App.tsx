import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

// Eagerly load auth + landing (always needed fast)
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
import { LandingPage } from '@/pages/LandingPage';

// Lazy-load all app pages — only loaded when navigated to
const FabHome        = lazy(() => import('@/pages/fablab/FabHome').then(m => ({ default: m.FabHome })));
const FabDashboard   = lazy(() => import('@/pages/fablab/FabDashboard').then(m => ({ default: m.FabDashboard })));
const FabInventory   = lazy(() => import('@/pages/fablab/FabInventory').then(m => ({ default: m.FabInventory })));
const FabSchedule    = lazy(() => import('@/pages/fablab/FabSchedule').then(m => ({ default: m.FabSchedule })));
const FabSuggestions = lazy(() => import('@/pages/fablab/FabSuggestions').then(m => ({ default: m.FabSuggestions })));
const FabProjects    = lazy(() => import('@/pages/fablab/FabProjects').then(m => ({ default: m.FabProjects })));
const FabReports     = lazy(() => import('@/pages/fablab/FabReports').then(m => ({ default: m.FabReports })));
const FabUsers       = lazy(() => import('@/pages/fablab/FabUsers').then(m => ({ default: m.FabUsers })));
const FabBlog        = lazy(() => import('@/pages/fablab/FabBlog').then(m => ({ default: m.FabBlog })));
const GiftedHome     = lazy(() => import('@/pages/gifted/GiftedHome').then(m => ({ default: m.GiftedHome })));
const GiftedDashboard= lazy(() => import('@/pages/gifted/GiftedDashboard').then(m => ({ default: m.GiftedDashboard })));
const GiftedStudents = lazy(() => import('@/pages/gifted/GiftedStudents').then(m => ({ default: m.GiftedStudents })));
const StudentProfile = lazy(() => import('@/pages/gifted/StudentProfile').then(m => ({ default: m.StudentProfile })));
const QuizCreator    = lazy(() => import('@/pages/gifted/QuizCreator').then(m => ({ default: m.QuizCreator })));
const StudentHome    = lazy(() => import('@/pages/student/StudentHome').then(m => ({ default: m.StudentHome })));
const StudentQuiz    = lazy(() => import('@/pages/student/StudentQuiz').then(m => ({ default: m.StudentQuiz })));
const StudentGrades  = lazy(() => import('@/pages/student/StudentGrades').then(m => ({ default: m.StudentGrades })));
const StudentProposal= lazy(() => import('@/pages/student/StudentProposal').then(m => ({ default: m.StudentProposal })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <div className="w-5 h-5 border-2 border-border border-t-[#D42020] rounded-full animate-spin" />
      <span className="text-sm">Carregando...</span>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Public — always accessible ── */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />

      {/* ── Protected app — lazy loaded pages ── */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/fablab/home" replace />} />
        <Route path="fablab/home"        element={<Suspense fallback={<PageLoader />}><FabHome /></Suspense>} />
        <Route path="fablab/dashboard"   element={<Suspense fallback={<PageLoader />}><FabDashboard /></Suspense>} />
        <Route path="fablab/inventory"   element={<Suspense fallback={<PageLoader />}><FabInventory /></Suspense>} />
        <Route path="fablab/schedule"    element={<Suspense fallback={<PageLoader />}><FabSchedule /></Suspense>} />
        <Route path="fablab/suggestions" element={<Suspense fallback={<PageLoader />}><FabSuggestions /></Suspense>} />
        <Route path="fablab/projects"    element={<Suspense fallback={<PageLoader />}><FabProjects /></Suspense>} />
        <Route path="fablab/blog"        element={<Suspense fallback={<PageLoader />}><FabBlog /></Suspense>} />
        <Route path="fablab/reports"     element={<Suspense fallback={<PageLoader />}><FabReports /></Suspense>} />
        <Route path="fablab/users"       element={<Suspense fallback={<PageLoader />}><FabUsers /></Suspense>} />
        <Route path="gifted/home"        element={<Suspense fallback={<PageLoader />}><GiftedHome /></Suspense>} />
        <Route path="gifted/dashboard"   element={<Suspense fallback={<PageLoader />}><GiftedDashboard /></Suspense>} />
        <Route path="gifted/students"    element={<Suspense fallback={<PageLoader />}><GiftedStudents /></Suspense>} />
        <Route path="gifted/student/:id" element={<Suspense fallback={<PageLoader />}><StudentProfile /></Suspense>} />
        <Route path="gifted/quiz-creator"element={<Suspense fallback={<PageLoader />}><QuizCreator /></Suspense>} />
        <Route path="student/home"       element={<Suspense fallback={<PageLoader />}><StudentHome /></Suspense>} />
        <Route path="student/quiz"       element={<Suspense fallback={<PageLoader />}><StudentQuiz /></Suspense>} />
        <Route path="student/grades"     element={<Suspense fallback={<PageLoader />}><StudentGrades /></Suspense>} />
        <Route path="student/proposal"   element={<Suspense fallback={<PageLoader />}><StudentProposal /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
