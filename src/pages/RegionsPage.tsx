import { Link } from 'react-router-dom'
import { getRegions, getStore } from '../data'

function RegionsPage() {
  const regions = getRegions()

  return (
    <div>
      <h1>Regions</h1>
      <p className="muted">Region groupings for daily settlement runs.</p>

      {regions.map((r) => (
        <div className="card" key={r.id}>
          <h2>
            <Link to={`/regions/${r.id}`}>{r.name}</Link>{' '}
            <span className="muted" style={{ fontSize: 14 }}>({r.stores.length} stores)</span>
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Store</th>
                <th>Opens</th>
              </tr>
            </thead>
            <tbody>
              {r.stores.map((rs, idx) => {
                const store = getStore(rs.storeId)
                return (
                  <tr key={`${rs.storeId}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{store?.name ?? rs.storeId}</td>
                    <td>{rs.openTime}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default RegionsPage
