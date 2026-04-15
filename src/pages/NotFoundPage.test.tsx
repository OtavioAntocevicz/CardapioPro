import { NotFoundPage } from '@/pages/NotFoundPage'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

describe('NotFoundPage', () => {
  it('exibe o título de página não encontrada', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /página não encontrada/i }),
    ).toBeInTheDocument()
  })
})
