import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMenu, getMembers, getStores } from '../data'
import { saveTicket } from '../state/tickets'
import type { PricedLine } from '../state/tickets'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function NewTicketPage() {
  const navigate = useNavigate()
  const [storeId, setStoreId] = useState('')
  const [memberId, setMemberId] = useState('')
  // productId -> qty
  const [cart, setCart] = useState<Record<string, number>>({})

  const menu = getMenu()
  const cartItems = menu.filter((m) => cart[m.id])

  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[productId]
      } else {
        next[productId] = qty
      }
      return next
    })
  }

  // TODO: offers are not applied — see SPEC.md
  const lines: PricedLine[] = cartItems.map((m) => {
    const qty = cart[m.id]
    const gross = round2(m.basePrice * qty)
    return {
      productId: m.id,
      qty,
      unitPrice: m.basePrice,
      gross,
      appliedOfferId: null,
      discount: 0,
      net: gross,
    }
  })

  const subtotal = round2(lines.reduce((sum, line) => sum + line.net, 0))
  const total = subtotal

  function handleSubmit() {
    saveTicket({
      storeId,
      memberId: memberId || null,
      date: new Date().toISOString().slice(0, 10),
      lines,
      orderLevel: { appliedOfferId: null, discount: 0 },
      subtotal,
      total,
    })
    navigate('/tickets')
  }

  return (
    <div>
      <h1>New Ticket</h1>

      <label className="field">
        Store
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <option value="">Select a store…</option>
          {getStores().map((s) => (
            <option value={s.id} key={s.id}>
              {s.name} ({s.region})
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Member (optional)
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          <option value="">Walk-in (no member)</option>
          {getMembers().map((m) => (
            <option value={m.id} key={m.id}>
              {m.name} — {m.tier}
            </option>
          ))}
        </select>
      </label>

      <div className="ticket-layout">
        <section>
          <h2>Menu</h2>
          <ul className="menu-list">
            {menu.map((m) => (
              <li key={m.id}>
                <span>
                  {m.name}{' '}
                  <span className="muted">
                    {m.category} · {m.basePrice.toFixed(2)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setQty(m.id, (cart[m.id] ?? 0) + 1)}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Cart</h2>
          {cartItems.length === 0 ? (
            <p className="muted">Cart is empty. Add items from the menu.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Offer</th>
                  <th className="num">Gross</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const item = menu.find((m) => m.id === line.productId)!
                  return (
                    <tr key={line.productId}>
                      <td>{item.name}</td>
                      <td>
                        <span className="stepper">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.name}`}
                            onClick={() => setQty(line.productId, line.qty - 1)}
                          >
                            −
                          </button>
                          <span>{line.qty}</span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.name}`}
                            onClick={() => setQty(line.productId, line.qty + 1)}
                          >
                            +
                          </button>
                        </span>
                      </td>
                      <td>—</td>
                      <td className="num">{line.gross.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          <div className="ticket-summary card">
            <div className="summary-row">
              <span>Subtotal</span>
              <span data-testid="ticket-subtotal">{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <span data-testid="ticket-discount">0.00</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span data-testid="ticket-total">{total.toFixed(2)}</span>
            </div>
            <button
              type="button"
              className="primary"
              data-testid="submit-ticket"
              disabled={lines.length === 0 || storeId === ''}
              onClick={handleSubmit}
            >
              Submit ticket
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default NewTicketPage
