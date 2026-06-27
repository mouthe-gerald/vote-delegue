import { memo } from 'react'

const TransparenteText = memo(() => {
  return (
    <span className="text-amber-500" style={{
      display: 'inline-block',
      animation: 'fadeUp 0.8s ease 0.3s both'
    }}>
      Transparente
    </span>
  )
})

export default TransparenteText
