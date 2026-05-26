import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BookingProvider } from './context/BookingContext'
import HomePage from './pages/HomePage'
import MastersPage from './pages/MastersPage'
import ServicesPage from './pages/ServicesPage'
import SlotsPage from './pages/SlotsPage'
import ConfirmationPage from './pages/ConfirmationPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/masters" element={<MastersPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/slots" element={<SlotsPage />} />
          <Route path="/confirm" element={<ConfirmationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  )
}