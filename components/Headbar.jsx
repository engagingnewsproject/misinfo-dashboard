import React, { useState } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'

const Headbar = ({ search, setSearch}) => {

    const handleSearch = (e) => {
        if (search.length == 0) return

        e.preventDefault()
        console.log(search)
    }

    const handleChange = (e) => {
        setSearch(e.target.value)
    }
    
    return (
        <div class="w-full">
            <div class="flex py-4 px-10 justify-between">
                <div class="flex">
                    <div class="flex justify-center">
                        <div class="w-10 h-10 font-extralight rounded-full tracking-widest flex justify-center text-sm items-center text-white bg-blue-500">M</div>
                    </div>
                    <div class="text-md font-semibold px-4 m-auto tracking-wide">
                        Local Pipeline Dashboard
                    </div>
                </div>
                <form class="w-1/4" onChange={handleChange} onSubmit={handleSearch}>
                    <button class="p-1 absolute right-11 top-10 bg-blue-500 text-white rounded-xl">
                        <AiOutlineSearch size={25}/>
                    </button>
                    <input
                        class="shadow border-none rounded-xl w-full p-3 pr-11 text-xs text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="search"
                        type="text"
                        placeholder="Search"
                        value={search} />
                </form>
            </div>
        </div>
    )
}

export default Headbar