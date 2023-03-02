import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, listCollections, getDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../config/firebase'
import Link from 'next/link'
import { Switch } from "@headlessui/react";
import SwitchRead from './SwitchRead';
// Icons
import {IoMdRefresh} from "react-icons/io";
import { IoAdd } from 'react-icons/io5'
import { RiMessage2Fill } from 'react-icons/ri'
import { BiEditAlt } from 'react-icons/bi'
import { BsShareFill } from 'react-icons/bs'
import { AiOutlineFieldTime } from 'react-icons/ai'
// Icons END
import ReactTooltip from "react-tooltip";
import InfiniteScroll from 'react-infinite-scroll-component';
import NewReportModal from './modals/NewReportModal'
import ReportModal from './modals/ReportModal';

const ReportsSection = ({ search, open, onClose}) => {
  const [showModal, setShowModal] = useState(false);

  const [reports, setReports] = useState([])
  // Report modal states
  const [info, setInfo] = useState({})
  const [reporterInfo, setReporterInfo] = useState({})
	const [postedDate, setPostedDate] = useState("")
	const [selectedLabel, setSelectedLabel] = useState("")
	const [changeStatus, setChangeStatus] = useState("")
	const [update, setUpdate] = useState("")
	const [activeLabels, setActiveLabels] = useState([])
  // Report modal states END
  const [openModalNewReport, setOpenModalNewReport] = useState(false)
  const [filteredReports, setFilteredReports] = useState([])
  const [loadedReports, setLoadedReports] = useState([])
  const [endIndex, setEndIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [reportWeek, setReportWeek] = useState("4")
  const [readFilter, setReadFilter] = useState("All")
  const { user } = useAuth()
  const dateOptions = { day: '2-digit', year: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }

  const tableHeadings = "p-2 text-center text-sm font-semibold tracking-wide"
  const columnData = "text-center text-sm px-2 py-1 flex items-center justify-center"
  	const headerStyle = "text-lg font-bold text-black tracking-wider mb-4"
	const linkStyle = "font-light mb-1 text-sm underline underline-offset-1"

  const label = {
    default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
    special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl"
  }
  
  const getData = async() => {
    const reportsCollection = collection(db, "reports")
    const snapshot = await getDocs(reportsCollection)
    
    try {
      var arr = []
      snapshot.forEach(doc => {
        arr.push({
          [doc.id]: doc.data(),
        })
      })

      setReports(arr)
      setFilteredReports(arr)
      setLoadedReports(arr
        .filter((reportObj) => {
          const report = Object.values(reportObj)[0]
          return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - reportWeek * 7))
        })
        .sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1))
    } catch (error) {
      console.log(error)
    }
  }

  const handleDateChanged = (e) => {
    e.preventDefault()
    setReportWeek(e.target.value)
    setEndIndex(0)
    
    // Updates loaded reports so that they only feature reports within the selected date range
    const arr = filteredReports
      
      .filter((reportObj) => {
      const report = Object.values(reportObj)[0]
      return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - e.target.value * 7))
    })
    arr = arr.sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1)
    console.log(arr)
    setLoadedReports(arr)
  }

  const handleReadFilter = (e) => {
    e.preventDefault()
    setFilterRead(e.target.value)
  }

	const handleNotesChange = (e) => {
    if (e.target.value != info['note']) {
			setUpdate(e.target.value)
		} else {
			setUpdate("")
		}
	}


  // Filter the reports based on the search text
	useEffect(() => {
		if (search == "") {
			if (readFilter != "All") {
				setFilteredReports(reports.filter((reportObj) => {
					return Object.values(reportObj)[0].read.toString() == readFilter
				}))
			} else {
				setFilteredReports(reports)
			}
		} else {
			setFilteredReports(reports.filter((reportObj) => {
				const report = Object.values(reportObj)[0]

				var arr = []
				// Collect the searchable fields of the reports data
				for (const key in report) {
					if (report[key]) {
						if (key != "images" && key != "userID") {
							if (key == "createdDate") {
								const posted = report[key].toDate().toLocaleString('en-US', dateOptions).replace(/,/g, "").replace('at', '')
								arr.push(posted.toLowerCase())
							} else {
								arr.push(report[key].toString().toLowerCase())
							}
						}
					}
				}

				// check if the search text is in the collected fields
				for (const str of arr) {
					if (str.includes(search.toLowerCase())) {
						return true
					}
				}

			}))
		}
	}, [search])

  // On page load (mount), get the reports from firebase
  useEffect(() => {
    getData()
  }, [])

  // Updates the loaded reports whenever a user filters reports based on search.
  useEffect(() => {
    const arr = filteredReports
      .filter((reportObj) => {
        const report = Object.values(reportObj)[0]
        return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - reportWeek * 7))
      })
    arr = arr.sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1)
    
    // Default values for infinite scrolling, will load reports as they are populated.
    setEndIndex(0)
    setHasMore(true)
    setLoadedReports(arr)
  }, [filteredReports])
    
  // Populates the loaded reports as the user scrolls to bottom of page
  useEffect(() => {
    if (loadedReports.length != 0) {
      handleReportScroll()
    }
  }, [loadedReports])
  
  // Determines if there are more reports to be shown.
  const handleReportScroll = () => {
    // If all of the reports have been loaded
    if (endIndex >= loadedReports.length) {
      setHasMore(false)

      // If there is less than 14 reports to load, load remaining reports
    } else if ((endIndex + 14) >= loadedReports.length) {
      setEndIndex(loadedReports.length)
      setHasMore(true)

      // Load only 14 additional reports
    } else {
      setEndIndex(endIndex + 14)
      setHasMore(true)
    }
  }

	const handleReadToggled = async (reportId) => {
		const report = reports.filter(report => Object.keys(report) == reportId)[0]
		const updatedReport = {
			...report,
			[reportId]: {
				...report[reportId],
				read: !report[reportId].read
			}
		}
		const reportIndex = reports.findIndex(report => Object.keys(report) == reportId)
		reports[reportIndex] = updatedReport
		const updatedReports = [...reports]
		setReports([...reports])
		setFilteredReports([...reports])
		if (readFilter !== "All") {
			setFilteredReports(updatedReports.filter((reportObj) => {
				return Object.values(reportObj)[0].read.toString() == readFilter
			}))
		}
		const reportDoc = doc(db, "reports", reportId)
		await updateDoc(reportDoc, { read: !report[reportId].read }).then(function () {
			console.log("Success")
		}).catch(function (error) {
			console.log("error")
		})
	}

	const handleReadFilterChanged = (e) => {
		console.log(e.target.value + "went into function")
		if (e.target.value != "All") {
			setFilteredReports(reports.filter(report =>
			{
				const reportData = Object.values(report)[0]
				return reportData.read.toString() == e.target.value
			}))
		} else {
			setFilteredReports(reports)
		}
		// setFilteredReports(reports.filter(report => {
		// 	const reportData = Object.values(report)[0]
		// 	return reportData.read.toString() == e.target.value
		// }))
		setReadFilter(e.target.value)
	}

	function SendLinkByMail(href) {
    var subject= "Misinformation Report";
    var body = "Link to report:\r\n";
    body += window.location.href;
    var uri = "mailto:?subject=";
    uri += encodeURIComponent(subject);
    uri += "&body=";
    uri += encodeURIComponent(body);
    window.open(uri);
	}

  return (
		<div className="flex flex-col h-full">
			<div className="flex flex-row justify-between py-5">
				<div className="text-lg font-bold text-blue-600 tracking-wider">
					List of Reports
				</div>
        <div>
          <button
            onClick={() => setOpenModalNewReport(true)}
            className="flex flex-row items-center text-sm bg-white px-4 border-none shadow text-black py-1 rounded-md hover:shadow-none active:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600">
            <IoAdd className="mr-1" size = {15}/> 
            New Report
          </button>
        </div>
        <NewReportModal open={openModalNewReport} onClose={() => setOpenModalNewReport(false)} />
				<div>
					<select
						id="labels"
						onChange={(e) => handleReadFilterChanged(e)}
						defaultValue="All"
						className="text-sm font-semibold shadow bg-white inline-block px-8 border-none text-black py-1 rounded-md mx-2 hover:shadow-none">
						<option value="false">Unread</option>
						<option value="true">Read</option>
						<option value="All">All reports</option>
					</select>
					<select
						id="labels"
						onChange={(e) => handleDateChanged(e)}
						defaultValue="4"
						className="text-sm font-semibold shadow bg-white inline-block px-8 border-none text-black py-1 rounded-md hover:shadow-none">
						<option value="4">Last four weeks</option>
						<option value="3">Last three weeks</option>
						<option value="2">Last two weeks</option>
						<option value="1">Last week</option>
						<option value="100">All reports</option>
					</select>
				</div>
			</div>
			<div className="bg-white w-full rounded-xl p-1">
				<div className="grid grid-cols-8">
					<div className={"col-span-2 " + tableHeadings}>Title</div>
					<div className={tableHeadings}>Date/Time</div>
					<div className={tableHeadings}>Candidates</div>
					<div className={tableHeadings}>Topic Tags</div>
					<div className={tableHeadings}>Sources</div>
					<div className={tableHeadings + " p-1"}>
						Labels (
							<ReactTooltip id="refreshTooltip" place="top" type="light" effect="solid" delayShow={500} />
							<button
							
								className="relative top-1"
								onClick={() => getData()}
								
								data-tip="Refresh" 
								data-for="refreshTooltip" 
								>
								<IoMdRefresh size={20} />
								
							</button>
						)
					</div>
					<div className={tableHeadings}>Read/Unread</div>
				</div>
        <div>

          {/*Infinite scroll for the reports to load more reports when user scrolls to bottom*/}
          <InfiniteScroll
            dataLength={endIndex}
            next={handleReportScroll}
            inverse={false} //
            hasMore={hasMore}
            loader={<h4>Loading...</h4>}
            scrollableTarget="scrollableDiv"
          >
            {loadedReports.slice(0, endIndex)
              .map((reportObj) =>
              {
                const report = Object.values(reportObj)[0]
                const posted = report["createdDate"].toDate().toLocaleString('en-US', dateOptions).replace(/,/g, "").replace('at', '')
           
                console.log(JSON.stringify(report,null,2))
                return (
                  <>
                    <a onClick={() => setShowModal(true)} className="grid grid-cols-8 hover:bg-blue-200">
                      <div className={"col-span-2 " + columnData}>{report.title}</div>
                      <div className={columnData}>{posted}</div>
                      <div className={columnData}>-</div>
                      <div className={columnData}>{report.topic}</div>
                      <div className={columnData}>{report.hearFrom}</div>
                      <div className={columnData}>
                        <div className={!report.label ? label.default : label.special}>{report.label || "None"}</div>
                      </div>
                      <div className={columnData}>
                        <Switch
                          // Set checked to the initial reportRead value (false)
                          checked={report.read}
                          // When switch toggled setReportRead
                          onChange={() => handleReadToggled(Object.keys(reportObj)[0])}
                          // On click handler
                          // onClick={() => setReportRead(handleReadChange)}
                          className={`${ report.read ? "bg-blue-600" : "bg-gray-200"
                            } relative inline-flex h-6 w-11 items-center rounded-full`}>
                          <span className="sr-only">Mark me</span>
                          <span
                            aria-hidden="true"
                            className={`${ report.read ? "translate-x-6" : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                          />
                        </Switch>
                      </div>
                    </a>
                     {showModal ? (
                      <div className="z-10 fixed top-0 left-0 w-full h-full bg-black-500/[.06]">
                        <div onClick={onClose} className="drop-shadow-sm flex justify-center items-center z-20 absolute top-0 left-0 w-full h-full">
                          <div className="flex-col justify-center relative items-center bg-white w-10/12 h-auto rounded-2xl py-4 px-4">
                            <div onClick={(e) => {e.stopPropagation()}} className="p-16">
                              <div className="text-2xl font-bold text-blue-600 tracking-wider mb-8">
                              {/* Temp link back to Dashboard for testing */}
                                <Link href="/">More Information</Link>
                              </div>
                              <div className="grid grid-cols-2 gap-24">
                                <div className="left-side">
                                  <div className="mb-2">
                                    <div className={headerStyle}>Title</div>
                                    <div className="text-sm bg-white rounded-xl p-4">{report['title'] || <span className="italic text-gray-400">No Title</span>}</div>
                                    </div>
                                  { reporterInfo &&
                                    <div className="text-md mb-4 font-light text-right">
                                      <div>
                                      <span className="font-semibold">Reported by:</span> {report['userID']} (<a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" href={"mailto:" + report['email']}>{report['email']}</a>)
                                      </div>
                                  </div>}
                                  <div className="mb-8">
                                    <div className={headerStyle}>Label</div>
                                    <select id="labels" onChange={(e) => handleLabelChanged(e)} defaultValue={selectedLabel} className="text-sm inline-block px-8 border-none bg-yellow-400 py-1 rounded-2xl shadow hover:shadow-none">
                                      <option value={selectedLabel ? selectedLabel : "none"}>{selectedLabel ? selectedLabel : 'Choose a label'}</option>
                                      {activeLabels.filter(label => label != selectedLabel).map((label) => {
                                        return (<option value={label}>{label}</option>)
                                        })
                                      }
                                    </select>
                                    {changeStatus && <span className="ml-5 font-light text-sm italic">{changeStatus}</span>}
                                  </div>
                                  <div className="flex flex-col mb-5">
                                    <div className="flex flex-row mb-3 items-center">
                                      <RiMessage2Fill size={20} />
                                      <div className="font-semibold px-2 self-center pr-4">Tag</div>
                                      <div className="text-md font-light">{report['topic']}</div>
                                    </div>
                                    <div className="flex flex-row mb-3 items-center">
                                      <BiEditAlt size={20} />
                                      <div className="font-semibold px-2 self-center pr-4">Sources / Media</div>
                                      <div className="text-md font-light">{report['hearFrom']}</div>
                                    </div>
                                    <div className="flex flex-row mb-3 items-center">
                                      <AiOutlineFieldTime size={20} />
                                      <div className="font-semibold px-2 self-center pr-4">Date / Time</div>
                                      <div className="text-md font-light">{postedDate}</div>
                                    </div>
                                    <div className="flex flex-row mb-3 items-center">
                                      <SwitchRead />
                                    </div>
                                  </div>
                                  <div className="mb-8">
                                    <div className={headerStyle}>Link Of The Information</div>
                                    <div className="flex flex-col">
                                      {report['link'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + report['link']}>{report['link']}</a>}
                                      {report['secondLink'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + report['secondLink']}>{report['secondLink']}</a>}
                                      {report['thirdLink'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + report['thirdLink']}>{report['thirdLink']}</a>}
                                    </div>
                                  </div>
                                  <div>
                                    <div className={headerStyle}>Description</div>
                                    <div className="font-light overflow-auto max-h-32">{report['detail']}</div>
                                  </div>
                                </div>
                                <div className="right-side">
                                  <div>
                                    <div className={headerStyle}>Newsroom's Notes</div>
                                    <textarea
                                      id="notes"
                                      onChange={handleNotesChange}
                                      placeholder="No notes yet..."
                                      className="border transition ease-in-out w-full text-md font-light bg-white rounded-xl p-4 border-none
                                      focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none mb-12"
                                      rows="4"
                                      defaultValue={info['note']}
                                      >
                                    </textarea>
                                    {update &&
                                      <div className="-mt-8 flex float-right mb-6">
                                      <button onClick={revertBack}
                                        className="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline">Cancel</button>
                                      <button onClick={saveChanges}
                                        className="bg-white hover:bg-blue-500 hover:text-white text-sm text-blue-500 font-bold ml-4 py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">Save Changes</button>
                                    </div>}
                                      </div>
                                  <div className="mb-8">
                                    <button
                                          className="flex flex-row text-sm bg-white inline-block px-4 border-none text-black py-1 rounded-md shadow hover:shadow-none" onClick={SendLinkByMail}> 
                                          <BsShareFill className="my-1" size = {15}/> 
                                          <div className="px-3 py-1">Share The Report</div>
                                    </button>
                                  </div>
                                  <div className="w-full">
                                    <div className={headerStyle}>Images</div>
                                    {info['images'] && info['images'][0] ?
                                      <div className="flex w-full overflow-y-auto">
                                        {info['images'].map((image) => {
                                          return (
                                            <div className="flex px-1">
                                              <img src={image} width={150} height={150} alt="image"/>
                                            </div>
                                          )
                                        })}
                                      </div> :
                                      <div className="italic font-light">No images for this report</div>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              className="text-gray-800 absolute top-4 right-4"
                              onClick={() => setShowModal(false)}
                            >X</button>
                          </div>
                        </div>
                    </div>
                  ) : null}
                </>
                )
              })
            }
          </InfiniteScroll>
        </div>
			</div>
    </div>
	);
}

export default ReportsSection