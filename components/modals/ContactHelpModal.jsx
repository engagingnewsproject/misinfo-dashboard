import React,{ useState,useEffect,useRef } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'
import moment from "moment";
import Image from 'next/image';
import { db } from '../../config/firebase'
import { getDoc, getDocs, doc, setDoc, collection, updateDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { useTranslation } from 'next-i18next';

const ContactHelpModal = ({ setContactHelpModal, handleContactHelpSubmit }) => {

  // Spanish translation
  const {t} = useTranslation("Welcome")

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
  const [image, setImage] = useState([])
  const [imageURLs, setImageURLs] = useState([]);

  const saveContactHelp = (imageURLs) => {
    addDoc(dbInstance, {
      userID: user.accountId,
      createdDate: moment().toDate(),
      subject: subject,
      message: message,
      images: imageURLs
    }).then(() => {
        null
      //handleContactHelpSubmit();
      //let's add handling for admins here later...
    })
  }
    
    // Image upload (https://github.com/honglytech/reactjs/blob/react-firebase-multiple-images-upload/src/index.js, https://www.youtube.com/watch?v=S4zaZvM8IeI)
    const handleImageChange = (e) => {
      console.log(e.target.files[0])
      setImage(e.target.files[0])
      setUpdate(true)
  };

    // Function to handle the upload of images to Firebase Storage
    const handleUpload  = () => {
      // Array to store promises for each upload task
      const promises = [];
      // Iterate through each image
      
      // Check if the image is in HEIC format and window object is available (client-side)
      if (image?.type === "image/heic" && typeof window !== "undefined") {
          // Convert HEIC image to JPEG format
          convertToJPEG(image).then((jpegImage) => {

        
          // Generate unique file name with .jpg extension
          const fileName = `report_${new Date().getTime()}.jpg`;

          // Create a reference to the storage location with the file name
          const storageRef = ref(storage, fileName);

          // Upload the JPEG image to Firebase Storage
          const uploadTask = uploadBytesResumable(storageRef, jpegImage);

          // Add the upload task to the promises array
          promises.push(uploadTask);

          // Handle the upload task (monitor progress and completion)
          handleUploadTask(uploadTask);
         });

      } else {
          // If the image is not in HEIC format or window object is not available
          // Extract file extension from the image name
          const fileExtension = image.name.split(".").pop().toLowerCase();

          // Generate unique file name with original extension
          const fileName = `report_${new Date().getTime()}.${fileExtension}`;

          // Create a reference to the storage location with the file name
          const storageRef = ref(storage, fileName);

          // Upload the image to Firebase Storage
          const uploadTask = uploadBytesResumable(storageRef, image);

          // Add the upload task to the promises array
          promises.push(uploadTask);
         
          // Handle the upload task (monitor progress and completion)
          handleUploadTask(uploadTask)
      }
        
      setUpdate(false)

      // Wait for all upload tasks to complete and catch any errors
      Promise.all(promises).catch((err) => console.log(err));
  };
    // Function to handle upload task (monitor progress and completion)
    const handleUploadTask = (uploadTask) => {
      // Monitor the state changes of the upload task
      uploadTask.on(
          "state_changed",
          (snapshot) => {
              // Progress callback (optional)
              console.log(snapshot);

          },
          (error) => {
              // Error callback (if any)
              console.log(error);
          },
          () => {
              // Completion callback (when upload is successful)
              // Get the download URL of the uploaded file
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                  // Log the download URL (optional)
                  console.log('File available at', downloadURL);
                   const newURLs = [...imageURLs];
                   newURLs.push(downloadURL)
                 
                  // // Update the state with the download URL (to display or use later)
                   setImageURLs(newURLs);
              });
          }
      );
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
  } else if (!message){
    alert('Message is required') 
  } else if (image == '') {
      alert('We need at least one screenshot.')
  } else {
      if (image) {
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
    <div className="fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto">
        <div 
            onClick={handleContactHelpClose} 
            className={`flex overflow-y-auto justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full`}>
            <div onClick={(e) => {e.stopPropagation()}} className={`flex-col justify-center items-center bg-white md:w-8/12 lg:w-6/12 h-auto rounded-2xl py-10 px-10 z-50`}>
                <div className="flex justify-between w-full mb-5">
                    <div className="text-md font-bold text-blue-600 tracking-wide">{t("contactHelp")}</div>
                    <button onClick={handleContactHelpClose} className="text-gray-800">
                        <IoClose size={25}/>
                    </button>
                </div>
                <div>
                    <div className="mt-4 mb-0.5">
                        <input
                            className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="subject"
                            type="text"
                            placeholder={t("addSubject")}
                            required
                            onChange={handleSubjectChange}
                            value={subject}
                            />
                    </div>
                    
                    <div className="mt-4 mb-0.5">
                        <textarea
                            class="peer h-full min-h-[200px] resize-none border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight px-3 py-2.5 focus:outline-none focus:shadow-outline transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 disabled:resize-none disabled:border-0 disabled:bg-blue-gray-50"
                            id="message"
                            type="text"
                            placeholder={t("addMessage")}
                            required
                            onChange={handleMessageChange}
                            value={message}></textarea>
                    </div>
                    <div className="text-sm font-bold text-blue-600 tracking-wide mt-4">  
                      {t("uploadScreenshot")}
                     
                     
                    </div>
                      {/* Image upload */}
                      <div className="mt-4 mb-0.5">
                      <label className="block">
                          <button className="block w-full mr-4 py-2 px-4 rounded-full border-none text-sm font-semibold  bg-sky-100 text-blue-500 hover:bg-blue-100 cursor-pointer">
                          <label for="multiple_files">{t("chooseFiles")}</label></button>
                          <input className="hidden" 
                          name="files[]"
                          id="multiple_files" 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          title=""
                          // onChange={(e) => {onImageChange(e) }}
                          onChange={handleImageChange}
                          ref={imgPicker}
                          />
                      </label>
                      <div className="flex shrink-0 mt-2 space-x-2">
                          {imageURLs.map((url, i) => (
                          <div className='relative'>
                              <Image src={url} key={i} width={100} height={100} alt={`image-upload-${i}`}/>
                              {/* TODO: delete file after upload */}
                              {/* <IoClose size={15} color='white' className='absolute top-0 right-0' onClick={handleImageDelete}/> */}
                          </div>
                          ))}
                      </div>
                  </div>
                    <div className="mt-3 sm:mt-6">
                        <button
                            className="w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                            onClick={handleSubmitButton}
                            type="submit">
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ContactHelpModal;