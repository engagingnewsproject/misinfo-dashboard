import { useRouter } from 'next/router'
import 'react-tooltip/dist/react-tooltip.css'

export default function Home() {

  const router = useRouter()
  router.push('/login')

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  )
}
