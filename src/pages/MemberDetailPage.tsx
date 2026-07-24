import { Link, useParams } from 'react-router-dom'
import { getMember, getStore, getTickets } from '../data'

function MemberDetailPage() {
  const { id = '' } = useParams()
  const member = getMember(id)
  if (!member) {
    return (
      <div>
        <h1>Member not found</h1>
        <p className="muted">
          <Link to="/members">Back to members</Link>
        </p>
      </div>
    )
  }

  const store = getStore(member.homeStoreId)
  // Tickets aren't tied to members in the static data; show home store's recent tickets.
  const homeTickets = getTickets()
    .filter((t) => t.storeId === member.homeStoreId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5)

  return (
    <div>
      <h1>{member.name}</h1>
      <p>
        <span className={`pill tier-${member.tier}`}>{member.tier}</span>{' '}
        <span className="muted">· Member since {member.joined}</span>
      </p>
      <p className="muted">Home store: {store?.name ?? member.homeStoreId}</p>

      <div className="card">
        <h2>Recent tickets at home store</h2>
        {homeTickets.length === 0 ? (
          <p className="muted">No tickets at this store yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">CSAT</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {homeTickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td className="num">{t.csat}</td>
                  <td className="muted">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default MemberDetailPage
