import { useEffect } from 'react'

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `VotingApp — ${title}` : 'VotingApp'
    return () => { document.title = 'VotingApp' }
  }, [title])
}

export default usePageTitle
