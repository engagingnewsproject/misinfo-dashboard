import React, { useState, useEffect } from 'react'
import { tagSystems } from './Settings'
import NewTagModal from './modals/NewTagModal'
import RenameTagModal from './modals/RenameTagModal'
import ConfirmModal from './modals/ConfirmModal'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { AiOutlineSearch } from 'react-icons/ai'
import { FaPlus } from 'react-icons/fa'
import { GoDotFill } from 'react-icons/go'
import { MdModeEditOutline } from 'react-icons/md'
import { TiDelete } from 'react-icons/ti'
import { IoIosRadioButtonOn } from 'react-icons/io'
import { BsXCircleFill } from "react-icons/bs";
import { collection, query, where, setDoc, getDoc, getDocs, doc } from "firebase/firestore"; 
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import Image from 'next/image'

const maxTags = [0, 7, 10, 7] // default, Topic, Source, Labels (respectively)

const setData = async(tagSystem, list, active, agency) => {

  const docRef = await doc(db, "tags", agency)
  const docSnap = await getDoc(docRef);
  
  let updatedDocRef;
  if (docSnap.exists()) {
    updatedDocRef = await setDoc(doc(db, "tags", agency), {
        ...docSnap.data(),
        [tagSystems[tagSystem]]: {
            list: list,
            active: active
        }
    });

  // if doc doesn't already exist for agency in tags collection, create one.
  } else {
    console.log("Doc has not been created for the agency")
    // updatedDocRef = await setDoc(doc(db, "tags", agency), {
    //   [tagSystems[tagSystem]]: {
    //     list: list,
    //     active: active
    //   }
    // })

  }
    return updatedDocRef
}

