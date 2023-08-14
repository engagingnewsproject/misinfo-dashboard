import React, { useState, useEffect } from 'react'
import { tagSystems } from './Settings'
import { setDoc, getDoc, doc } from "firebase/firestore"; 
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { GoPrimitiveDot } from 'react-icons/go'

const setData = async(tagSystem, list, active, user) => {
    const docRef = await getDoc(doc(db, "tags", user.uid))
    const updatedDocRef = await setDoc(doc(db, "tags", user.uid), {
        ...docRef.data(),
        [tagSystems[tagSystem]]: {
            list: list,
            active: active
        }
    });
    return updatedDocRef
}

const TagList = ({ tagSystem, setTagSystem }) => {
	const [list, setList] = useState([])
	const [active, setActive] = useState([])
	const { user } = useAuth()
	// On page load (mount), update the tags from firebase
	useEffect(() => {
		getData()
	}, [])
	
    const getData = async() => {
        const docRef = await getDoc(doc(db, "tags", user.uid))
        try {
			const sourceTags = docRef.data()['Source'] // Source tags
			const topicTags = docRef.data()['Topic'] // Topic tags

            const { [tagSystems[tagSystem]]: tagsData } = docRef.data()
			// console.log({[tagSystems[tagSystem]]: tagsData});
			// console.log()
            setList(tagsData.list)
            setActive(tagsData.active)
        } catch (error) {
            setData(tagSystem, list, active, user)
            console.log(error)
        }
    }
	// tagSystem = 2
	console.log(tagSystem);
	return (
		<div className='p-16'>
		
			<div>
			{tagSystem == 2 &&
			<>
				<div>{`${tagSystems[1]} Tags`}</div>
				{active.map((item, i) => {
					return (
						<div className="text-md font-light my-5 leading-normal flex items-center justify-center" key={i}>
							{/* <GoPrimitiveDot size={25} className="text-green-600"/> */}
							<div className="pl-2">{item}</div>
						</div>
					)
				})}
				{list.map((item) => {
					return (
						!item.includes('Other') &&
						<div key={item}>
						{ active.includes(item) && <GoPrimitiveDot size={25} className="text-green-600"/> }
						<div className="pl-2">{item}</div>
						</div>
						)
					})}
			</>
			}
			
			</div>
			
		</div>
		)
	}
	
	export default TagList