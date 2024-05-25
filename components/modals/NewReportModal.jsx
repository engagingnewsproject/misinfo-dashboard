// TODO: need to make sure the user who created the report is added to the report: userID
import React,{ useState,useEffect,useRef } from 'react'
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
import Select from "react-select";
import {  useTranslation } from 'next-i18next'

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

    const [imageList, setImageList] = useState([])
    // Get a reference to the storage service, which is used to create references in your storage bucket
    const storage = getStorage();
    const imgPicker = useRef(null)
    const [images, setImages] = useState([])
    const [imageURLs, setImageURLs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [update, setUpdate] = useState(false)
    const [allTopicsArr, setTopics] = useState([])
    const [agencies, setAgencies] = useState([]);
    const [selectedAgency, setSelectedAgency] = useState('');
    const [selectedTopic, setSelectedTopic] = useState("")
    const [otherTopic, setOtherTopic] = useState("")
    const [otherSource, setOtherSource] = useState("")
    const [showOtherTopic, setShowOtherTopic] = useState(false)
    const [showOtherSource, setShowOtherSource] = useState(false)
    const [list, setList] = useState([])
    const [sourceList, setSourceList] = useState([])
    const [active, setActive] = useState([])
    const [activeSources, setActiveSources] = useState([])
    const [allSourcesArr, setSources] = useState([])
    const [selectedSource, setSelectedSource] = useState("")
    const [reportState, setReportState] = useState(0)
    const [errors, setErrors] = useState({})

    const {t} = useTranslation("NewReport")

    const saveReport = (imageURLs) => {
        addDoc(dbInstance, {
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
            label: '',
            read: false,
            topic: selectedTopic,
            hearFrom: selectedSource
        }).then(() => {
            handleNewReportSubmit(); // Send a signal to ReportsSection so that it updates the list
            addNewTag(selectedTopic, selectedSource)
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
        // console.log('Report value changed.');
    }
    
    const handleStateChange = (e) => {
        setData(data=>({...data, state: e, city: null })) 
        setReportState(1)
    }
    
    const handleCityChange = (e) => {
        setData(data=>({...data,city: e !== null ? e : null })) 
        setReportState(2)
    }
    
    const handleAgencyChange = (e) => {
        setSelectedAgency(e.value)
        setReportState(3)
    }
    
    const handleTitleChange = (e) => {
        e.preventDefault()
        setTitle(e.target.value)
        reportState < 4 && setReportState(4)
    }
    
    const handleTopicChange = (e) => {
        setSelectedTopic(e.value)
        if (e.value === t("Other")) {
            setShowOtherTopic(true)
        } else {
            setShowOtherTopic(false)
        }
        setReportState(5)
    }

    const handleSourceChangeOther = (e) => {
        setSelectedSource(e.value)
        if (e.value === t("Other")) {
            setShowOtherSource(true)
        } else {
            setShowOtherSource(false)
        }
        setReportState(6)
    }

    const addNewTag = (tag, source) => {
        let topicArr = list
        let sourceArr = sourceList
        if (!topicArr.includes(tag)) {
            topicArr.push(tag)
        }
        if (!sourceArr.includes(source)) {
            sourceArr.push(source)
        }
        setList(topicArr)
        setSourceList(sourceArr)
        updateTopicTags(list, user, sourceList)
    }

    const getTopicList = async() => {
        try {
            const docRef = await getDoc(doc(db, "tags", user.uid))
            const { ['Topic']: tagsData } = docRef.data()
            setList(tagsData.list)
            tagsData.active.sort((a, b) => {
                if (a === t("Other")) return 1; // Move "Other" to the end
                if (b === t("Other")) return -1; // Move "Other" to the end
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

    const handleOtherTopicChange = (e) => {
        setOtherTopic(e.target.value)
        setSelectedTopic(e.target.value)
    }


    const handleOtherSourceChange = (e) => {
        setOtherSource(e.target.value)
        setSelectedSource(e.target.value)
    }
    
    const handleSubmitClick = (e) => {
        e.preventDefault()
        if (!title) {
            alert(t("titleRequired"))
        } else if (images == '' && !detail && !link) {
            alert(t("atLeast"))
        } else {
            if (images.length > 0) {
                setUpdate(!update)
            }
            saveReport(imageURLs)
            setNewReportModal(false)
        }
    }
    
    const handleNewReport = async (e) => {
        e.preventDefault()
        // TODO: Check for any errors
        const allErrors = {}
        if (data.state == null) {
            console.log("state error")
            allErrors.state = t("state")
        }
        if (data.city == null) {
            // Don't display the report, show an error message
            console.log("city error")
            allErrors.city = t("city")
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
            allErrors.source = t("source")
        }
        if (selectedTopic == '') {
            console.log("No topic selected")
            allErrors.topic = t("specify_topic")
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

    // On mount, grab all the possible topic choices
    // to add to drop down list
    useEffect(() => {
        getAllAgencies()
        getAllTopics()
        getAllSources()
        getTopicList()
        getSourceList()
    }, []);
    
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

    return (
        <div className="bk-white h-full w-full">
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[1200]">
            <div 
                onClick={handleNewReportModalClose} 
                className={`flex overflow-y-auto justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full`}>
                {/* <div onClick={handleNewReportModalClose} className="flex overflow-y-auto justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full"> */}
                    <div onClick={(e) => {e.stopPropagation()}} className={`flex-col justify-center items-center bg-white w-full h-full py-10 px-10 z-50 md:w-8/12 md:h-auto lg:w-6/12 rounded-2xl`}>
                        <div className="flex justify-between w-full mb-5">
                            <div className="text-md font-bold text-blue-600 tracking-wide">{t("add_report")}</div>
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
                                    required
                                    placeholder={t("state_text")}
                                    value={data.state}
                                    options={State.getStatesOfCountry(data.country)}
                                    getOptionLabel={(options) => {
                                    return options["name"];
                                    }}
                                    getOptionValue={(options) => {
                                    return options["name"];
                                    }}                                
                                    label="state"
                                    onChange={handleStateChange}
                                    />
                                {errors.state && data.state === null &&  (<span className="text-red-500">{errors.state}</span>)}    

                            </div>

                            <div className="mt-4 mb-0.5">
                                <Select
                                    className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="city"
                                    type="text"
                                    placeholder={t("city_text")}
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
                                    onChange={handleCityChange}
                                    />
                                    {errors.city && data.city === null &&  (<span className="text-red-500">{errors.city}</span>)}
                            </div>
                            
                                <div className="mt-4 mb-0.5">
                                    <Select
                                        className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="agency-selection"
                                        type="text"
                                        placeholder={t("agency")}
                                        options={agencies.map(agency => ({ label: agency, value: agency }))}
                                        onChange={handleAgencyChange}
                                        value={selectedAgency.agency}
                                        />
                                        {errors.topic && selectedAgency === '' &&  (<span className="text-red-500">{errors.agency}</span>)}
                                </div>
                            
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="title"
                                    type="text"
                                    placeholder={t("add_title")}
                                    required
                                    onChange={handleTitleChange}
                                    value={title}
                                    />
                            </div>
                            
                                <div className="mt-4 mb-0.5">
                                    <Select
                                        className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="topic-selection"
                                        type="text"
                                        placeholder={t("topic")}
                                        options={allTopicsArr.map(topic => ({ label: topic, value: topic }))}
                                        onChange={handleTopicChange}
                                        value={selectedTopic.topic}
                                        />
                                        {errors.topic && selectedTopic === '' &&  (<span className="text-red-500">{errors.topic}</span>)}
                                        <div className="mt-4 mb-0.5">

                                        {showOtherTopic && (
                                            <div className="flex">
                                            <div className="mt-4 mb-0.5 text-zinc-500 pr-3">
                                                {t("custom_topic")}
                                                </div>
                                                <input
                                                    id="topic-other"
                                                    className="rounded shadow-md border-zinc-400 w-60"
                                                    type="text"
                                                    placeholder={t("specify_topic")}
                                                    onChange={handleOtherTopicChange}
                                                    value={otherTopic}
                                                    style={{ fontSize: '14px' }}
                                                />

                                                </div>
                                            )}
                                        </div>
                                </div>
                            <div className="mt-4 mb-0.5">
                                <Select
                                    className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="source-selection"
                                    type="text"
                                    placeholder="Source"
                                    options={allSourcesArr.map(source => ({ label: t(source), value: t(source) }))}
                                    onChange={handleSourceChangeOther}
                                    value={selectedSource.hearFrom}
                                    />

                                    {errors.source && selectedSource === '' &&  (<span className="text-red-500">{errors.source}</span>)}
                                    <div className="mt-4 mb-0.5">
                                    {showOtherSource && (
                                            <div className="flex">
                                            <div className="mt-4 mb-0.5 text-zinc-500 pr-3">
                                                {t("custom_source")}
                                                </div>
                                                <input
                                                    id="source-other"
                                                    className="rounded shadow-md border-zinc-400 w-60"
                                                    type="text"
                                                    placeholder={t("source")}
                                                    onChange={handleOtherSourceChange}
                                                    value={otherSource}
                                                    style={{ fontSize: '14px' }}
                                                />
                                                </div>
                                        )}
                                    </div>

                            </div>
                            <>
                                <div className="mt-4 mb-0.5">{t("detail")}</div>
                                <div className="mt-4 mb-0.5">
                                    <input
                                        className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="link"
                                        type="text"
                                        placeholder={t("link")}
                                        onChange={(e) => setLink(e.target.value)}
                                        value={link}
                                        />
                                </div>
                                <div className="mt-4 mb-0.5">
                                    <input
                                        className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="secondLink"
                                        type="text"
                                        placeholder={t("second_link")}
                                        onChange={(e) => setSecondLink(e.target.value)}
                                        value={secondLink}
                                        />
                                </div>
                                <div className="mt-4 mb-0.5">
                                    <textarea
                                        className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="detail"
                                        type="text"
                                        placeholder={t("detailed")}
                                        onChange={(e) => setDetail(e.target.value)}
                                        value={detail}
                                        rows="5"
                                        ></textarea>
                                </div>
                                <div className="mt-4 mb-0.5">
                                    <label className="block">
                                        <span className="sr-only">{t("choose_files")}</span>
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
                                        {imageURLs.map((url, i = self.crypto.randomUUID()) => (
                                        <div className='relative'>
                                            <Image src={url} key={i} width={100} height={100} alt={`image-upload-${i}`}/>
                                            {/* TODO: delete file after upload */}
                                            {/* <IoClose size={15} color='white' className='absolute top-0 right-0' onClick={handleImageDelete}/> */}
                                        </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                            <div className="mt-3 sm:mt-6">
                                <button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                    onClick={handleSubmitClick}
                                    type="submit">
                                    {t("createReport")}
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