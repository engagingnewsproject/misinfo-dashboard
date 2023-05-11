import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'
import moment from "moment";
import Image from 'next/image';
import { db } from '../../config/firebase'
import { Country, State, City }  from 'country-state-city';
import { getDoc, getDocs, doc, setDoc, collection, updateDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, uploadBytesResumable } from 'firebase/storage';
import csc from "country-state-city";
import auth from "@firebase/auth";
import Select from "react-select";

const NewReport = ({ setNewReportModal, handleNewReportSubmit }) => {
    // if (!open) return null
    // Ref to firebase reports collection
    const dbInstance = collection(db, 'reports');
    const router = useRouter()
    const { user } = useAuth()
    // useStates
    const [data, setData] = useState({ country: "US", state: null, city: null })

    const [title, setTitle] = useState("")
    const [link, setLink] = useState("")
    const [secondLink, setSecondLink] = useState("")
    const [detail, setDetail] = useState("")
    // Image upload
    const [imageSelected, setImageSelected] = useState(false);
    
    
    const [imageList, setImageList] = useState([])
    // Get a reference to the storage service, which is used to create references in your storage bucket
    const storage = getStorage();
    const imgPicker = useRef(null)
    const [images, setImages] = useState([])
    const [imageURLs, setImageURLs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [update, setUpdate] = useState(false)
    const [allTopicsArr, setTopics] = useState([])
    const [selectedTopic, setSelectedTopic] = useState('')
    const [allSourcesArr, setSources] = useState([])
    const [selectedSource, setSelectedSource] = useState('')
    const [errors, setErrors] = useState({})
    

    
  
    const saveReport = (imageURLs) => {
        addDoc(dbInstance, {
            userID: user.email,
            state: data.state.name,
            city: data.city == null ? "N/A" : data.city.name,
            title: title,
            link: link,
            secondLink: secondLink,
            // images: imageURLs,
            images: imageURLs,
            detail: detail,
            createdDate: moment().toDate(),
            isApproved: true,
            read: false,
            topic: selectedTopic,
            hearFrom: selectedSource
        }).then(() => {
            handleNewReportSubmit(); // Send a signal to ReportsSection so that it updates the list 
        })
        
    }
    
    // Image upload (https://github.com/honglytech/reactjs/blob/react-firebase-multiple-images-upload/src/index.js, https://www.youtube.com/watch?v=S4zaZvM8IeI)
    const handleImageChange = (e) => {
    console.log('handle image change run');
        for (let i = 0; i < e.target.files.length; i++) {
            const newImage = e.target.files[i];
            setImages((prevState) => [...prevState, newImage]);
            setUpdate(!update)
        }
        setImageSelected(e.target.files.length > 0)
        
    };
    // Image upload to firebase
    const handleUpload = () => {
        const promises = [];
        images.map((image) => {
            const storageRef = ref(storage, `images/report_${new Date().getTime().toString()}-${image.name}`)
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
    
    // TODO: delete file option after upload
    // TODO: also. . . on report delete, delete the attached images as well
    // const handleImageDelete = (image) => {
    // console.log(image);
    //     // Create a reference to the file to delete
    //     const storageRef = ref(storage, `images/report_${new Date().getTime().toString()}-${image.name}`)

    //     // Delete the file
    //     deleteObject(storageRef).then(() => {
    //     // File deleted successfully
    //         console.log('File deleted successfully');
    //     }).catch((error) => {
    //     // Uh-oh, an error occurred!
    //     });
    // }
    
    useEffect(() => {
        if (update) {
            handleUpload()
        }
    }, [update]);

    const handleChange = (e) => {

    }
    
    const handleNewReport = async (e) => {
        e.preventDefault()
        // TODO: Check for any errors
        const allErrors = {}
        if (data.state == null) {
            console.log("state error")
            allErrors.state = "Please enter a state."
        }
        if (data.city == null) {
            // Don't display the report, show an error message
            console.log("city error")
            allErrors.city = "Please enter a city."
            if (data.state != null && City.getCitiesOfState(
                data.state?.countryCode,
                data.state?.isoCode
                ).length == 0) {
                    console.log("No cities here")
                    delete allErrors.city
            }
        }
        if (selectedSource == '') {
            console.log("No source error")
            allErrors.source = "Please enter a source."
        }
        if (selectedTopic == '') {
            console.log("No topic selected")
            allErrors.topic = "Please enter a topic."
        }
        // if (images == '') {
        //     console.log('no images');
        // }
        setErrors(allErrors)
        // console.log(allErrors.length + "Error array length")

        if (Object.keys(allErrors).length == 0) {
            saveReport(imageURLs)
            setNewReportModal(false)
        } else {
            console.log("errors exist")
        }
        
    }

    // On mount, grab all the possible topic choices
    // to add to drop down list
    useEffect(() => {
        getAllTopics()
        getAllSources()
    }, []);
    
    async function getAllTopics() {
        const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
        const topicRef = await getDoc(topicDoc);
        const topics = topicRef.get("Topic")['active']
        setTopics(topics);
    }
    
    async function getAllSources() {
        const sourceDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
        const sourceRef = await getDoc(sourceDoc);
        const sources = sourceRef.get("Source")['active']
        setSources(sources)
    }
    
    const handleNewReportModalClose = async (e) => {
        e.preventDefault()
        setNewReportModal(false)
    }

    const isFormValid = () => {
        // at least one of the following fields is required: link, secondLink, detail, imageSelected
        return !!link || !!secondLink || !!detail || !!imageSelected;
    };

    return (
        <div>
            <div className="fixed top-0 left-0 w-full h-max bg-black bg-opacity-50 z-40">
                <div onClick={handleNewReportModalClose} className="flex overflow-y-auto justify-center items-center z-20 absolute top-0 left-0 w-full h-full">
                    <div onClick={(e) => {e.stopPropagation()}} className="flex-col justify-center items-center bg-white md:w-8/12 lg:w-6/12 h-auto rounded-2xl py-10 px-10 z-50">
                        <div className="flex justify-between w-full mb-5">
                            <div className="text-md font-bold text-blue-600 tracking-wide">Add New Report</div>
                            <button onClick={handleNewReportModalClose} className="text-gray-800">
                                <IoClose size={25}/>
                            </button>
                        </div>
                        <form onChange={handleChange} onSubmit={handleNewReport}>
                            <div className="mt-4 mb-0.5">
                                <Select
                                    className="border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="state"
                                    type="text"
                                    placeholder="State"
                                    value={data.state}
                                    options={State.getStatesOfCountry(data.country)}
                                    getOptionLabel={(options) => {
                                    return options["name"];
                                    }}
                                    getOptionValue={(options) => {
                                    return options["name"];
                                    }}                                
                                    label="state"
                                    onChange={(value => {
                                    setData(data=>({...data, state: value, city: null })) 
                                    })}
                                    />
                                {errors.state && data.state === null &&  (<span className="text-red-500">{errors.state}</span>)}    

                            </div>
                            <div className="mt-4 mb-0.5">
                                <Select
                                    className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="city"
                                    type="text"
                                    placeholder="City"
                                    value={data.city}
                                    options={City.getCitiesOfState(
                                    data.state?.countryCode,
                                    data.state?.isoCode
                                    )}
                                    getOptionLabel={(options) => {
                                    return options["name"];
                                    }}
                                    getOptionValue={(options) => {
                                    return options["name"];
                                    }}                                 
                                    onChange={
                                        (value => {
                                            setData(data=>({
                                                ...data,
                                                city: value !== null ? value : null
                                            })) 
                                        })
                                    }
                                
                                    />
                                    {errors.city && data.city === null &&  (<span className="text-red-500">{errors.city}</span>)}
                            </div>

                            <div className="mt-4 mb-0.5">
                                <input
                                    className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="title"
                                    type="text"
                                    placeholder="Report Title"
                                    required
                                    onChange={(e) => setTitle(e.target.value)}
                                    value={title}
                                    />
                            </div>
                            <div className="mt-4 mb-0.5">
                                <Select
                                    className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="topic-selection"
                                    type="text"
                                    placeholder="Topic"
                                    
                                    options={allTopicsArr.map(topic => ({ label: topic, value: topic }))}
                                                                
                                    onChange={(selectedOption) => {
                                        setSelectedTopic(selectedOption.value)
                                    }}
                                    value={selectedTopic.value}
                                    />
                                    {errors.topic && selectedTopic === '' &&  (<span className="text-red-500">{errors.topic}</span>)}
                            </div>
                            <div className="mt-4 mb-0.5">
                                <Select
                                    className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="source-selection"
                                    type="text"
                                    placeholder="Source"
                                    
                                    options={allSourcesArr.map(source => ({ label: source, value: source }))}
                                                                
                                    onChange={(selectedOption) => {
                                        setSelectedSource(selectedOption.value)
                                    }}
                                    value={selectedSource.value}
                                    />
                                    {errors.source && selectedSource === '' &&  (<span className="text-red-500">{errors.source}</span>)}
                            </div>
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="link"
                                    type="text"
                                    placeholder="Link"
                                    onChange={(e) => setLink(e.target.value)}
                                    value={link}
                                    required={!isFormValid()}/>
                            </div>
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="secondLink"
                                    type="text"
                                    placeholder="Second Link"
                                    onChange={(e) => setSecondLink(e.target.value)}
                                    value={secondLink}
                                    />
                            </div>
                            <div className="mt-4 mb-0.5">
                                <textarea
                                    className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="detail"
                                    type="text"
                                    placeholder="Detail"
                                    onChange={(e) => setDetail(e.target.value)}
                                    value={detail}
                                    rows="5"
                                    required={!isFormValid()}></textarea>
                            </div>
                            <span className="text-sm text-gray-700 mt-4 mb-.5">Add Image</span>
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
                                    required={!isFormValid()}/>
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
                                    type="submit">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default NewReport