import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

test('renders the dashboard', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
  expect(
    screen.getByRole('heading', { name: 'Dashboard', level: 1 }),
  ).toBeInTheDocument()
})
