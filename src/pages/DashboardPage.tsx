import { Link } from 'react-router-dom'
import { getRegions, getStores, getTickets } from '../data'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function DashboardPage() {
  const tickets = getTickets()
  const stores = getStores()
  const regions = getRegions()
  const today = todayStr()

  const latest = [...tickets]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5)

  const avgCsat =
    tickets.length === 0
      ? 0
      : Math.round(
          (tickets.reduce((s, t) => s + t.csat, 0) / tickets.length) * 100,
        ) / 100

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Chain-wide snapshot for {today}.</p>

      <div className="stats">
        <div className="stat">
          <div className="k">Stores</div>
          <div className="v">{stores.length}</div>
        </div>
        <div className="stat">
          <div className="k">Regions</div>
          <div className="v">{regions.length}</div>
        </div>
        <div className="stat">
          <div className="k">Tickets logged</div>
          <div className="v">{tickets.length}</div>
        </div>
        <div className="stat">
          <div className="k">Avg CSAT</div>
          <div className="v">{avgCsat.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <h2>Latest tickets</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Store</th>
              <th className="num">CSAT</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((t) => {
              const store = stores.find((s) => s.id === t.storeId)
              return (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{store?.name ?? t.storeId}</td>
                  <td className="num">{t.csat}</td>
                  <td className="muted">{t.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ fontSize: 14 }}>
        See <Link to="/regions">Regions</Link> for daily settlement,{' '}
        <Link to="/tickets/new">New Ticket</Link> to price a ticket.
      </p>
    </div>
  )
}

export default DashboardPage
