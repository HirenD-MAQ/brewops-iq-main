import { Link } from 'react-router-dom'
import { getMembers, getStores } from '../data'

function MembersPage() {
  const members = getMembers()
  const stores = getStores()

  return (
    <div>
      <h1>Members</h1>
      <p className="muted">Loyalty members and their tier. Tier controls which offers they can redeem.</p>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tier</th>
              <th>Home store</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const store = stores.find((s) => s.id === m.homeStoreId)
              return (
                <tr key={m.id}>
                  <td>
                    <Link to={`/members/${m.id}`}>{m.name}</Link>
                    <div className="muted" style={{ fontSize: 12 }}>{m.id}</div>
                  </td>
                  <td>
                    <span className={`pill tier-${m.tier}`}>{m.tier}</span>
                  </td>
                  <td>{store?.name ?? m.homeStoreId}</td>
                  <td>{m.joined}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MembersPage
