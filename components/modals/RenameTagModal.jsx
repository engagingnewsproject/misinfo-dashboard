import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"

const RenameTagModal = ({ replaceTag, selected, list, setRenameTagModal, addNewTag }) => {
    const lower = []
    list.forEach(element => {
        lower.push(element.toLowerCase())
    })
    const [tag, setTag] = useState("")

    const handleChange = (e) => {
        setTag(e.target.value)
    }

    const handleAddNewTag = (e) => {
        e.preventDefault()
        if (tag.length != 0 && tag.length <= 20) {
            addNewTag(tag)
            setRenameTagModal(false)
        }
    }

    const handleReplaceTag = (e) => {
        e.preventDefault()
        if (!lower.includes(tag.toLowerCase()) && tag.length != 0 && tag.length <= 20) {
            replaceTag(tag)
            setRenameTagModal(false)
        }
    }

    return (
        <div>
            <div className="flex justify-center items-center z-[9998] absolute top-0 left-0 w-full h-full bg-black opacity-60">
            </div>
            <div onClick={() => setRenameTagModal(false)} className="flex justify-center items-center z-[9999] absolute top-0 left-0 w-full h-full">
                <div onClick={(e) => { e.stopPropagation() }} className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10">
                    <div className="flex justify-between w-full mb-5">
                        <div className="text-md font-bold text-blue-600 tracking-wide">Rename</div>
                        <button onClick={() => setRenameTagModal(false)} className="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <form onChange={handleChange} onSubmit={handleAddNewTag}>
                        <div className="mb-2">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="newTag"
                                type="text"
                                placeholder={selected}
                                value={tag}
                                required
                                onChange={handleChange}
                                />
                        </div>
                        {lower.includes(tag.toLowerCase()) && <p className="text-red-500 text-sm font-light">This tag already exists, do you want to replace?</p>}
                        {tag.length > 25 && <p className="text-red-500 text-sm font-light">You cannot type a tag more than 18 characters long. Please try another name</p>}
                        <div className="mt-6 flex justify-between">
                            <button
                                onClick={handleReplaceTag}
                                className="bg-white hover:bg-gray-500 hover:text-white text-sm text-gray-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                 type='button'>
                                Replace
                            </button>
                            <button
                                className="bg-white hover:bg-blue-600 hover:text-white text-sm text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                type="submit">
                                Keep Both
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default RenameTagModal