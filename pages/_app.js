import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <div className='bg-sky-100 w-screen h-screen content-center'>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
