import React, { useState, useEffect, useRef } from 'react'
// import { reportSystems } from './SettingsReport'
import { reportSystems } from '../pages/report';
import { IoMdArrowRoundBack } from 'react-icons/io'
import { BiCheckCircle, BiXCircle, BiRightArrowCircle } from "react-icons/bi";
import { setDoc, getDoc, doc, addDoc, collection } from "firebase/firestore"; 
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { State, City }  from 'country-state-city';
import Link from "next/link"
import moment from "moment";
import Image from 'next/image'
import Select from "react-select";

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
    const [selectedTopic, setSelectedTopic] = useState("")
    const [sources, setSources] = useState([])
    const [selectedSource, setSelectedSource] = useState("")
    const [errors, setErrors] = useState({})

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
        reminderStart: "Start btn",
        reminderNoShow: "Do not show this again.",
        locationTitle: "Where are you located?",
        topicTitle: 'What is the potential information about?',
        sourceTitle: 'Where did you see the potential misinformation?',
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
        atLeast:"We need at least one of the following: a link, a photo, or a detailed description.",
        thanksTitle: 'Thank you',
        thanksText: "We investigate as many reports as possible, although we aren't always able to get to everything. When we're able, we'd love to share the results of our investigation.",
        thanksView:"View my Report",
        viewReportTitle: 'Title',
        viewReportLinks: 'Links',
        viewReportImage: 'Image Upload',
        viewReportDetails: 'Detail Description',
        viewReportButton: 'View All Reports'
    }
    
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
        form: 'flex w-96 h-full justify-center self-center overflow-visible',
        viewWrapper: 'flex flex-col gap-2 mt-4 overflow-visible',
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
        })
    }
    
    // //
    // Data
    // //
    const getData = async() => {
        const docRef = await getDoc(doc(db, "reports", user.uid))
    }
    
    // Get topics
    async function getAllTopics() {
        const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
        const topicRef = await getDoc(topicDoc);
        const topics = topicRef.get("Topic")['active']
        setAllTopicsArr(topics);
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
    
    const handleSubmitClick = (e) => {
        e.preventDefault()
        if (!title) {
            alert('Title is required')
        } else if (images == '' && !detail && !link) {
            alert('We need at least one of the following: a link, a photo, or a detailed description.')
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
    
    // Image upload to firebase
    const handleUpload = () => {
        const promises = [];
        images.map((image) => {
            const storageRef = ref(storage, `report_${new Date().getTime().toString()}.png`)
            const uploadTask = uploadBytesResumable(storageRef, image)
            promises.push(uploadTask);
            uploadTask.on( "state_changed",
                (snapshot) => {
                    // console.log(snapshot);
                },
                (error) => {
                    console.log(error);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        // console.log('File available at', downloadURL);
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
        // console.log('REPORT VALUE CHANGED: ' + e.target.id + ': ' + e.target.value);
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
        <div className={style.sectionContainer}>
            <div className={style.sectionWrapper}>
                {reportSystem > 0 && 
                <button onClick={onReportSystemPrevStep}>
                    <IoMdArrowRoundBack size={25} />
                </button>
                }
            </div>
            {reminderShow != false && reportSystem == 1 &&
                <div className={style.viewWrapperCenter}>
                    <button onClick={onReminderStart} className={style.button}>{t.reminderStart}</button>
                    <div className='flex items-center justify-center gap-2'>
                        <input 
                        onChange={onChangeCheckbox} 
                        checked={disableReminder}
                        type="checkbox" id="noShow" name="noShow" />
                        <label htmlFor="noShow">{t.reminderNoShow}</label>
                    </div>
                    <Image src="/img/reminder.png" width={156} height={120} alt="reminderShow"/>
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
                    </div>
                </div>
            }
            <div className={style.viewWrapper}>
                <form onChange={handleChange} onSubmit={handleNewReport} className={style.form}>
                    {/* Location */}
                    {reportSystem == 2 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>
                            {t.locationTitle}
                        </div>
                        {/* State */}
                        <Select
                            className={style.inputSelect}
                            id="state"
                            type="text"
                            placeholder="State"
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
                            <button onClick={() => setReportSystem(reportSystem + 1)} className={style.sectionIconButtonWrap}>
                                <BiRightArrowCircle size={40} className={style.sectionIconButton}/>
                            </button>
                        }
                    </div>
                    }
                    {/* Topic tag */}
                    {reportSystem == 3 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>{t.topicTitle}</div>
                        {allTopicsArr.map((topic, i) => (
                            <>
                            <label key={i+'-'+topic} className={topic === selectedTopic ? style.inputRadioChecked : style.inputRadio}>
                            {/* Topic Tag Input */}
                            <input
                            className="absolute opacity-0"
                            id='topic'
                            type="radio"
                            checked={selectedTopic === topic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            value={topic}
                            />
                            {topic}</label>
                            </>
                        ))}
                        {errors.topic && selectedTopic === '' &&  (<span className="text-red-500">{errors.topic}</span>)}
                        {selectedTopic != '' && 
                            <button onClick={() => setReportSystem(reportSystem + 1)} className={style.sectionIconButtonWrap}>
                                <BiRightArrowCircle size={40} className={style.sectionIconButton} />
                            </button>
                        }
                    </div>
                    }
                    {/* Source tag */}
                    {reportSystem == 4 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>{t.sourceTitle}</div>
                        {sources.map((source, i) => (
                            <>
                            <label key={i+'-'+source} className={source === selectedSource ? style.inputRadioChecked : style.inputRadio}>
                            {/* Source tag input */}
                            <input
                            className="absolute opacity-0"
                            id='source'
                            type="radio"
                            checked={selectedSource === source}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            value={source}
                            />
                            {source}</label>
                            </>
                        ))}
                        {errors.source && selectedSource === '' &&  (<span className="text-red-500">{errors.source}</span>)}
                        {selectedSource != '' && 
                            <button onClick={() => setReportSystem(reportSystem + 1)} className={style.sectionIconButtonWrap}>
                                <BiRightArrowCircle size={40} className={style.sectionIconButton} />
                            </button>
                        }
                    </div>
                    }
                    {/* TODO: add agency dropdown */}
                    {/* Details */}
                    {reportSystem == 5 &&
                    <div className={style.viewWrapper}>
                        <div className={style.sectionH1}>
                        {t.share}
                        </div>
                        <div className="flex gap-2 flex-col">
                            <div className={style.sectionH2}>
                                {t.title}
                            </div>
                            <div>
                                {t.titleDescription}
                            </div>
                            <div className={style.sectionSub}>
                                {t.max}
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
                                placeholder="Briefly describe"
                                onChange={(e) => setTitle(e.target.value)}
                                value={title}
                            />
                            <div className={style.sectionH2}>
                                {t.detail}
                            </div>
                            <div>
                                {t.detailDescription}
                            </div>
                            <div className={style.sectionH2}>
                                {t.link}
                            </div>
                            <input
                                className={style.inputSingle}
                                id="link"
                                type="text"
                                placeholder="https://"
                                onChange={(e) => setLink(e.target.value)}
                                value={link}
                            />
                            <input
                                className={style.inputSingle}
                                id="secondLink"
                                type="text"
                                placeholder="https://"
                                onChange={(e) => setSecondLink(e.target.value)}
                                value={secondLink}
                            />
                            <div className={style.sectionH2}>
                                {t.image}
                            </div>
                            <div>
                                {t.imageDescription}
                            </div>
                            <label className="block">
                                <span className="sr-only">Choose files</span>
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
                            {t.detailed}
                            </div>
                            <div>
                            {t.detailedDescription}
                            </div>
                            <textarea
                            className={style.inputTextarea}
                            id="detail"
                            type="text"
                            placeholder={t.describe}
                            onChange={(e) => setDetail(e.target.value)}
                            value={detail}
                            rows="5"
                            ></textarea>
                            {/* onClick={() => setReportSystem(7)}  */}
                            <button onClick={handleSubmitClick} className={style.button} type="submit">
                            Submit
                            </button>
                        </div>
                    </div>
                    }
                </form>
                {/* Thank you */}
                {reportSystem == 6 &&
                <div className={style.viewWrapper + ' items-center'}>
                    <Image src="/img/reportSuccess.png" width={156} height={120} alt="report success"/>
                    <div className={style.sectionH1}>
                        {t.thanksTitle}
                    </div>
                    <div className='text-center'>{t.thanksText}</div>
                    <button onClick={() => setReportSystem(reportSystem + 1)} className={style.button}>
                        {t.thanksView}
                    </button>
                </div>
                }
                {/* View Report */}
                {reportSystem == 7 &&
                <div className={style.viewWrapper}>
                    {/* Title */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t.viewReportTitle}
                        </div>
                        {title}
                    </div>
                    {/* Links */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t.viewReportLinks}
                        </div>
                        {link !== '' && 
                            <div>
                            {link}
                            </div>
                        }
                        {secondLink !== '' && 
                            <div>
                            {secondLink}
                            </div>
                        }
                    </div>
                    {/* Image upload */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t.viewReportImage}
                        </div>
                            <div className="flex w-full overflow-y-auto">
                                {imageURLs.map((image, i) => {
                                    return (
                                        <div className="flex mr-2" key={i}>
                                            <Link href={image} target="_blank">
                                                <Image src={image} width={100} height={100} alt="image"/>
                                            </Link>
                                        </div>
                                    )
                                })}
                            </div>
                    </div>
                    {/* Details */}
                    <div className={style.inputSingle}>
                        <div className={style.sectionH2}>
                            {t.viewReportDetails}
                        </div>
                        {detail}
                    </div>
                    <button onClick={() => setReportSystem(0)} className={style.button}>
                        {t.viewReportButton}
                    </button>
                </div>
                }
            </div>
        </div>
    )
}

export default ReportSystem