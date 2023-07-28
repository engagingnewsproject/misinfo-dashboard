import React, { useState, useEffect, useRef } from 'react'
import { reportSystems } from './SettingsReport'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { BiCheckCircle, BiXCircle, BiRightArrowCircle } from "react-icons/bi";
import { setDoc, getDoc, doc, addDoc, collection } from "firebase/firestore"; 
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { State, City }  from 'country-state-city';
import Image from 'next/image'
import Select from "react-select";

const setData = async(reportSystem, list, user) => {
    const docRef = await getDoc(doc(db, "reports", user.uid))
    // const updatedDocRef = await setDoc(doc(db, "reports", user.uid), {
    //     ...docRef.data(),
    //     [reportSystems[reportSystem]]: {
    //         list: list,
    //     }
    // });
    // return updatedDocRef
}

const ReportSystem = ({ reportSystem, setReportSystem }) => {
    const dbInstance = collection(db, 'reports');
    const { user } = useAuth()
    const [data, setData] = useState({ country: "US", state: null, city: null })
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const storage = getStorage();
    const imgPicker = useRef(null)
    const [images, setImages] = useState([])
    const [imageURLs, setImageURLs] = useState([]);
    const [update, setUpdate] = useState(false)
    const [title, setTitle] = useState("")
    const [link, setLink] = useState("")
    const [secondLink, setSecondLink] = useState("")
    const [detail, setDetail] = useState("")
    const [allTopicsArr, setTopics] = useState([])
    const [selectedTopic, setSelectedTopic] = useState("")
    const [sources, setSources] = useState([])
    const [selectedSource, setSelectedSource] = useState("")
    const [errors, setErrors] = useState({})
    console.log(allTopicsArr);
    console.log(reportSystem);
    // //
    // Text content
    // //
    const t = {
        reminderTitle: "Reminder",
        reminderDescription:
            "This system is only for reports of possible fake information at the local or state level.",
        reminderExample: "Example:",
        reminderCorrect: "Flight prices sky-high in Austin.",
        reminderIncorrect: "US officially marks 1 million American deaths from Covid.",
        reminderStart: "Start",
        reminderNoShow: "Do not show this again.",
          share: "Share more information",
        title: "Title *",
        titleDescription: "Please provide a title for the potential misinformation",
        max: "(Max: 160 characters.)",
        detail: "Details *",
        detailDescription:
            "Please share as much as you can. We need at least one of the following: a link, a photo, or a detailed description.",
        link: "Links",
        image: "Image Upload",
        imageDescription:
            "You can upload screenshots or photos of the potential misinformation",
        uploadImage: "Upload Images",
        detailed: "Detailed Description",
        detailedDescription:
            "Please provide more details about the potential misinformation, such as where you saw it and what it said.",
        describe: "Describe in detail",
        submit: "Submit",
        titleRequired:"Title is required",
        alertTitle:"Alert",
        atLeast:"We need at least one of the following: a link, a photo, or a detailed description."
    }
    
    // //
	// Styles
	// //
	const style = {
		section_container: 'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-visible',
		section_wrapper: 'flex items-center',
        button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
	}
    
    // //
    // Save Report
    // //
    const saveReport = (imageURLs) => {
        addDoc(dbInstance, {
            userID: user.email,
            state: data.state.name,
            city: data.city == null ? "N/A" : data.city.name,
            title: title,
            link: link,
            secondLink: secondLink,
            images: imageURLs,
            detail: detail,
            createdDate: moment().toDate(),
            isApproved: true,
            read: false,
            topic: selectedTopic,
            hearFrom: selectedSource
        }).then(() => {
            console.log('Success: report saved');
            // handleNewReportSubmit(); // Send a signal to ReportsSection so that it updates the list 
        })
    }
    
    // //
    // Data
    // //
    const getData = async() => {
        const docRef = await getDoc(doc(db, "reports", user.uid))
        try {
            // const { [reportSystems[reportSystem]]: reportsData } = docRef.data()
            // setList(reportsData.list)
        } catch (error) {
            // setData(reportSystem, list, user)
            console.log(error)
        }
    }
    
    // Get topics
    async function getAllTopics() {
        const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
        const topicRef = await getDoc(topicDoc);
        const topics = topicRef.get("Topic")['active']
        setTopics(topics);
    }
    
    // Get sources
    async function getAllSources() {
        const sourceDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
        const sourceRef = await getDoc(sourceDoc);
        const sources = sourceRef.get("Source")['active']
        setSources(sources)
    }
    
    // //
    // Handlers
    // //
    const handleDontShowAgain = () => {
        setDontShowAgain(!dontShowAgain)
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
        if (images == '') {
            console.log('no images');
        }
        setErrors(allErrors)
        console.log(allErrors.length + "Error array length")

        if (Object.keys(allErrors).length == 0) {
            saveReport(imageURLs)
        }
    }
    
    // Image upload (https://github.com/honglytech/reactjs/blob/react-firebase-multiple-images-upload/src/index.js, https://www.youtube.com/watch?v=S4zaZvM8IeI)
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
    
    const handleChange = (e) => {
        console.log('Report value changed.');
    }
    
    // //
    // Effects
    // //
    
    // On page load (mount), update the tags from firebase
    useEffect(() => {
        getData()
        getAllTopics()
        getAllSources()
    }, [])
    
    useEffect(() => {
        if (update) {
            handleUpload()
        }
    }, [update]);

    return (
        <div className={style.section_container}>
            <div className={style.section_wrapper}>
                <button onClick={() => setReportSystem(reportSystem == 3 ? reportSystem == 0 : reportSystem - 1)}>
                    <IoMdArrowRoundBack size={25} />
                </button>
            </div>
            {reportSystem == 1 &&
                <div className='flex flex-col gap-2 items-center'>
                    <Image src="/img/reminder.png" width={156} height={120} alt="reminder"/>
                    <div className="text-xl px-5 font-extrabold text-blue-600 tracking-wider">
                        {reportSystem == 1 ? t.reminderTitle : reportSystems[reportSystem]}
                    </div>
                    <div>{t.reminderDescription}</div>
                    <div>{t.reminderExample}</div>
                    <div className='flex flex-col gap-2'>
                        <div className='flex gap-3'>
                            <BiCheckCircle size={25} color='green' />
                            {t.reminderCorrect}
                        </div>
                        <div className='flex gap-3'>
                            <BiXCircle size={25} color='red' />
                            {t.reminderIncorrect}
                        </div>
                        <button onClick={() => setReportSystem(3)} className={style.button} type="submit">
                            <div className="px-2 font-normal tracking-wide">{t.reminderStart}</div>
                        </button>
                        <div className='flex items-center justify-center gap-2'>
                            <input 
                            onChange={handleDontShowAgain} 
                            checked={dontShowAgain}
                            type="checkbox" id="noShow" name="noShow" />
                            <label htmlFor="noShow">{t.reminderNoShow}</label>
                        </div>
                    </div>
                </div>
            }
            <div className="flex gap-2 flex-col overflow-visible">
                <form onChange={handleChange} onSubmit={handleNewReport}>
                {reportSystem == 3 &&
                    <>
                        <div>Where are you located?</div>
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
                        {data.state != null && 
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
                        }
                        {errors.city && data.city === null &&  (<span className="text-red-500">{errors.city}</span>)}
                        {data.city != null && 
                            <button onClick={() => setReportSystem(reportSystem + 1)} >
                                <BiRightArrowCircle size={30} />
                            </button>
                        }
                    </>
                }
                {reportSystem == 4 &&
                    <>
                        <div>What is the potential information about?</div>
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
                        {selectedTopic != '' && 
                            <button onClick={() => setReportSystem(reportSystem + 1)} >
                                <BiRightArrowCircle size={30} />
                            </button>
                        }
                    </>
                }
                {/* Source */}
                {reportSystem == 5 &&
                    <>
                        <div>Where did you see the potential misinformation?</div>
                        <Select
                            className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="source-selection"
                            type="text"
                            placeholder="Source"
                            
                            options={sources.map(source => ({ label: source, value: source }))}
                                                        
                            onChange={(selectedOption) => {
                                setSelectedSource(selectedOption.value)
                            }}
                            value={selectedSource.value}
                        />
                        {errors.source && selectedSource === '' &&  (<span className="text-red-500">{errors.source}</span>)}
                        {selectedSource != '' && 
                            <button onClick={() => setReportSystem(reportSystem + 1)} >
                                <BiRightArrowCircle size={30} />
                            </button>
                        }
                    </>
                }
                {/* Details */}
                {reportSystem == 6 &&
                    <>
                        <div className="flex gap-2 flex-col">
                            <div>{t.share}</div>
                            <div>{t.title}</div>
                            <div>{t.titleDescription}</div>
                            <div>{t.max}</div>
                                <input
                                    className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="title"
                                    type="text"
                                    placeholder="Briefly describe"
                                    required
                                    onChange={(e) => setTitle(e.target.value)}
                                    value={title}
                                />
                                <div>{t.detail}</div>
                                <div>{t.detailDescription}</div>
                                {t.link}
                                <input
                                    className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="link"
                                    type="text"
                                    placeholder="https://"
                                    required
                                    onChange={(e) => setLink(e.target.value)}
                                    value={link}
                                />
                                <input
                                    className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="secondLink"
                                    type="text"
                                    placeholder="https://"
                                    onChange={(e) => setSecondLink(e.target.value)}
                                    value={secondLink}
                                />
                                <div>{t.image}</div>
                                <div>{t.imageDescription}</div>
                                <label className="block">
                                    <span className="sr-only">Choose files</span>
                                    <input className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer" 
                                    id="multiple_files" 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    onChange={(e) => {
                                        handleImageChange(e)
                                    }}
                                    ref={imgPicker}
                                    />
                                </label>
                                <div>
                                {t.detailed}
                                </div>
                                <div>
                                {t.detailedDescription}
                                </div>
                                <textarea
                                    className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="detail"
                                    type="text"
                                    placeholder={t.describe}
                                    required
                                    onChange={(e) => setDetail(e.target.value)}
                                    value={detail}
                                    rows="5"
                                    ></textarea>
                                <button onClick={() => setReportSystem(7)} className={style.button} >
                            Submit
                            </button>
                        </div>
                    </>
                }
                {/* {reportSystem > 1 && 
                     <button onClick={() => setReportSystem(reportSystem + 1)} >
                         <BiRightArrowCircle size={30} />
                     </button>
                } */}
            </form>
        </div>
        </div>
    )
}

export default ReportSystem