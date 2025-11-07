import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Notification from '../../screens/Dashboard/components/Notification'

describe('Notification', () => {
  it('renders success notification', () => {
    render(
      <Notification
        notification={{
          message: "Test success message",
          type: "success"
        }}
        onClose={vi.fn()}
      />
    )
    
    expect(screen.getByText('Test success message')).toBeInTheDocument()
  })

  it('renders error notification', () => {
    render(
      <Notification
        notification={{
          message: "Test error message",
          type: "error"
        }}
        onClose={vi.fn()}
      />
    )
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('does not render when notification is null', () => {
    const { container } = render(
      <Notification
        notification={null}
        onClose={vi.fn()}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <Notification
        notification={{
          message: "Test message",
          type: "success"
        }}
        onClose={onClose}
      />
    )

    const closeButton = screen.getByLabelText('Cerrar notificación')
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

