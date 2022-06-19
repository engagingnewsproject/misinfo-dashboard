import React, { useState, useEffect } from 'react'
import { tagSystems } from './Settings'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { AiOutlineSearch } from 'react-icons/ai'
import { FaPlus } from 'react-icons/fa'
import { collection, setDoc, addDoc, getDoc, doc } from "firebase/firestore"; 
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'

const maxTags = [6, 9, 6] // Topic, Source, Labels (respectively)

const addData = async(tagSystem, list, user) => {
    const docRef = await setDoc(doc(db, user.uid, "tags"), {
        [tagSystems[tagSystem]]: {
            list: list
        }
    });
    return docRef
}

const TagSystem = ({ tagSystem, setTagSystem }) => {

    const [list, setList] = useState(['Shooting At UT'])
    //const docRef = getDoc(db, "tags", tagSystem)
    const { user } = useAuth()
    const [selected, setSelected] = useState("")
    const [search, setSearch] = useState("")
    const [searchResult, setSearchResult] = useState(list)

    // On page load (mount), update the tags from firebase
    useEffect(() => {
        getData()
    }, [])

    const getData = async() => {
        const docRef = await getDoc(doc(db, user.uid, "tags"))
        const { [tagSystems[tagSystem]]: tagsData } = docRef.data()
        setList(tagsData.list)
    }

    const addNewTag = (e) => {
        e.preventDefault()
        let arr = list
        arr.push(search)
        setList(arr)
        addData(tagSystem, list, user)
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (search.length == 0) return

        console.log(search)
    }

    const handleChange = (e) => {
        setSearch(e.target.value)
        setSearchResult(list.filter(i => i.toLowerCase().includes(search.toLowerCase())))
    }

    useEffect(() => {
        setSearchResult(list.filter(i => i.toLowerCase().includes(search.toLowerCase())))
    }, [search])

    useEffect(() => {
        setSearch(selected)
    }, [selected])

    return (
        <div class="z-0 flex-col p-16">
            <div class="flex items-center">
                <button onClick={() => setTagSystem(0)}>
                    <IoMdArrowRoundBack size={25} />
                </button>
                <div class="text-xl px-5 font-extrabold text-blue-600 tracking-wider">
                    {tagSystem == 3 ? "Customized " + tagSystems[tagSystem] : tagSystems[tagSystem] + " Tags"}
                </div>
                <div class="text-sm font-light">
                    {"Maximum: " + maxTags[tagSystem - 1] + " + 1 Others Tags"}
                </div>
                <button
                    class="flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                    type="submit"
                    onClick={addNewTag}>
                    <FaPlus class="text-blue-600" size={12}/>
                    <div class="px-2 font-normal tracking-wide">{"New " + tagSystems[tagSystem]}</div>
                </button>
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
            <div class="absolute z-20 mt-2 pr-6 w-1/2">
                <div class="bg-white w-full rounded-lg">
                    {searchResult.map((item) => {
                        return <div onClick={() => setSelected(item)} class="text-light text-sm rounded-lg leading-tight py-2 pl-4 hover:bg-indigo-100 cursor-pointer">{item}</div>
                    })}
                    {searchResult.length == 0 && <div onClick={() => setSelected(search)} class="text-light text-sm rounded-lg leading-tight py-2 pl-4 hover:bg-indigo-100 cursor-pointer">Other</div>}
                </div>
            </div>}
            <div class="z-10 mt-12 pr-6">
                <div class="grid bg-white w-full p-4 rounded-xl grid-cols-5">
                    {list.map((item) => {
                        return (
                            <div class="text-md my-5 cursor-pointer leading-normal text-center">{item}</div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default TagSystem