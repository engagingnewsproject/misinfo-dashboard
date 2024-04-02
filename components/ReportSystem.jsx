import React, { useState, useEffect, useRef } from 'react'
import { reportSystems } from '../pages/report';
import { IoMdArrowRoundBack } from 'react-icons/io'
import { BiCheckCircle, BiXCircle, BiRightArrowCircle } from "react-icons/bi";
import { setDoc, getDoc, doc, addDoc, collection, getDocs } from "firebase/firestore"; 
import { getStorage, ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { State, City }  from 'country-state-city';
import Link from "next/link"
import moment from "moment";
import Image from 'next/image'
import Select from "react-select";
import {  useTranslation } from 'next-i18next'

const ReportSystem = ({ 
    tab, 
    setTab, 
    reportSystem, 
    setReportSystem,
    reminderShow,
    onChangeCheckbox,
    onReminderStart,
    onReportSystemPrevStep,
    disableReminder
    }) => {

    // used for Spanish translations
    const {t} = useTranslation("NewReport")

    // console.log('disableReminder: '+disableReminder+' ||| reminderShow: '+reminderShow);
    const dbInstance = collection(db, 'reports');
    const { user } = useAuth()
    const [data, setData] = useState({ country: "US", state: null, city: null })
    const [isSearchable, setIsSearchable] = useState(true);
    const storage = getStorage();
    const [reportId, setReportId] = useState('')
    const imgPicker = useRef(null)
    const [images, setImages] = useState([])
    const [imageURLs, setImageURLs] = useState([]);
    const [update, setUpdate] = useState(false)
    const [title, setTitle] = useState("")
    const [link, setLink] = useState("")
    const [secondLink, setSecondLink] = useState("")
    const [detail, setDetail] = useState("")
    const [allTopicsArr, setAllTopicsArr] = useState([])
    const [agencies, setAgencies] = useState([]);
    const [selectedAgency, setSelectedAgency] = useState('');
    const [selectedTopic, setSelectedTopic] = useState("")
    const [sources, setSources] = useState([])
    const [selectedSource, setSelectedSource] = useState("")
    const [errors, setErrors] = useState({})
    const [showOtherTopic, setShowOtherTopic] = useState(false)
    const [showOtherSource, setShowOtherSource] = useState(false)
    const [otherTopic, setOtherTopic] = useState("")
    const [otherSource, setOtherSource] = useState("")
    const [list, setList] = useState([])
    const [sourceList, setSourceList] = useState([])
    const [active, setActive] = useState([])
    const [activeSources, setActiveSources] = useState([])

    // //
    // Text content
    // //
    // const t = {
    //     reminderTitle: "Reminder",
    //     reminderDescription:
    //         "This system is only for reports of possible fake information at the local or state level.",
    //     reminderExample: "Example:",
    //     reminderCorrect: "Flight prices sky-high in Austin.",
    //     reminderIncorrect: "US officially marks 1 million American deaths from Covid.",
    //     reminderStart: "Start",
    //     reminderNoShow: "Do not show this again.",
    //     locationTitle: "Where are you located?",
    //     agencyTitle: 'Which agency would you like to report to?',
    //     topicTitle: 'What is the potential information about?',
    //     sourceTitle: 'Where did you see the potential misinformation?',
    //     share: "Share more information",
    //     title: "Title *",
    //     titleDescription: "Please provide a title for the potential misinformation",
    //     max: "(Max: 160 characters.)",
    //     detail: "Details *",
    //     detailDescription:
    //         "Please share as much as you can. We need at least one of the following: a link, a photo, or a detailed description.",
    //     link: "Links",
    //     image: "Image Upload",
    //     imageDescription:
    //         "You can upload screenshots or photos of the potential misinformation",
    //     uploadImage: "Upload Images",
    //     detailed: "Detailed Description",
    //     detailedDescription:
    //         "Please provide more details about the potential misinformation, such as where you saw it and what it said.",
    //     describe: "Describe in detail",
    //     submit: "Submit",
    //     titleRequired:"Title is required",
    //     alertTitle:"Alert",
    //     atLeast:"We need at least one of the following: a link, a photo, or a detailed description.",
    //     thanksTitle: 'Thank you',
    //     thanksText: "We investigate as many reports as possible, although we aren't always able to get to everything. When we're able, we'd love to share the results of our investigation.",
    //     thanksView:"View my Report",
    //     viewReportTitle: 'Title',
    //     viewReportLinks: 'Links',
    //     viewReportImage: 'Image Upload',
    //     viewReportDetails: 'Detail Description',
    //     viewReportButton: 'View All Reports'
    // }
    
    // //
    // Styles
    // //
    const style = {
        sectionContainer: 'w-full h-full flex flex-col mb-5 overflow-visible',
        sectionWrapper: 'flex items-center',
        sectionH1: 'text-2xl font-bold',
        sectionH2: 'text-blue-600',
        sectionSub: 'text-sm',
        sectionIconButtonWrap: 'self-end',
        sectionIconButton: 'fill-blue-600',
        form: 'flex w-96 h-full justify-center self-center',
        viewWrapper: 'flex flex-col gap-2 mt-4 px-5',
        viewWrapperCenter: 'flex flex-col gap-2 mt-8 items-center',
        inputSelect: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
        inputSingle: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline',
        inputCheckboxWrap: 'flex',
        inputRadio: 'bg-blue-600 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500',
        inputRadioChecked: 'bg-blue-800 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500',
        inputImage: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
        inputTextarea: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
        button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
    }

    // //
    // Save Report
    // //
    const saveReport = (imageURLs) => {
        const newReportRef = doc(collection(db, "reports"));
        setReportId(newReportRef.id) // set report id
        setDoc(newReportRef, {
            userID: user.accountId,
            state: data.state.name,
            city: data.city == null ? "N/A" : data.city.name,
            agency: selectedAgency,
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
            console.log('Success: report saved: ' + reportId);
            addNewTag(selectedTopic, selectedSource)
        })
    }
    
    // //
    // Data
    // //
    const getData = async() => {
        const docRef = await getDoc(doc(db, "reports", user.uid))
    }
    
    async function getAllAgencies() {
        // Get agency collection docs
        const agencyRef = await getDocs(collection(db, "agency"));
		try {
            // build an array of agency names
			var arr = []
			agencyRef.forEach((doc) => {
				arr.push(
					doc.data()['name']
				)
			})
            // set the agencies state with the agency names
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
    }
    
    // Get topics
    async function getAllTopics() {
        const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
        const topicRef = await getDoc(topicDoc);
        let topics = topicRef.get("Topic")['active']
        let topicsSorted = topics
        topicsSorted.sort((a, b) => {
            if (a === "Other") return 1; // Move "Other" to the end
            if (b === "Other") return -1; // Move "Other" to the end
            return a.localeCompare(b); // Default sorting for other elements
        });
        setAllTopicsArr(topicsSorted);
    }
    
    // Get sources
    async function getAllSources() {
        const sourceDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
        const sourceRef = await getDoc(sourceDoc);
        const sources = sourceRef.get("Source")['active']
        let sourcesSorted = sources
        sourcesSorted.sort((a, b) => {
            if (a === "Other") return 1; // Move "Other" to the end
            if (b === "Other") return -1; // Move "Other" to the end
            return a.localeCompare(b); // Default sorting for other elements
        });
        setSources(sourcesSorted)
    }
    
    // //
    // Handlers
    // //
    
    const handleSubmitClick = (e) => {
        e.preventDefault()
        if (!title) {
            alert(t('titleRequired'))
        } else if (images == '' && !detail && !link) {
            alert(t('atLeast'))
        } else {
            if (images.length > 0) {
                setUpdate(!update)
            }
            saveReport(imageURLs)
            setReportSystem(7)
        }
    }
    
    const handleNewReport = async (e) => {
        e.preventDefault()
        const allErrors = {}
        if (data.state == null) {
            console.log("state error")
            allErrors.state = t('state')
        }
        if (data.city == null) {
            // Don't display the report, show an error message
            console.log("city error")
            allErrors.city = t('city')
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
            allErrors.source = t('source')
        }
        if (selectedTopic == '') {
            console.log("No topic selected")
            allErrors.topic = t('specify_topic')
        }
        if (images == '') {
            console.log('no images');
        }
        setErrors(allErrors)
        console.log(allErrors.length + "Error array length")

        if (Object.keys(allErrors).length == 0) {
            handleSubmitClick(e)
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
    
    // Function to handle the upload of images to Firebase Storage
    const handleUpload = () => {
        // Array to store promises for each upload task
        const promises = [];
    
        // Iterate through each image
        images.map(async (image) => {
            // Check if the image is in HEIC format and window object is available (client-side)
            if (image.type === "image/heic" && typeof window !== "undefined") {
                // Convert HEIC image to JPEG format
                const jpegImage = await convertToJPEG(image);
    
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
                handleUploadTask(uploadTask);
            }
        });
    
        // Wait for all upload tasks to complete and catch any errors
        Promise.all(promises).catch((err) => console.log(err));
    };
    
    // Function to convert HEIC image to JPEG format
    const convertToJPEG = async (heicImage) => {
        // Import the heic2any library dynamically
        const heic2any = await import("heic2any");
    
        // Convert the HEIC image to JPEG format
        return await heic2any.default({ blob: heicImage, toType: "image/jpeg" });
    };
    
    // Function to handle upload task (monitor progress and completion)
    const handleUploadTask = (uploadTask) => {
        // Monitor the state changes of the upload task
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                // Progress callback (optional)
                // console.log(snapshot);
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
                    // console.log('File available at', downloadURL);
    
                    // Update the state with the download URL (to display or use later)
                    setImageURLs((prev) => [...prev, downloadURL]);
                });
            }
        );
    };

    const handleTopicChange = (e) => {
        setSelectedTopic(e.target.value)
        if (e.target.value === "Other/Otro") {
            setShowOtherTopic(true)
        } else {
            setShowOtherTopic(false)
        }
    }

    const handleSourceChangeOther = (e) => {
        setSelectedSource(e.target.value)
        if (e.target.value === "Other/Otro") {
            setShowOtherSource(true)
        } else {
            setShowOtherSource(false)
        }
    }

    const handleOtherTopicChange = (e) => {
        setOtherTopic(e.target.value)
        setSelectedTopic(e.target.value)
    }

    const handleOtherSourceChange = (e) => {
        setOtherSource(e.target.value)
        setSelectedSource(e.target.value)
    }

    const addNewTag = (tag, source) => {
        let topicArr = list
        let sourceArr = sourceList
        topicArr.push(tag)
        sourceArr.push(source)
        setList(topicArr)
        setSourceList(sourceArr)
        updateTopicTags(list, user, sourceList)
    }

    const updateTopicTags = async(topicList, user, sourceList) => {
        const docRef = await getDoc(doc(db, "tags", user.uid))
        const updatedDocRef = await setDoc(doc(db, "tags", user.uid), {
            ...docRef.data(),
            ['Topic']: {
                list: topicList,
                active: active
            },
            ['Source']: {
                list: sourceList,
                active: activeSources
            }
        });
        return updatedDocRef
    }

    const getTopicList = async() => {
        try {
            const docRef = await getDoc(doc(db, "tags", user.uid))
            const { ['Topic']: tagsData } = docRef.data()
            setList(tagsData.list)
            tagsData.active.sort((a, b) => {
                if (a === "Other") return 1; // Move "Other" to the end
                if (b === "Other") return -1; // Move "Other" to the end
                return a.localeCompare(b); // Default sorting for other elements
            });
            setActive(tagsData.active)
            
        } catch (error) {
            console.log(error)
        }
    }

    const getSourceList = async() => {
        try {
            const docRef = await getDoc(doc(db, "tags", user.uid))
            const { ['Source']: tagsData } = docRef.data()
            setSourceList(tagsData.list)
            tagsData.active.sort((a, b) => {
                if (a === "Other") return 1; // Move "Other" to the end
                if (b === "Other") return -1; // Move "Other" to the end
                return a.localeCompare(b); // Default sorting for other elements
            });
            setActiveSources(tagsData.active)
            
        } catch (error) {
            console.log(error)
        }
    }
    
    const handleChange = (e) => {
        // console.log('REPORT VALUE CHANGED: ' + e.target.id + ': ' + e.target.value);
    }
    
    // //
    // Effects
    // //
    // On page load (mount), update the tags from firebase
    useEffect(() => {
        getData()
        getAllAgencies()
        getAllTopics()
        getAllSources()
        getTopicList()
        getSourceList()
    }, [])
    
    useEffect(() => {
        if (update) {
            handleUpload()
        }
    }, [update]);
    
    return (
        <div className={style.sectionContainer}>
            <div className={style.sectionWrapper}>
                {reportSystem > 0 && reportSystem < 7 && 
                <button onClick={onReportSystemPrevStep}>
                    <IoMdArrowRoundBack size={25} />
                </button>
                }
            </div>
            {reminderShow != false && reportSystem == 1 &&
                <div className={style.viewWrapperCenter}>
                    <Image src="/img/reminder.png" width={156} height={120} alt="reminderShow" className='object-cover w-auto'/>
                    <div className="text-xl px-5 font-extrabold text-blue-600 tracking-wider">
                        {reportSystem == 1 ? t('reminder') : reportSystems[reportSystem]}
                    </div>
                    <div>{t('description')}</div>
                    <div>{t('example')}</div>
                    <div className='flex flex-col gap-2'>
                        <div className='flex gap-3'>
                            <BiCheckCircle size={25} color='green' />
                            {t('correct')}
                        </div>
                        <div className='flex gap-3'>
                            <BiXCircle size={25} color='red' />
                            {t('incorrect')}
                        </div>
                    </div>
                    <button onClick={onReminderStart} className={style.button}>{t('start')}</button>
                    <div className='flex items-center justify-center gap-2'>
                        <input 
                        onChange={onChangeCheckbox} 
                        checked={disableReminder}
                        type="checkbox" id="noShow" name="noShow" />
                        <label htmlFor="noShow">{t('noShow')}</label>
                    </div>
                </div>
            }
            <div className={style.viewWrapper}>
                <form onChange={handleChange} onSubmit={handleNewReport} className={style.form}>
                    {/* Location */}
                    {reportSystem == 2 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>
                            {t('location')}
                        </div>
                        {/* State */}
                        <Select
                            className={style.inputSelect}
                            id="state"
                            type="text"
                            placeholder={t('state_text')}
                            isSearchable={isSearchable}
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
                        {/* City */}
                        {data.state != null && 
                            <Select
                                className={style.inputSelect}
                                id="city"
                                type="text"
                                placeholder={t('city_text')}
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
                            <button onClick={() => setReportSystem(reportSystem + 1)} className={style.sectionIconButtonWrap}>
                                <BiRightArrowCircle size={40} className={style.sectionIconButton}/>
                            </button>
                        }
                    </div>
                    }
                    {/* Agency */}
                    {reportSystem == 3 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>{t('which_agency')}</div>
                        {agencies.map((agency, i = self.crypto.randomUUID()) => (
                            <label key={i} className={agency === selectedAgency ? style.inputRadioChecked : style.inputRadio}>
                            {/* Agency Input */}
                            <input
                                className="absolute opacity-0"
                                id='agency'
                                type="radio"
                                checked={selectedAgency === agency}
                                onChange={(e) => setSelectedAgency(e.target.value)}
                                value={agency}
                            />
                            {agency}</label>
                        ))}
                        {errors.agency && selectedAgency === '' &&  (<span className="text-red-500">{errors.agency}</span>)}
                        {selectedAgency != '' && 
                            <button 
                            onClick={() => setReportSystem(reportSystem + 1)} 
                            className={style.sectionIconButtonWrap} 
                            type='submit'>
                                <BiRightArrowCircle size={40} className={style.sectionIconButton} />
                            </button>
                        }
                    </div>
                    }
                    {/* Topic tag */}
                    {reportSystem == 4 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>{t('about')}</div>
                        {[...allTopicsArr.filter(topic => topic !== "Other/Otro"), ...allTopicsArr.filter(topic => topic === "Other/Otro")].map((topic, i) => (
                            <label key={i+'-'+topic} className={topic === selectedTopic ? style.inputRadioChecked : style.inputRadio}>
                            {/* Topic Tag Input */}
                            <input
                                className="absolute opacity-0"
                                id='topic'
                                type="radio"
                                checked={selectedTopic === topic}
                                onChange={
                                    // create a custom function 
                                    // (e) => setSelectedTopic(e.target.value)
                                    handleTopicChange
                                }
                                value={topic}
                            />
                            {topic}</label>
                        ))}
                        {errors.topic && selectedTopic === '' &&  (<span className="text-red-500">{errors.topic}</span>)}
                        {showOtherTopic && (
                            <div className="">
                            <div className="text-zinc-500">
                                {t('custom_topic')}
                                </div>
                            <input
                                id="topic-other"
                                className="rounded shadow-md border-zinc-400 w-full"
                                type="text"
                                placeholder="Please specify the topic."
                                onChange={handleOtherTopicChange}
                                value={otherTopic}
                                style={{ fontSize: '14px' }}
                            />
                            </div>
                        )}
                        {selectedTopic != '' && 
                            <button 
                            onClick={() => setReportSystem(reportSystem + 1)} 
                            className={style.sectionIconButtonWrap} 
                            type='submit'>
                                <BiRightArrowCircle size={40} className={style.sectionIconButton} />
                            </button>
                        }
                    </div>
                    }
                    {/* Source tag */}
                    {reportSystem == 5 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>{t('where')}</div>
                        {[...sources.filter(source => source !== "Other/Otro"), ...sources.filter(source => source === "Other/Otro")].map((source, i=self.crypto.randomUUID()) => (
                            <label key={i} className={source === selectedSource ? style.inputRadioChecked : style.inputRadio}>
                            {/* Source tag input */}
                            <input
                            className="absolute opacity-0"
                            id='source'
                            type="radio"
                            checked={selectedSource === source}
                            onChange={
                                handleSourceChangeOther
                            }
                            value={source}
                            />
                            {source}</label>
                        ))}
                        {errors.source && selectedSource === '' &&  (<span className="text-red-500">{errors.source}</span>)}
                        {showOtherSource && (
                                            <div className="">
                                            <div className="text-zinc-500">
                                                {t('custom_source')}
                                                </div>
                                                <input
                                                    id="topic-other"
                                                    className="rounded shadow-md border-zinc-400 w-full"
                                                    type="text"
                                                    placeholder="Please specify the source."
                                                    onChange={handleOtherSourceChange}
                                                    value={otherSource}
                                                    style={{ fontSize: '14px' }}
                                                />
                                                </div>
                                        )}
                        {selectedSource != '' && 
                            <button onClick={() => setReportSystem(reportSystem + 1)} className={style.sectionIconButtonWrap}>
                                <BiRightArrowCircle size={40} className={style.sectionIconButton} />
                            </button>
                        }
                    </div>
                    }
                    {/* TODO: add agency dropdown */}
                    {/* Details */}
                    {reportSystem == 6 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>
                        {t('share')}
                        </div>
                        <div className="flex gap-2 flex-col">
                            <div className={style.sectionH2}>
                                {t('title_text')}
                            </div>
                            <div>
                                {t('provide_title')}
                            </div>
                            <div className={style.sectionSub}>
                                {t('max')}
                            </div>
                            {/* Title input */}
                            {/*
                            TODO: only one of the details inputs are required. 
                            - Links
                            - Image Upload
                            - Detailed Description
                            . . . so user only has to fill in one of the the above
                            */}
                            <input
                                className={style.inputSingle}
                                id="title"
                                type="text"
                                placeholder={t('briefly')}
                                onChange={(e) => setTitle(e.target.value)}
                                value={title}
                            />
                            <div className={style.sectionH2}>
                                {t('detail')}
                            </div>
                            <div>
                                {t('detailDescription')}
                            </div>
                            <div className={style.sectionH2}>
                                {t('linkFirst')}
                            </div>
                            <input
                                className={style.inputSingle}
                                id="link"
                                type="text"
                                placeholder="https://"
                                onChange={(e) => setLink(e.target.value)}
                                value={link}
                            />
                            {link &&
                                <input
                                    className={style.inputSingle}
                                    id="secondLink"
                                    type="text"
                                    placeholder="https://"
                                    onChange={(e) => setSecondLink(e.target.value)}
                                    value={secondLink}
                                />
                            }
                            <div className={style.sectionH2}>
                                {t('image')}
                            </div>
                            <div>
                                {t('imageDescription')}
                            </div>
                            <label className="block">
                                <span className="sr-only">{t('choose_files')}</span>
                                <input className={style.inputImage} 
                                id="multiple_files" 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleImageChange}
                                ref={imgPicker}
                                />
                            </label>
                            <div className={style.sectionH2}>
                            {t('detailed')}
                            </div>
                            <div>
                            {t('detailedDescription')}
                            </div>
                            <textarea
                            className={style.inputTextarea}
                            id="detail"
                            type="text"
                            placeholder={t('describe')}
                            onChange={(e) => setDetail(e.target.value)}
                            value={detail}
                            rows="5"
                            ></textarea>
                            {/* onClick={() => setReportSystem(7)}  */}
                            <button onClick={handleSubmitClick} className={style.button} type="submit">
                            {t('submit')}
                            </button>
                        </div>
                    </div>
                    }
                </form>
                {/* Thank you */}
                {reportSystem == 7 &&
                <div className={style.viewWrapper + ' items-center'}>
                    <Image src="/img/reportSuccess.png" width={156} height={120} alt="report success" className='object-cover w-auto'/>
                    <div className={style.sectionH1}>
                        {t('thankyou')}
                    </div>
                    <div className='text-center'>{t('thanksText')}</div>
                    <button onClick={() => setReportSystem(reportSystem + 1)} className={style.button}>
                        {t('view')}
                    </button>
                </div>
                }
                {/* View Report */}
                {reportSystem == 8 &&
                <div className={style.viewWrapper}>
                    {/* Title */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t('title_text')}
                        </div>
                        {title}
                    </div>
                    {/* Links */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t('links')}
                        </div>
                        {(link || secondLink != '') ? <>{link}<br></br>{secondLink}</> : t('noLinks')}
                    </div>
                    {/* Image upload */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t('image')}
                        </div>
                            <div className="flex w-full overflow-y-auto">
                                {imageURLs.map((image, i = self.crypto.randomUUID()) => {
                                    return (
                                        <div className="flex mr-2" key={i}>
                                            <Link href={image} target="_blank">
                                                <Image src={image} width={100} height={100} className='w-auto' alt="image"/>
                                            </Link>
                                        </div>
                                    )
                                })}
                            </div>
                    </div>
                    {/* Details */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t('detailed')}
                        </div>
                        {detail ? detail : `No description provided.`}
                    </div>
                    <button onClick={() => setReportSystem(0)} className={style.button}>
                        {t('backReports')}
                    </button>
                </div>
                }
            </div>
        </div>
    )
}

export default ReportSystem