import React,{ useState } from 'react'
import { IoClose } from "react-icons/io5"
const ThankYouModal = ({ setContactHelpModal, setContactSent, handleContactHelpSubmit }) => {

  const [update, setUpdate] = useState(false)

	const handleThankYouClose = () => {
		
	}
  return (
    <>
        <div className="fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto">
            <div 
                onClick={handleThankYouClose} 
                className={`flex overflow-y-auto justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full`}>
                <div onClick={(e) => {e.stopPropagation()}} className={`flex-col justify-center items-center bg-white md:w-8/12 lg:w-6/12 h-auto rounded-2xl py-10 px-10 z-50`}>
                    <div className="flex justify-between w-full mb-5">
                        <div className="text-md font-bold text-blue-600 tracking-wide">Contact Help Form</div>
                        <button onClick={handleThankYouClose} className="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <div>
                     <p>Thank you.</p>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};

export default ThankYouModal;