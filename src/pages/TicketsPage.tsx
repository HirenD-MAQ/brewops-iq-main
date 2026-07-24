import { getStore, getTickets } from '../data'
import { getSavedTickets } from '../state/tickets'

function TicketsPage() {
  const historical = getTickets()
  const saved = getSavedTickets()

  return (
    <div>
      <h1>Tickets</h1>
      <p className="muted">
        Historical ticket log (used by the store audit) plus tickets captured on this device.
      </p>

      <div className="card">
        <h2>Historical tickets</h2>
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
            {historical.map((t) => {
              const s = getStore(t.storeId)
              return (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{s?.name ?? t.storeId}</td>
                  <td className="num">{t.csat}</td>
                  <td className="muted">{t.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {saved.length > 0 && (
        <div className="card">
          <h2>Captured on this device ({saved.length})</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Store</th>
                <th>Member</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {saved.map((t, idx) => (
                <tr key={idx}>
                  <td>{t.date}</td>
                  <td>{getStore(t.storeId)?.name ?? t.storeId}</td>
                  <td>{t.memberId ?? '—'}</td>
                  <td className="num">{t.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TicketsPage
