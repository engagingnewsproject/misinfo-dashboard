import React, { useState, useEffect } from 'react'
import UpdatePwModal from './modals/UpdatePwModal'
import UpdateEmailModal from './modals/UpdateEmailModal';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';
import { useRouter } from 'next/router'
import { 
	collection,
  getDocs,
  query,
  where
	} from '@firebase/firestore'
  import { db } from "../config/firebase"
// Profile page that allows user to edit password or logout of their account
const Profile = () => {

  const { user } = useAuth()
  const [openModal, setOpenModal] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const [agencies, setAgencies] = useState([])
  const { logout } = useAuth()

  const router = useRouter()
  
  	// //
	// Data
	// //
	const getData = async () => {
		const agencyCollection = collection(db, 'agency')
		const q = query(agencyCollection, where('agencyUsers', "array-contains", user.accountId));
		const snapshot = await getDocs(q)
		try {
			var arr = []
			snapshot.forEach((doc) => {
				arr.push({
					[doc.id]: doc.data(),
				})
			})
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
	}
  
  // //
	// Effects
	// //
	useEffect(() => {
		getData()
	})
	
  
  const handleLogout = () => {
    logout()
    router.push('/login')
  }


  const basicStyle = "flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"

  return (
    <div className="w-full h-auto">
      <div className="z-0 flex-col p-16">
        <div className="text-xl font-extrabold text-blue-600 tracking-wider">Account</div>
          <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">
            {agencies.length > 1 ? 'Agencies' : 'Agency'}
            <div className='text-xs text-blue-300 text-left flex gap-2'><pre>agencyUsers</pre> view</div>
            </div>
              <div className='flex gap-2 mx-6 my-2 tracking-normal items-center'>
                <div className="font-light">
                {agencies.map((agencyObj, i) => {
                  const agency = Object.values(agencyObj)[0]
                  return (
                    <div className='' key={i+'-'+agency.name}>
                    {agency.name}
                    </div>
                  )
                })}
                </div>
                {/* <button
                    onClick={() => setEmailModal(true)}
                    className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                    Edit Agency
                </button> */}
              </div>
          </div>
          <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Email</div>
              <div className='flex gap-2 mx-6 my-2 tracking-normal items-center'>
                <div className="font-light">{user.email}</div>
                <button
                    onClick={() => setEmailModal(true)}
                    className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                    Edit Email
                </button>
              </div>
          </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Reset Password</div>
            <button
                onClick={() => setOpenModal(true)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Password
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Logout</div>
            <button
                onClick={() => setLogoutModal(true)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Logout
            </button>
        </div>
      </div>
      {openModal && <UpdatePwModal setOpenModal={setOpenModal} />}
      {emailModal && <UpdateEmailModal setEmailModal={setEmailModal} />}
      {logoutModal && <ConfirmModal
                func={handleLogout}
                title="Are you sure you want to log out?"
                subtitle=""
                CTA="Log out"
                closeModal={setLogoutModal}
                />}
    </div>

  )
}

export default Profile