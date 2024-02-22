import Modal from 'react-modal';
import React,{ useState,useEffect,useRef } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'
import moment from "moment";
import Image from 'next/image';
import { db } from '../../config/firebase'
import { getDoc, getDocs, doc, setDoc, collection, updateDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, uploadBytesResumable } from 'firebase/storage';

const ContactHelpModal = ({ setContactHelpModal }) => {
  const dbInstance = collection(db, 'helpRequests');
  const router = useRouter()
  const { user } = useAuth()

  //image upload
  const [imageList, setImageList] = useState([])

  //set form fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);

  const saveContactHelp = (imageURLs) => {
    addDoc(dbInstance, {
      subject: subject,
      message: message,
      imageList: imageList
    }).then(() => {
        //handle submit etc
    })
    
}

  const handleImageChange = (e) => {
    console.log('handle image change run');
        for (let i = 0; i < e.target.files.length; i++) {
            const newImage = e.target.files[i];
            setImages((prevState) => [...prevState, newImage]);
            setUpdate(!update)
        }
    };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Send email logic here: NodeMailer

    // Reset form after submission
    setSubject('');
    setMessage('');
    setScreenshot(null);

    // Close the modal
    setContactHelpModal(false);
  };

  return (
    <div>
      <div onClick={() => setContactHelpModal(false)} className="z-[1200] fixed top-0 left-0 w-full h-full bg-black opacity-60">
              </div>
              <div className="flex overflow-y-auto justify-center items-center absolute top-0 left-0 w-full h-auto">
                  <div className="z-[1300] flex-col justify-center items-center bg-white w-10/12 lg:w-6/12 h-auto rounded-2xl mt-4 lg:mt-autopy-10 px-10"
                      onClick={(e) => {e.stopPropagation()}}>
                      <div className="flex justify-between w-full mb-5">
                          <button onClick={() => setContactHelpModal(false)} className="text-gray-800">
                              <IoClose size={25}/>
                          </button>
                          <h3 className={header}>Contact us for help!</h3>
                          <form>
                            <div className="mt-4 mb-0.5">
                              {/* <input
                                  className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                  id="subject"
                                  type="text"
                                  placeholder="Add a subject"
                                  required
                                  /> */}
                              </div>
                              <div className="mt-4 mb-0.5">
                              {/* <input
                                  className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                  id="message"
                                  type="text"
                                  placeholder="Add a message"
                                  required
                                  /> */}
                              </div>
                              <div className="mt-3 sm:mt-6">
                                {/* <button
                                    className="w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                    onClick={handleSubmitClick}
                                    type="submit">
                                    Create
                                </button> */}
                            </div>
                          </form>
                      </div>
                    </div>
                  </div>
                </div>          
  );
};

export default ContactHelpModal;