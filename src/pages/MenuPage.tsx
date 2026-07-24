import { getMenu } from '../data'

function MenuPage() {
  const menu = getMenu()
  const categories = Array.from(new Set(menu.map((m) => m.category)))

  return (
    <div>
      <h1>Menu</h1>
      <p className="muted">Base prices from the static catalog. Loyalty tier and offers are applied by the pricing engine at ticket time.</p>

      {categories.map((cat) => (
        <div className="card" key={cat}>
          <h2 style={{ textTransform: 'capitalize' }}>{cat}</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>ID</th>
                <th className="num">Base price</th>
              </tr>
            </thead>
            <tbody>
              {menu
                .filter((m) => m.category === cat)
                .map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td className="muted">{m.id}</td>
                    <td className="num">{m.basePrice.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default MenuPage
