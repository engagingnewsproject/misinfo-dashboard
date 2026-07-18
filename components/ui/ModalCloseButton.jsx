import { Button } from '@material-tailwind/react'
import { IoClose } from 'react-icons/io5'

export default function ModalCloseButton({ onClick, ...props }) {
  return (
    <Button
      type="button"
      variant="text"
      onClick={onClick}
      aria-label="Close"
			className='p-2'
      {...props}>
      <IoClose size={20} />
    </Button>
  )
}