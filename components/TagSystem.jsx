import React, { useState, useEffect } from 'react'
import { tagSystems } from './Settings'
import NewTagModal from './modals/NewTagModal'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { AiOutlineSearch } from 'react-icons/ai'
import { FaPlus } from 'react-icons/fa'
import { GoPrimitiveDot } from 'react-icons/go'
import { MdModeEditOutline } from 'react-icons/md'
import { TiDelete } from 'react-icons/ti'
import { IoIosRadioButtonOn } from 'react-icons/io'
import warning from '../public/Dashboard/warning.svg'
import Image from 'next/image'
import { collection, setDoc, addDoc, getDoc, doc } from "firebase/firestore"; 
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'

const maxTags = [0, 7, 10, 7] // default, Topic, Source, Labels (respectively)

const setData = async(tagSystem, list, active, user) => {
    const docRef = await getDoc(doc(db, user.uid, "tags"))
    const updatedDocRef = await setDoc(doc(db, user.uid, "tags"), {
        ...docRef.data(),
        [tagSystems[tagSystem]]: {
            list: list,
            active: active
        }
    });
    return updatedDocRef
}

const TagSystem = ({ tagSystem, setTagSystem }) => {

    const [list, setList] = useState([])
    const [active, setActive] = useState([])
    //const docRef = getDoc(db, "tags", tagSystem)
    const { user } = useAuth()
    const [selected, setSelected] = useState("")
    const [search, setSearch] = useState("")
    const [searchResult, setSearchResult] = useState(list)
    const [newTagModal, setNewTagModal] = useState(false)
    const [maxTagsError, setMaxTagsError] = useState(false)

    // On page load (mount), update the tags from firebase
    useEffect(() => {
        getData()
    }, [])

    const getData = async() => {
        const docRef = await getDoc(doc(db, user.uid, "tags"))
        const { [tagSystems[tagSystem]]: tagsData } = docRef.data()
        setList(tagsData.list)
        setActive(tagsData.active)
    }

    const updateTag = (e, updateType) => {
        switch (updateType) {
            case "activate":
                console.log(active.length)
                if (active.length == maxTags[tagSystem]) {
                    setMaxTagsError(true)
                } else {
                    active.push(search)
                }
                break
            case "deactivate":
                active.splice(active.indexOf(search), 1)
                setMaxTagsError(false)
                break
            case "delete":
                list.splice(list.indexOf(search), 1)
                break
            case "rename":
                list[list.indexOf(selected)] = search
                if (active.includes(list)) {
                    active[active.indexOf(selected)] = search
                }
                break
        }
        setSelected("")
        setData(tagSystem, list, active, user)

    }

    const addNewTag = (tag) => {
        let arr = list
        arr.push(tag)
        setList(arr)
        setData(tagSystem, list, active, user)
        setSearch("")
    }

    const handleAddNew = (e) => {
        e.preventDefault()
        setNewTagModal(true)
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (search.length == 0) return

        console.log(search)
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
        <div class="z-0 flex-col p-16 h-full" onClick={(e) => {
            if (e.target == e.currentTarget) {
                setSearchResult([])
                setSelected("")
            }
            }}>
                <div class="flex items-center">
                    <button onClick={() => setTagSystem(0)}>
                        <IoMdArrowRoundBack size={25} />
                    </button>
                    <div class="text-xl px-5 font-extrabold text-blue-600 tracking-wider">
                        {tagSystem == 3 ? "Customized " + tagSystems[tagSystem] : tagSystems[tagSystem] + " Tags"}
                    </div>
                    <div class="text-sm font-light">
                        {"Maximum: " + (maxTags[tagSystem] - 1) + " + 1 Others Tags"}
                    </div>
                    {selected.length == 0 ? <button
                        class="flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                        type="submit"
                        onClick={handleAddNew}>
                        <FaPlus class="text-blue-600" size={12}/>
                        <div class="px-2 font-normal tracking-wide">{"New " + tagSystems[tagSystem]}</div>
                    </button> :
                    <div class="flex items-center ml-auto mr-6">
                        <button
                            class="flex items-center shadow mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                            type="submit"
                            onClick={(e) => updateTag(e, "delete")}>
                            <TiDelete class="text-red-600" size={20}/>
                            <div class="px-2 font-normal tracking-wide">Delete</div>
                        </button>
                        <button
                            class="flex items-center shadow mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                            type="submit"
                            onClick={(e) => updateTag(e, "rename")}>
                            <MdModeEditOutline class="text-blue-600" size={18}/>
                            <div class="px-2 font-normal tracking-wide">Rename</div>
                        </button>
                        <button
                            class="flex items-center shadow bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                            type="submit"
                            onClick={(e) => active.includes(search) ? updateTag(e, "deactivate") : updateTag(e, "activate")}>
                            <IoIosRadioButtonOn class={active.includes(search) ? "text-red-600" : "text-green-600"} size={18}/>
                            <div class="px-2 font-normal tracking-wide">{active.includes(search) ? "Mark as Inactive" : "Mark as Active"}</div>
                        </button>
                    </div>}
                </div>
                <form class="static w-full mt-7 pr-6" onChange={handleChange} onSubmit={handleSearch}>
                    <button class="p-1 absolute right-[5.75rem] top-[8.2rem] bg-blue-500 text-white rounded-xl">
                        <AiOutlineSearch size={25}/>
                    </button>
                    <input
                        class="shadow border-none rounded-xl w-full p-3 pr-11 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="search"
                        type="text"
                        placeholder="Search"
                        value={search}/>
                </form>
                {search.length > 0 &&
                <div class="shadow-lg absolute rounded-lg z-20 mt-2 w-1/2">
                    <div class="bg-white w-full rounded-lg">
                        {searchResult.map((item) => {
                            return (<div onClick={() => {
                                setSelected(item)
                                setSearchResult([])
                            }} class="text-light text-sm rounded-lg leading-tight py-2 pl-4 hover:bg-indigo-100 cursor-pointer">{item}</div>)
                        })}
                    </div>
                </div>}
                <div class="z-10 mt-12 pr-6">
                    {list.length == 0 ? 
                    <div class="grid bg-white w-full py-6 px-4 rounded-xl text-center">
                        <Image src={warning} width={156} height={120}/>
                        <div class="py-3 text-sm">You have no tags right now</div>
                    </div>
                    : 
                    <div>
                        {active.length != 0 && 
                        <div class="grid w-full p-4 mb-2 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {active.map((item) => {
                                return (
                                    <div onClick={() => setSelected(item)} class="text-md font-light my-5 cursor-pointer leading-normal flex items-center justify-center">
                                        <GoPrimitiveDot size={25} class="text-green-600"/>
                                        <div class="pl-2">{item}</div>
                                    </div>
                                )
                            })}
                        </div>}
                        { maxTagsError && <span class="pl-12 text-red-500 text-sm font-light">{"You may only enable " + maxTags[tagSystem] + " live tags"}</span>}
                        <div class="grid bg-white w-full p-4 mt-10 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {list.map((item) => {
                            const normStyles = "text-md font-light p-2 my-3 md:mx-2 cursor-pointer leading-normal flex items-center justify-center"
                            const selectedStyles = normStyles + " bg-blue-600 text-white rounded-lg"
                            return (
                                <div onClick={() => setSelected(item)} class={selected == item ? selectedStyles : normStyles}>
                                    { active.includes(item) && <GoPrimitiveDot size={25} class="text-green-600"/> }
                                    <div class="pl-2">{item}</div>
                                </div>
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
        </div>
    )
}

export default TagSystem