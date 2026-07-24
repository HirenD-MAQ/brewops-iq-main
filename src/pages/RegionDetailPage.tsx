import { Link, useParams } from 'react-router-dom'
import { getRegion, getStore, getTickets } from '../data'

function RegionDetailPage() {
  const { id = '' } = useParams()
  const region = getRegion(id)
  if (!region) {
    return (
      <div>
        <h1>Region not found</h1>
        <p className="muted">
          <Link to="/regions">Back to regions</Link>
        </p>
      </div>
    )
  }

  const storeIds = region.stores.map((rs) => rs.storeId)
  const tickets = getTickets()
    .filter((t) => storeIds.includes(t.storeId))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <div>
      <h1>{region.name}</h1>
      <p className="muted">Region id: {region.id}</p>

      <div className="card">
        <h2>Stores (settlement order)</h2>
        <ol>
          {region.stores.map((rs, idx) => {
            const s = getStore(rs.storeId)
            return (
              <li key={`${rs.storeId}-${idx}`}>
                {s?.name ?? rs.storeId} <span className="muted">· opens {rs.openTime}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="card">
        <h2>Recent tickets in region</h2>
        {tickets.length === 0 ? (
          <p className="muted">No tickets yet.</p>
        ) : (
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
              {tickets.slice(0, 12).map((t) => {
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
        )}
      </div>
    </div>
  )
}

export default RegionDetailPage
