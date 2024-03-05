import React,{ useState,useEffect,useRef } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'
import moment from "moment";
import Image from 'next/image';
import { db } from '../../config/firebase'
import { getDoc, getDocs, doc, setDoc, collection, updateDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, uploadBytesResumable } from 'firebase/storage';

const ContactHelpModal = ({ setContactHelpModal, handleContactHelpSubmit }) => {
  const dbInstance = collection(db, 'helpRequests');
  const router = useRouter()
  const { user } = useAuth()
  const storage = getStorage();
  //image upload
  const imgPicker = useRef(null)

  //set form fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [update, setUpdate] = useState(false)
  const [contactHelpState, setContactHelpState] = useState(0)
  const [errors, setErrors] = useState({})
  const [images, setImages] = useState([])
  const [imageURLs, setImageURLs] = useState([]);

  const saveContactHelp = (imageURLs) => {
    addDoc(dbInstance, {
      userID: user.accountId,
      createdDate: moment().toDate(),
      subject: subject,
      message: message,
      images: imageURLs
    }).then(() => {
      handleContactHelpSubmit();
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

  // Image upload to firebase
  const handleUpload = () => {
    const promises = [];
    images.map((image) => {
        const storageRef = ref(storage, `report_${new Date().getTime().toString()}.png`)
        const uploadTask = uploadBytesResumable(storageRef, image)
        promises.push(uploadTask);
        uploadTask.on( "state_changed",
            (snapshot) => {
                console.log(snapshot);
            },
            (error) => {
                console.log(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log('File available at', downloadURL);
                    setImageURLs(
                        (prev) => [...prev, downloadURL]
                    )
                });
            }
        );
    });

    Promise.all(promises)
    .catch((err) => console.log(err));
};

const handleSubjectChange = (e) => {
  e.preventDefault()
  setSubject(e.target.value)
  //setContactHelpState(1)
}

const handleMessageChange = (e) => {
  e.preventDefault()
  setMessage(e.target.value)
  //setReportState(2)
}

const handleContactHelpClose = async (e) => {
  e.preventDefault()
  setContactHelpModal(false)
}

const handleSubmitButton = (e) => {
  e.preventDefault()
  if (!subject) {
      alert('Subject is required')
  } else if (images == '') {
      alert('We need at least one image.')
  } else {
      if (images.length > 0) {
          setUpdate(!update)
      }
      saveContactHelp(imageURLs)
      setContactHelpModal(false)
  }
}

const handleContactHelp = async (e) => {
  e.preventDefault()
  handleSubmitButton(e)
}
const handleChange = (e) => {
  // console.log('Report value changed.');
}

  useEffect(() => {
    if (update) {
        handleUpload()
    }
}, [update]);

  return (
    <div className="bk-white h-full w-full">
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[1200]">
            <div 
                onClick={handleContactHelpClose} 
                className={`flex overflow-y-auto justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full`}>
                {/* <div onClick={handleNewReportModalClose} className="flex overflow-y-auto justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full"> */}
                    <div onClick={(e) => {e.stopPropagation()}} className={`flex-col justify-center items-center bg-white md:w-8/12 lg:w-6/12 h-auto rounded-2xl py-10 px-10 z-50`}>
                        <div className="flex justify-between w-full mb-5">
                            <div className="text-md font-bold text-blue-600 tracking-wide">Contact Help Form</div>
                            <button onClick={handleContactHelpClose} className="text-gray-800">
                                <IoClose size={25}/>
                            </button>
                        </div>
                        <form onChange={handleChange} onSubmit={handleContactHelp}>
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="subject"
                                    type="text"
                                    placeholder="Add a subject"
                                    required
                                    onChange={handleSubjectChange}
                                    value={subject}
                                    />
                            </div>
                            
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="message"
                                    type="text"
                                    placeholder="Add a message"
                                    required
                                    onChange={handleMessageChange}
                                    value={message}
                                    />
                            </div>
                            
                            <div className="mt-4 mb-0.5">
                                <label className="block">
                                    <span className="sr-only">Choose files</span>
                                    <input className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer" 
                                    id="multiple_files" 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    // onChange={(e) => {onImageChange(e) }}
                                    onChange={(e) => {
                                        handleImageChange(e)
                                    }}
                                    ref={imgPicker}
                                    />
                                </label>
                                <div className="flex shrink-0 mt-2 space-x-2">
                                    {imageURLs.map((url, i) => (
                                    <div className='relative'>
                                        <Image src={url} key={i} width={100} height={100} alt={`image-upload-${i}`}/>
                                    </div>
                                    ))}
                                </div>
                            </div>
                          
                            <div className="mt-3 sm:mt-6">
                                <button
                                    className="w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                    onClick={handleSubmitButton}
                                    type="submit">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
  );
};

export default ContactHelpModal;