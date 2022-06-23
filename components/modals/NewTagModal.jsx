import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"

const NewTagModal = ({ tagSystems, tagSystem, list, setNewTagModal, addNewTag }) => {
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
        if (!lower.includes(tag.toLowerCase()) && tag.length != 0 && tag.length <= 18) {
            addNewTag(tag)
            setNewTagModal(false)
        }
    }

    return (
        <div>
            <div class="flex justify-center items-center z-10 absolute top-0 left-0 w-full h-full bg-black opacity-60">
            </div>
            <div class="flex justify-center items-center z-20 absolute top-0 left-0 w-full h-full">
                <div class="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10">
                    <div class="flex justify-between w-full mb-5">
                        <div class="text-md font-bold text-blue-600 tracking-wide">{"Add New " + tagSystems[tagSystem]}</div>
                        <button onClick={() => setNewTagModal(false)} class="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <form onChange={handleChange} onSubmit={handleAddNewTag}>
                        <div class="mb-2">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="newTag"
                                type="text"
                                placeholder="New Tag"
                                value={tag}
                                required
                                />
                        </div>
                        {lower.includes(tag.toLowerCase()) && <p class="text-red-500 text-sm font-light">This tag already exists, please try another name</p>}
                        {tag.length > 18 && <p class="text-red-500 text-sm font-light">You cannot type a tag more than 18 characters long. Please try another name</p>}
                        <div class="mt-6 flex justify-between">
                            <button
                                onClick={() => setNewTagModal(false)}
                                class="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline">
                                Cancel
                            </button>
                            <button
                                class="bg-white hover:bg-blue-500 hover:text-white text-sm text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">
                                Add
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default NewTagModal