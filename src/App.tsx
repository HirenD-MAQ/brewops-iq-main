import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import DashboardPage from './pages/DashboardPage'
import MenuPage from './pages/MenuPage'
import MembersPage from './pages/MembersPage'
import MemberDetailPage from './pages/MemberDetailPage'
import OffersPage from './pages/OffersPage'
import RegionsPage from './pages/RegionsPage'
import RegionDetailPage from './pages/RegionDetailPage'
import TicketsPage from './pages/TicketsPage'
import NewTicketPage from './pages/NewTicketPage'

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">BrewOps IQ</span>
        <nav className="mainnav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/members">Members</NavLink>
          <NavLink to="/offers">Offers</NavLink>
          <NavLink to="/regions">Regions</NavLink>
          <NavLink to="/tickets">Tickets</NavLink>
        </nav>
        <NavLink to="/tickets/new" className="new-ticket-link">
          + New Ticket
        </NavLink>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/regions" element={<RegionsPage />} />
          <Route path="/regions/:id" element={<RegionDetailPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