const TagSystem = ({ tagSystem, setTagSystem, agencyID}) => {
    const [list, setList] = useState([])
    const [active, setActive] = useState([])

    const defaultTopics = ["Health","Other","Politics","Weather"] // tag system 1
    const defaultSources = ["Newspaper", "Other","Social","Website"] // tag system 2
    const defaultLabels = ["To Investigate", "Investigated: Flagged", "Investigated: Benign"] // tag system 3

    const tags = ["Topic", "Source", "Labels"]
    //const docRef = getDoc(db, "tags", tagSystem)
    const { user, customClaims, setCustomClaims} = useAuth()

    const [selected, setSelected] = useState("")
    const [search, setSearch] = useState("")
    const [searchResult, setSearchResult] = useState(list)
    const [newTagModal, setNewTagModal] = useState(false)
    const [renameModal, setRenameTagModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [maxTagsError, setMaxTagsError] = useState(false)

    // On page load (mount), update the tags from firebase
    useEffect(() => {
        getData(agencyID)
    }, [])

    const getData = (agencyID) => {

        // determine which agency the current user is a part of
        const agencyCollection = collection(db,"agency")
     
          console.log("current agency's ID is " + agencyID);
          const docRef = doc(db, "tags", agencyID)
          getDoc(docRef).then((docSnap)=> {
        
          if (docSnap.exists()) {
            console.log(tagSystem)
            console.log(tags[tagSystem - 1])
            console.log("Document data:", docSnap.get(tags[tagSystem - 1]));
            const tagsData = docSnap.get(tags[tagSystem - 1])
            console.log(tagsData)
              setList(tagsData.list)
              tagsData.active.sort((a, b) => {
                  if (a === "Other") return 1; // Move "Other" to the end
                  if (b === "Other") return -1; // Move "Other" to the end
                  return a.localeCompare(b); // Default sorting for other elements
              });
              setActive(tagsData.active)
          } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");
            setData(tagSystem, defaultTopics, defaultTopics, agencyId)
            setData(tagSystem, defaultLabels, defaultLabels, agencyId)
            setData(tagSystem, defaultSources, defaultSources, agencyId)

            console.log("tag system not correctly configured")
            
          }
        })
    }

    const updateTag = (e, updateType) => {
        switch (updateType) {
            case "activate":
                if (active.length == maxTags[tagSystem]) {
                    setMaxTagsError(true)
                } else {
                    active.push(search)
                }
                setSelected("")
                break
            case "deactivate":
                active.splice(active.indexOf(search), 1)
                setMaxTagsError(false)
                setSelected("")
                break
            case "delete":
                setSearchResult([])
                setDeleteModal(true)
                break
            case "rename":
                setSearchResult([])
                setRenameTagModal(true)
                break
        }
        setData(tagSystem, list, active, agencyID)
    }

    const deleteTag = () => {
        // e.preventDefault
        if (list.includes(selected)) {
            list.splice(list.indexOf(selected), 1)
        }
        if (active.includes(selected)) {
            active.splice(active.indexOf(selected), 1)
        }
        setSelected("")
        setData(tagSystem, list, active, agencyID)
        setDeleteModal(false)
    }

    const replaceTag = (tag) => {
        list[list.indexOf(selected)] = tag
        try {
            if (active.includes(selected)) {
                active[active.indexOf(selected)] = tag
            }
            setData(tagSystem,list,active,agencyID)
            setSelected("")
        } catch (error) {
            Sentry.captureException(error)
            console.error("Error in replaceTag:", error)
        }
    }

    const addNewTag = (tag) => {
        let arr = list
        arr.push(tag)
        setList(arr)
        setData(tagSystem, list, active, agencyID)
        setSearch("")
    }

    const handleAddNew = (e) => {
        e.preventDefault()
        setSearchResult([])
        setNewTagModal(true)
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (search.length == 0) return
    }

    const handleChange = (e) => {
        setSearch(e.target.value)
        setSearchResult(list.filter(i => i.toLowerCase().includes(search.toLowerCase())))
        setSelected("")
    }

    useEffect(() => {
        setSearchResult(list.filter(i => i.toLowerCase().includes(search.toLowerCase())))
    }, [search])

    useEffect(() => {
        setSearch(selected)
    }, [selected])

    return (
        <div className="z-0 flex flex-col p-4 sm:p-16 h-full" onClick={(e) => {
            if (e.target == e.currentTarget) {
                setSearchResult([])
                setSelected("")
            }
            }}>
                <div className="flex items-center">
                    <button onClick={() => setTagSystem(0)}>
                        <IoMdArrowRoundBack size={25} />
                    </button>
                    <div className="text-xl px-5 font-extrabold text-blue-600 tracking-wider">
                        {tagSystem == 3 ? "Customized " + tagSystems[tagSystem] : tagSystems[tagSystem] + " Tags"}
                    </div>
                    <div className="text-sm font-light">
                        {"Maximum: " + (maxTags[tagSystem] - 1) + " Tags (+Other)"}
                    </div>
                    {selected.length == 0 && !customClaims.admin ? 
                    <button
                        className={`flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline`}
                        type="submit"
                        onClick={handleAddNew}>
                        <FaPlus className="text-blue-600" size={12}/>
                        <div className="px-2 font-normal tracking-wide">{"New " + tagSystems[tagSystem]}</div>
                    </button> :
                    <div className="flex items-center ml-auto">
                       
                            <button
                                className="flex items-center shadow mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                                type="submit"
                                onClick={(e) => updateTag(e, "delete")}>
                                <TiDelete className="text-red-600" size={20}/>
                                <div className="px-2 font-normal tracking-wide">Delete</div>
                            </button>
                            <button
                                className="flex items-center shadow mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                                type="submit"
                                onClick={(e) => updateTag(e, "rename")}>
                                <MdModeEditOutline className="text-blue-600" size={18}/>
                                <div className="px-2 font-normal tracking-wide">Rename</div>
                            </button>
                            <button
                                className="flex items-center shadow bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                                type="submit"
                                onClick={(e) => active.includes(search) ? updateTag(e, "deactivate") : updateTag(e, "activate")}>
                                <IoIosRadioButtonOn className={active.includes(search) ? "text-red-600" : "text-green-600"} size={18}/>
                                <div className="px-2 font-normal tracking-wide">{active.includes(search) ? "Mark as Inactive" : "Mark as Active"}</div>
                            </button>
                    </div>}
                </div>
                <div className="relative">
                <form className="w-full mt-7 ml-2 relative" onChange={handleChange} onSubmit={handleSearch}>
                    <button 
                    className="p-1 absolute right-1 top-1 bg-blue-600 text-white rounded-xl" 
                    type='submit'>
                        <AiOutlineSearch size={25}/>
                    </button>
                    <input
                        className="shadow border-none rounded-xl w-full p-3 pr-11 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="search"
                        type="text"
                        placeholder="Search"
                        onChange={handleChange}
                        value={search}/>
                </form>
               
                {search.length > 0 &&
                <div className="shadow-lg absolute rounded-lg z-20 mt-2 w-1/2">
                    <div className="bg-white w-full rounded-lg">
                        {searchResult.map((item) => {
                            return (
                                !item.includes('Other') &&
                                <div onClick={() => {
                                setSelected(item)
                                setSearchResult([])
                            }} className="text-light text-sm rounded-lg leading-tight py-2 pl-4 hover:bg-indigo-100 cursor-pointer" key={item}>{item}</div>
                            )
                        })}
                    </div>
                </div>}
                </div>
                <div className="z-10 mt-12 pr-6">
                    {list.length == 0 ? 
                    <div className="grid bg-white w-full py-6 px-4 rounded-xl text-center items-center">
                        <Image src="svgs/warning.svg" width={156} height={120} className='w-auto' alt="warning"/>
                        <div className="py-3 text-sm">You have no tags right now</div>
                    </div>
                    : 
                    <div>
                        {active.length != 0 && 
                        <div className="grid w-full p-4 mb-2 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" onClick={(e) => {
                        if (e.target == e.currentTarget) {
                            setSearchResult([])
                            setSelected("")
                        }
                        }}>
                            {active.map((item) => {
                                return (
                                    !item.includes('Other') ?
                                        <div onClick={() => setSelected(item)} className="text-md font-light my-5 cursor-pointer leading-normal flex items-center justify-center" key={item}>
                                            <GoDotFill size={25} className="text-green-600"/>
                                            <div className="pl-2">{item}</div>
                                        </div> :
                                        <div className="text-md font-light my-5 leading-normal flex items-center justify-center" key={`other`}>
                                            <GoDotFill size={25} className="text-gray-400"/>
                                            <div className="pl-2">{`Other*`}</div>
                                        </div>
                                    // :
                                    // <div className="text-md font-light my-5 leading-normal flex items-center justify-center" key={item}>
                                    //     <GoDotFill size={25} className="text-green-600"/>
                                    //     <div className="pl-2">{item}</div>
                                    // </div>
                                )
                            })}
                        </div>}
                        { maxTagsError && <span className="pl-12 text-red-500 text-sm font-light">{"You may only enable " + maxTags[tagSystem] + " live tags"}</span>}
                        <div className="grid bg-white w-full p-4 mt-10 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" onClick={(e) => {
                        if (e.target == e.currentTarget) {
                            setSearchResult([])
                            setSelected("")
                        }
                        }}>
                        {list.map((item) => {
                            const normStyles = "text-md font-light p-2 my-3 md:mx-2 cursor-pointer leading-normal flex items-center justify-center"
                            const selectedStyles = normStyles + " bg-blue-600 text-white rounded-lg"
                            const randomKey = self.crypto.randomUUID(); // Generate random UUID
                            return (
                                    !item.includes('Other') &&
                                    <div onClick={() => setSelected(item)} className={selected == item ? selectedStyles : normStyles} key={randomKey}>
                                        { active.includes(item) && <GoDotFill size={25} className="text-green-600"/> }
                                        <div className="pl-2">{item}</div>
                                    </div>
                                // :
                                // <div className={`text-md font-light p-2 my-3 md:mx-2 leading-normal flex items-center justify-center`} key={randomKey}>
                                //     { active.includes(item) && <GoDotFill size={25} className="text-green-600"/> }
                                //     <div className="pl-2">{item}</div>
                                // </div>
                            )
                        })}
                        </div>
                    </div>}
                </div>
            {newTagModal && 
                <NewTagModal 
                    tagSystems={tagSystems}
                    tagSystem={tagSystem}
                    list={list}
                    setList={setList}
                    setNewTagModal={setNewTagModal}
                    addNewTag={addNewTag} 
                    />}
            {renameModal && 
                <RenameTagModal 
                    replaceTag={replaceTag}
                    selected={selected}
                    list={list}
                    setRenameTagModal={setRenameTagModal}
                    addNewTag={addNewTag} 
                    />}
            {deleteModal && 
                <ConfirmModal 
                    func={deleteTag}
                    title="Are you sure you want to delete this tag?"
                    subtitle="You will permanently remove this tag. You can not undo this action."
                    CTA="Delete"
                    closeModal={setDeleteModal}
                />}
            <div className='text-xs flex justify-center text-gray-500 mt-2'><p>* "Other" is a default that cannot be edited or removed.</p></div>
        </div>
    )
}

export default TagSystem