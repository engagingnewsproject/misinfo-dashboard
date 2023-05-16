import React, { useState } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'

const Headbar = ({ search, setSearch}) => {

    const handleSearch = (e) => {
        e.preventDefault()
        if (search.length == 0) return

        console.log(search)
    }

    const handleChange = (e) => {
        setSearch(e.target.value)
    }
    
    return (
        <div className="w-full">
            <div className="flex py-4 px-12 sm:px-10 justify-between">
                <div className="flex">
                    <div className="flex justify-center">
                        <div className="w-10 h-10 font-extralight rounded-full tracking-widest flex justify-center text-sm items-center text-white bg-blue-500">M</div>
                    </div>
                    <div className="text-md font-semibold px-4 m-auto tracking-wide">
                        Local Pipeline Dashboard
                    </div>
                </div>
                <form className="flex relative w-1/4" onChange={handleChange} onSubmit={handleSearch}>
                   
                    <input
                        className="shadow border-none rounded-xl w-full p-3 pr-11 text-xs text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="search"
                        type="text"
                        placeholder="Search"
                        onChange={handleChange}
                        value={search} />
                    <button className="py-1 px-1 mt-1.5 mr-1 absolute right-0 top-0 py-1 bg-blue-500 text-white rounded-xl">
                        <AiOutlineSearch size={25}/>
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Headbar