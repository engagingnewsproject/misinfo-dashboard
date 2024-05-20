import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
// import { Switch } from "@headlessui/react"
import Switch from 'react-switch';
// Icons
import { IoMdRefresh } from 'react-icons/io';
import { IoAdd, IoTrash } from 'react-icons/io5';

// Icons END
// import ReactTooltip from "react-tooltip"
import InfiniteScroll from 'react-infinite-scroll-component';
import NewReport from './modals/NewReportModal';
import ReportModal from './modals/ReportModal';
import ConfirmModal from './modals/ConfirmModal';
import globalStyles from '../styles/globalStyles';
import TableHead from './partials/table/TableHead'
import TableBody from './partials/table/TableBody'
import { Card, Typography } from '@material-tailwind/react'
const ReportsSection = ({
  search,
  newReportSubmitted,
  handleNewReportSubmit
}) => {
  const userId = localStorage.getItem('userId');
  const [reports, setReports] = useState([]);
  // const [reporterInfo, setReporterInfo] = useState({})
  const [newReportModal, setNewReportModal] = useState(false);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loadedReports, setLoadedReports] = useState([]);
  const [endIndex, setEndIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [reportWeek, setReportWeek] = useState('4');
  const [readFilter, setReadFilter] = useState('All');
  const [reportTitle, setReportTitle] = useState('');
  // const [agencyName, setAgencyName] = useState('')
  const [isAgency, setIsAgency] = useState(null);
  const { user, verifyRole, customClaims } = useAuth();

  // Report modal states
  const [report,setReport] = useState('');
  const [reportId, setReportId] = useState('')
  const [reportModalShow, setReportModalShow] = useState(false);
  const [reportModalId, setReportModalId] = useState('');
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState();
  const [reportSubmitBy, setReportSubmitBy] = useState('');
  const [reportRead, setReportRead] = useState(false);
  const [reportsRead, setReportsRead] = useState({}); // Store checked state for each report
  const [info, setInfo] = useState({});
  const [selectedLabel, setSelectedLabel] = useState('');
  const [activeLabels, setActiveLabels] = useState([]);
  const [changeStatus, setChangeStatus] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  // const [update,setUpdate] = useState("")
  const [update, setUpdate] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Indicates when reports have been updated once user presses the refresh button.
  const [reportsUpdated, setReportsUpdated] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (customClaims.admin) {
      setIsAgency(false);
    } else if (customClaims.agency) {
      setIsAgency(true);
    }
  }, []);

  // On page load (mount) or new report submitted, get the reports from firebase
  useEffect(() => {
    getData();
  }, [isAgency, newReportSubmitted]);

  const getData = async () => {
    // get reports collection
    const reportsCollection = collection(db, 'reports');
    let snapshot;

    if (isAgency) {
      let agencyName;
      const agencyCollection = collection(db, 'agency');
      // From agency collection find agency with user's email
      const q = query(
        agencyCollection,
        where('agencyUsers', 'array-contains', user['email'])
      );
      // Fetch user's 'agency' name. . .
      const querySnapshot = await getDocs(q);
      // Check if any documents were found
      if (querySnapshot && !querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          agencyName = doc.data()['name'];
        });
        // & only fetch reports with the user's 'agency' name
        const agencyReports = query(
          reportsCollection,
          where('agency', '==', agencyName)
        );
        snapshot = await getDocs(agencyReports);
      } else {
        // Handle case where no agency was found for the user
        // console.log("No reports found for the agency")
        // You might want to set snapshot to an empty array or handle this case differently
      }
      // Displays all reports for admin user
    } else {
      snapshot = await getDocs(reportsCollection);
    }

    try {
      if (snapshot && !snapshot.empty) {
        var arr = [];
        snapshot.forEach((doc) => {
          // dont need the data: {key:value}, just do {key:value}
          // especially for the sorting to work
          const data = doc.data();
          data.reportID = doc.id; 
          arr.push(data);
        });
        setReports(arr);
        // console.log(arr)
        // Initialize reportsRead with read status of each report
        // const initialReportsRead = arr.reduce((acc,report) => {
        // 	acc[report.id] = report.read // Use report ID as key and read status as value
        // 	return acc
        // }, {})
        // // Set reportsRead state
        // setReportsRead(initialReportsRead)
        if (readFilter !== 'All') {
          arr = arr.filter((reportObj) => {
            return reportObj['read'].toString() === readFilter;
          });
        }
        setFilteredReports(arr);
        setLoadedReports(
          arr
            .filter((reportObj) => {
              const report = reportObj;
              return (
                report['createdDate'].toDate() >=
                new Date(
                  new Date().setDate(new Date().getDate() - reportWeek * 7)
                )
              );
            })
            .sort((objA, objB) =>
              Object.values(objA)[0]['createdDate'] >
              Object.values(objB)[0]['createdDate']
                ? -1
                : 1
            )
        );
      } else {
        // Handle case where no agency was found for the user
        console.log("Snapshot empty: No reports found for this agency")
        // You might want to set snapshot to an empty array or handle this case differently
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Handler that is run once user wants to refresh the reports section
  const handleRefresh = async () => {
    setRefresh(true);
    await getData();
    setReportsUpdated(true);
    setRefresh(false);
  };

  // Filter
  const handleDateChanged = (e) => {
    e.preventDefault();
    setReportWeek(e.target.value);
    setEndIndex(0);

    // Updates loaded reports so that they only feature reports within the selected date range
    let arr = filteredReports.filter((reportObj) => {
      const report = reportObj
      return (
        report['createdDate'].toDate() >=
        new Date(
          new Date().setDate(
            new Date().getDate() - e.target.value * 7
          )
        )
      );
    });

    arr = arr.sort((objA, objB) =>
      Object.values(objA)[0]['createdDate'] >
      Object.values(objB)[0]['createdDate']
        ? -1
        : 1
    );
    setLoadedReports(arr);
  };

  // Filter the reports based on the search text
  useEffect(() => {
    if (search == '') {
      if (readFilter != 'All') {
        setFilteredReports(
          reports.filter((reportObj) => {
            return Object.values(reportObj)[0].read.toString() == readFilter;
          })
        );
      } else {
        setFilteredReports(reports);
      }
    } else {
      setFilteredReports(
        reports.filter((reportObj) => {
          const report = Object.values(reportObj)[0];

          var arr = [];
          // Collect the searchable fields of the reports data
          for (const key in report) {
            if (report[key]) {
              if (key != 'images' && key != 'userID') {
                if (key == 'createdDate') {
                  const posted = report[key]
                    .toDate()
                    .toLocaleString('en-US', dateOptions)
                    .replace(/,/g, '')
                    .replace('at', '');
                  arr.push(posted.toLowerCase());
                } else {
                  arr.push(report[key].toString().toLowerCase());
                }
              }
            }
          }

          // check if the search text is in the collected fields
          for (const str of arr) {
            if (str.includes(search.toLowerCase())) {
              return true;
            }
          }
        })
      );
    }
  }, [search]);

  // Updates the loaded reports whenever a user filters reports based on search.
  useEffect(() => {
    let arr = filteredReports.filter((reportObj) => {
      const report = reportObj;
      return (
        report['createdDate'].toDate() >=
        new Date(
          new Date().setDate(
            new Date().getDate() - reportWeek * 7
          )
        )
      );
    });
    arr = arr.sort((objA, objB) =>
      Object.values(objA)[0]['createdDate'] >
      Object.values(objB)[0]['createdDate']
        ? -1
        : 1
    );

    // Default values for infinite scrolling, will load reports as they are populated.
    // FIXED SCROLLING BUG MAYBE???? *****
    // setEndIndex(0)
    // setHasMore(true)
    if (arr.length === 0) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
    setLoadedReports(arr);
  }, [filteredReports]);

  // Populates the loaded reports as the user scrolls to bottom of page
  useEffect(() => {
    if (loadedReports.length != 0) {
      handleReportScroll();
    }
  }, [loadedReports]);

  // Determines if there are more reports to be shown.
  const handleReportScroll = () => {
    // If all of the reports have been loaded
    if (endIndex >= loadedReports.length) {
      setHasMore(false);

      // If there is less than 14 reports to load, load remaining reports
    } else if (endIndex + 14 >= loadedReports.length) {
      setEndIndex(loadedReports.length);
      setHasMore(true);

      // Load only 14 additional reports
    } else {
      setEndIndex(endIndex + 14);
      setHasMore(true);
    }
  };

  const handleReadFilterChanged = (e) => {
    console.log(e.target.value + 'went into function');
    if (e.target.value != 'All') {
      setFilteredReports(
        reports.filter((report) => {
          return report['read'].toString() == e.target.value;
        })
      );
    } else {
      setFilteredReports(reports);
    }
    // setFilteredReports(reports.filter(report => {
    // 	const reportData = Object.values(report)[0]
    // 	return reportData.read.toString() == e.target.value
    // }))
    setReadFilter(e.target.value);
  };

  const handleUserSendEmail = (reportURI) => {
    const subject = 'Misinfo Report';
    const body = `Link to report:\n${reportURI}`;
    const uri = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(uri);
  };

  const handleNewReportModal = (e) => {
    e.preventDefault();
    setNewReportModal(true);
  };

  const handleReportModalShow = async (reportId) => {
    // get doc
    const docRef = await getDoc(doc(db, 'reports', reportId));
    const reportData = docRef.data();
    setReport({ id: reportId, ...reportData });

    // setReport(docRef.data())
    // get note
    setNote(docRef.data().note);
    setReportTitle(docRef.data().title);
    setDetail(docRef.data().detail);
    setSelectedLabel(docRef.data().selectedLabel);
    setReportRead(docRef.data().read);
    setInfo(docRef.data());
    setReportModalId(reportId);

    const tagsRef = await getDoc(doc(db, 'tags', userId));
    setActiveLabels(tagsRef.data()['Labels']['active']);

    // Get report submission user info
    // const mobileUserRef = doc(db,"mobileUsers",docRef.data().userID);
    // const docSnap = await getDoc(mobileUserRef);

    const mUserRef = doc(db, 'mobileUsers', docRef.data().userID);
    const docSnap = await getDoc(mUserRef);

    if (docSnap.exists()) {
      setReportSubmitBy(docSnap.data());
    } else {
      console.log('No such document!');
    }
    setReportModalShow(true);
  }; // end handleReportModalShow

  useEffect(() => {
    console.log(reportModalId)
    if (reportModalShow && reportModalId) {
      // When a report's modal opens set the report as read
      // since someone clicked on it - so they read it
      // but only if it is an agency user.
      isAgency === true && handleChangeRead(reportModalId, true);
    } else {
      setReportModalId('');
      setReportModalShow(false);
    }
  }, [reportModalShow]); // this effect runs when the report modal is opened/closed
  // list item handle read change
  const handleChangeRead = async (reportId, checked) => {
    setReportsRead((prevReportsRead) => ({
      ...prevReportsRead,
      [reportId]: checked
    }));

    // Update the Firestore document with the new read status
    const docRef = doc(db, 'reports', reportId);
    await updateDoc(docRef, { read: checked });
  };
  // modal item read change
  // function runs when report modal is displayed
  // and user clicks the read/unread toggle
  const handleChangeReadModal = async (reportId, checked) => {
    const docRef = doc(db, 'reports', reportId);
    await updateDoc(docRef, { read: checked });
    setUpdate(!update);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setReportModalShow(false);
  };
  const handleNoteChange = async (e) => {
    e.preventDefault();
    let reportId = reportModalId;
    if (e.target.value !== report['note']) {
      const docRef = doc(db, 'reports', reportId);
      await updateDoc(docRef, { note: e.target.value });
      setUpdate(e.target.value);
    } else {
      setUpdate('');
    }
  };
  const handleLabelChange = async (e) => {
    e.preventDefault();
    let reportId = reportModalId;
    if (e.target.value !== info['label']) {
      const docRef = doc(db, 'reports', reportId);
      await updateDoc(docRef, { label: e.target.value });
      setUpdate(e.target.value);
    } else {
      setUpdate('');
    }
  };
  // Delete report
  const handleReportDelete = async (e) => {
    reportModalShow ? e.preventDefault() : setReportModalId(e);
    setDeleteModal(true);
  };
  const handleDelete = async (e) => {
    const docRef = doc(db, 'reports', reportModalId);
    deleteDoc(docRef)
      .then(() => {
        getData();
        setReportModalShow(false);
        setDeleteModal(false);
      })
      .catch((error) => {
        console.log('The write failed' + error);
      });
  };
  useEffect(() => {
    // getData()
    if (info['createdDate']) {
      const options = {
        day: '2-digit',
        year: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric'
      };
      setPostedDate(
        info['createdDate']
          .toDate()
          .toLocaleString('en-US', options)
          .replace(/,/g, '')
          .replace('at', '')
      );
    }
    if (info['city'] || info['state']) {
      setReportLocation(info['city'] + ', ' + info['state']);
    }
  }, [reportModalShow]);

  useEffect(() => {
    if (info['createdDate']) {
      const options = {
        day: '2-digit',
        year: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric'
      };
      setPostedDate(
        info['createdDate']
          .toDate()
          .toLocaleString('en-US', options)
          .replace(/,/g, '')
          .replace('at', '')
      );
    }
    if (info['label']) {
      setSelectedLabel(info['label']);
    }
  }, [info, reportModalShow]);
  useEffect(() => {
    getData();
  }, [update]);
  useEffect(() => {
    const reportsUnsubscribe = onSnapshot(
      collection(db, 'reports'),
      (querySnapshot) => {
        const reportsArray = [];
        querySnapshot.forEach((doc) => {
          reportsArray.push({
            data: doc.data(),
            id: doc.id,
            read: doc.data().read
          });
        });
        setReports(reportsArray);

        // Initialize reportsRead with read status of each report
        const initialReportsRead = reportsArray.reduce((acc, report) => {
          acc[report.id] = report.read; // Use report ID as key and read status as value
          return acc;
        }, {});
        // Set reportsRead state
        setReportsRead(initialReportsRead);
      }
    );

    return () => {
      // Unsubscribe when the component unmounts
      reportsUnsubscribe()
    }
  },[])

  const columns = [
    { label: 'Title', accessor: 'title' },
    { label: 'Date/Time', accessor: 'createdDate' },
    { label: 'Candidates', accessor: 'candidates' },
    { label: 'Topic Tags', accessor: 'topic' },
    { label: 'Sources', accessor: 'hearFrom' },
    { label: 'Labels', accessor: 'label' },
    { label: 'Read/Unread', accessor: 'read' },
  ];

  const handleSorting = (sortField, sortOrder) => {
    if (sortField) {
      const sorted = [...loadedReports].sort((a,b) => {
        return (
          a[sortField].toString().localeCompare(b[sortField].toString(), 'en', {
            numeric: true
          }) * (sortOrder === 'asc' ? 1 : -1)
        );
      });
      setLoadedReports(sorted);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row py-5 md:justify-between">
        <div className="text-center md:text-left text-lg font-bold text-blue-600 tracking-wider pb-2 md:pb-0">
          List of Reports
        </div>
        <div className="flex flex-row flex-wrap md:flex-nowrap items-center justify-center md:justify-evenly">
          <div className="p-0 px-4 md:p-4 md:py-0 md:px-4">
            {!refresh && !reportsUpdated && (
              <button
                className="relative top-1 m-0 md:m-0"
                onClick={handleRefresh}
                data-tip="Refresh"
                data-for="refreshTooltip">
                <IoMdRefresh size={20} />
              </button>
            )}
            {/* Displays loading icon when reports are being updated*/}
            {refresh && !reportsUpdated && (
              <div>
                <svg
                  aria-hidden="true"
                  className="ml-2 w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </div>
            )}
            {/* Displays notification once reports have been refreshed. */}
            {!refresh && reportsUpdated && (
              <div>
                <span className="px-1">Reports up to date.</span>
                <button
                  className={globalStyles.button.sm}
                  onClick={() => setReportsUpdated(false)}>
                  Dismiss
                </button>
              </div>
            )}
          </div>
          <div>
            {/* New report tooltip */}
            {/* <ReactTooltip
                id="newReportTooltip"
                place="top"
                type="light"
                effect="solid"
                delayShow={500}
              /> */}
            <button
              onClick={() => setNewReportModal(true)}
              className="flex items-center text-sm bg-white px-4 border-none shadow text-black py-1 rounded-md hover:shadow-none active:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              data-tip="Create a new report"
              data-for="newReportTooltip">
              <IoAdd className="mr-1" size={15} />
              New Report
            </button>
          </div>
          <div className="mb-0">
            {/* Filter tooltip */}
            {/* <ReactTooltip
							id="filterTooltip"
							place="top"
							type="light"
							effect="solid"
							delayShow={500}
						/> */}
            <select
              id="label_read"
              onChange={(e) => handleReadFilterChanged(e)}
              defaultValue="All"
              data-tip="Filter reports"
              data-for="filterTooltip"
              className="text-sm font-semibold shadow bg-white inline-block px-8 border-none text-black py-1 rounded-md mr-1 md:mx-2 hover:shadow-none">
              <option value="false">Unread</option>
              <option value="true">Read</option>
              <option value="All">All reports</option>
            </select>
          </div>
          <div className="mt-2 md:mt-0">
            {/* Timeframe tooltip */}
            {/* <ReactTooltip
							id="timeframeTooltip"
							place="top"
							type="light"
							effect="solid"
							delayShow={500}
						/> */}
            <select
              id="label_date"
              onChange={(e) => handleDateChanged(e)}
              defaultValue="4"
              data-tip="Select timeframe"
              data-for="timeframeTooltip"
              className="text-sm font-semibold shadow bg-white inline-block px-8 border-none text-black py-1 rounded-md hover:shadow-none">
              <option value="4">Last four weeks</option>
              <option value="3">Last three weeks</option>
              <option value="2">Last two weeks</option>
              <option value="1">Last week</option>
              <option value="100">All reports</option>
            </select>
          </div>
        </div>
      </div>
      <InfiniteScroll
        className="overflow-x-auto"
        dataLength={endIndex}
        next={handleReportScroll}
        inverse={false} //
        hasMore={hasMore}
        loader={<h4>Loading...</h4>}
        scrollableTarget="scrollableDiv"
        reportTitle={reportTitle}>
        {/* TODO: change here*/}
        {/* Switched to table as tailwind supports that feature better. See: https://tailwind-elements.com/docs/standard/data/tables/ */}

        <Card className="h-full w-full overflow-scroll">
          <table className="w-full min-w-max table-auto text-left">
            <TableHead columns={columns} handleSorting={handleSorting} />

            <TableBody
              columns={columns}
              loadedReports={loadedReports} // Table data
              endIndex={endIndex}
              reportsRead={reportsRead}
              reportId={reportId}
              onReportModalShow={handleReportModalShow}
              onChangeRead={handleChangeRead}
              onReportDelete={handleReportDelete}
            />
          </table>
        </Card>

        {reportModalShow && (
          <ReportModal
            reportModalShow={reportModalShow}
            report={report}
            reportTitle={reportTitle}
            key={reportModalId}
            note={note}
            detail={detail}
            info={info}
            checked={reportsRead[report.id]} // Pass the checked state for the selected report
            onReadChange={handleChangeReadModal}
            reportSubmitBy={reportSubmitBy}
            setReportModalShow={setReportModalShow}
            reportModalId={reportModalId}
            onNoteChange={handleNoteChange}
            onLabelChange={handleLabelChange}
            selectedLabel={selectedLabel}
            activeLabels={activeLabels}
            changeStatus={changeStatus}
            onFormSubmit={handleFormSubmit}
            onReportDelete={handleReportDelete}
            postedDate={postedDate}
            onUserSendEmail={handleUserSendEmail}
            reportLocation={reportLocation}
          />
        )}
      </InfiniteScroll>
      {newReportModal && (
        <NewReport
          setNewReportModal={setNewReportModal}
          handleNewReportSubmit={handleNewReportSubmit}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          func={handleDelete}
          title="Are you sure you want to delete this report?"
          subtitle=""
          CTA="Delete"
          closeModal={setDeleteModal}
        />
      )}
    </div>
  );
};

export default ReportsSection;
