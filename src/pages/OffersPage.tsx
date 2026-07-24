import { getOffers } from '../data'

function describeScope(offer: ReturnType<typeof getOffers>[number]): string {
  switch (offer.type) {
    case 'percent_off': {
      if (offer.scope.category) return `${offer.percent}% off category "${offer.scope.category}"`
      const ids = offer.scope.productIds ?? []
      return `${offer.percent}% off ${ids.join(', ')}`
    }
    case 'bundle':
      return `Bundle: ${offer.products[0]} + ${offer.products[1]} — $${offer.amountOff.toFixed(2)} off per pair`
    case 'spend_threshold':
      return `Spend ≥ ${offer.minSubtotal.toFixed(2)}${offer.category ? ' in ' + offer.category : ''}, get ${offer.amountOff.toFixed(2)} off`
  }
}

function OffersPage() {
  const offers = getOffers()

  return (
    <div>
      <h1>Offers</h1>
      <p className="muted">Current and upcoming promotional offers. Activation is date + optional weekday + optional member tier.</p>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Details</th>
              <th>Window</th>
              <th>Weekday</th>
              <th>Tiers</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.name}
                  <div className="muted" style={{ fontSize: 12 }}>{o.id}</div>
                </td>
                <td>{o.type}</td>
                <td className="muted">{describeScope(o)}</td>
                <td>
                  {o.validFrom} → {o.validTo}
                </td>
                <td>{o.dayOfWeek?.join(', ') ?? '—'}</td>
                <td>{o.eligibleTiers?.join(', ') ?? 'any'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OffersPage
