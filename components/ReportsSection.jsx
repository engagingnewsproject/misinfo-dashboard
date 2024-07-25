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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
// Icons
import {
  IoMdRefresh,
  IoIosInformationCircle,
  IoMdCheckmark,
} from 'react-icons/io';
import { IoAdd, IoTrash } from 'react-icons/io5';
// Icons END
// import ReactTooltip from "react-tooltip"
import InfiniteScroll from 'react-infinite-scroll-component';
import NewReport from './modals/NewReportModal';
import ReportModal from './modals/ReportModal';
import ConfirmModal from './modals/ConfirmModal';
import globalStyles from '../styles/globalStyles';
import TableHead from './partials/table/TableHead';
import TableBody from './partials/table/TableBody';
import {
  Button,
  Card,
  CardHeader,
  IconButton,
  Tooltip,
  Alert,
  Typography,
  Badge,
  Spinner,
  Tabs,
  TabsHeader,
  Tab,
  CardBody,
} from '@material-tailwind/react';
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
  const [readFilter, setReadFilter] = useState('all');
  const [reportTitle, setReportTitle] = useState('');
  const [agencyName, setAgencyName] = useState('')
  const [isAgency, setIsAgency] = useState(null);
  const { user, customClaims } = useAuth();

  // Report modal states
  const [report, setReport] = useState('');
  const [reportId, setReportId] = useState('');
  const [reportModalShow, setReportModalShow] = useState(false);
  const [reportModalId, setReportModalId] = useState('');
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState();
  const [reportSubmitBy, setReportSubmitBy] = useState('');
  const [reportRead, setReportRead] = useState(false);
  const [reportsRead,setReportsRead] = useState({}) // Store checked state for each report
  const [reportsReadState, setReportsReadState] = useState({})
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
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [open,setOpen] = useState(true);
  
  useEffect(() => {
    if (customClaims.admin) {
      setIsAgency(false);
    } else if (customClaims.agency) {
      setIsAgency(true);
    }
    return () => {
      isAgency
    }
  });

  // Fetch data when new report is submitted or isAgency is set
  useEffect(() => {
    // console.log('initial getData (from "isAgency" state change)')
    // Ensure isAgency is set before fetching data:
    if (isAgency !== null) {
      getData();
    }
  }, [newReportSubmitted, isAgency]);

  const getData = async () => {
    let reportArr = [];
    let a
    if (isAgency) {
      const q = query(
        collection(db, 'agency'),
        where('agencyUsers', 'array-contains', user.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        a = doc.data().name;
      });
      const r = query(
        collection(db, 'reports'),
        where('agency', '==', a)
      );
      const reportSnapshot = await getDocs(r);
      reportSnapshot.forEach((doc) => {
        const data = doc.data();
        data.reportID = doc.id;
        reportArr.push(data);
      });
    } else {
      const reportSnapshot = await getDocs(collection(db, 'reports'));
      reportSnapshot.forEach((doc) => {
        const data = doc.data();
        data.reportID = doc.id;
        reportArr.push(data);
      });
    }
    setReports(reportArr);
    setReportsReadState(
      reportArr.reduce((acc, report) => {
        acc[report.reportID] = report.read;
        return acc;
      }, {})
    );
  };

  useEffect(() => {    
    setLoadedReports(reports)
    setFilteredReports(reports) // Initialize filteredReports with reports when component mounts
  }, [reports])

  useEffect(() => {
    const filteredReports = loadedReports.filter((report) => {
      if (readFilter === 'all') {
        return true; // Show all reports
      } else if (readFilter === 'true') {
        return report.read === true; // Show only read reports
      } else if (readFilter === 'false') {
        return report.read === false; // Show only unread reports
      }
    });
    setFilteredReports(filteredReports);
  }, [readFilter, loadedReports]);
  
  // Handler that is run once user wants to refresh the reports section
  const handleRefresh = async () => {
    setRefresh(true);
    await getData();
    setReportsUpdated(true);
    setShowCheckmark(true);
    // setReadFilter('all')
    // Set a timer to hide the checkmark icon after 2 seconds
    setTimeout(() => {
      setRefresh(false)
      setShowCheckmark(false);
      setReportsUpdated(false);
    }, 2000);
  };

  useEffect(() => {
    if (readFilter !== 'all') {
      setReadFilter('all')
    }
    return () => {
      readFilter
    }
  }, [refresh])
  
  
  // Filter
  const handleDateChanged = (e) => {
    e.preventDefault();
    setReportWeek(e.target.value);
    setEndIndex(0);

    // Updates loaded reports so that they only feature reports within the selected date range
    let arr = filteredReports.filter((reportObj) => {
      const report = reportObj;
      return (
        report['createdDate'].toDate() >=
        new Date(new Date().setDate(new Date().getDate() - e.target.value * 7))
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
      if (readFilter != 'all') {
        setFilteredReports(
          reports.filter((reportObj) => {
            return reportObj.read.toString() === readFilter;
          })
        );
      } else {
        setFilteredReports(reports);
      }
    } else {
      setFilteredReports(
        reports.filter((reportObj) => {
          const report = Object.values(reportObj);
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
    let arr = filteredReports.filter((report) => {
      // Ensure that createdDate exists and has a toDate method
      try {
        if (
          report.createdDate &&
          typeof report.createdDate.toDate === 'function'
        ) {
          return (
            report.createdDate.toDate() >=
            new Date(new Date().setDate(new Date().getDate() - reportWeek * 7))
          );
        } else {
          console.error(`Invalid createdDate in report.`);
          return false;
        }
      } catch (error) {
        console.error(`Error processing report: ${report}`, error);
        return false;
      }
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
  }, [ reportWeek]) //filteredReports

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

  const handleReadFilterChanged = (value) => {
    setReadFilter(value) // Update the readFilter state first
    if (value !== 'all') {
      const filterValue = value === 'true';
      setFilteredReports(
        reports.filter((report) => {
          return report.read === filterValue;
        })
      );
    } else {
      setFilteredReports(reports);
    }
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
    // console.log(docRef.data().note)
    setNote(docRef.data().note);
    setReportTitle(docRef.data().title);
    setDetail(docRef.data().detail);
    setSelectedLabel(docRef.data().selectedLabel);
    setReportRead(docRef.data().read);
    setInfo(docRef.data());
    setReportModalId(reportId);

    const tagsRef = await getDoc(doc(db,'tags',userId));
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

  // list item handle read change
  const handleRowChangeRead = async (reportId,checked) => {
    // Optimistic UI update
    setReports((prevReports) =>
			prevReports.map((report) =>
				report.reportID === reportId ? { ...report, read: checked } : report
			)
    )
    
		setFilteredReports((prevFilteredReports) =>
			prevFilteredReports.map((report) =>
				report.reportID === reportId ? { ...report, read: checked } : report
			)
		)

		setReportsReadState((prevState) => ({
			...prevState,
			[reportId]: checked,
		}))

		// Firestore update
		try {
			const docRef = doc(db, 'reports', reportId)
			await updateDoc(docRef, { read: checked })
		} catch (error) {
			console.error('Error updating read status:', error)
			// Revert the optimistic update in case of error
			setReports((prevReports) =>
				prevReports.map((report) =>
					report.reportID === reportId ? { ...report, read: !checked } : report
				)
			)

			setFilteredReports((prevFilteredReports) =>
				prevFilteredReports.map((report) =>
					report.reportID === reportId ? { ...report, read: !checked } : report
				)
			)

			setReportsReadState((prevState) => ({
				...prevState,
				[reportId]: !checked,
			}))
		}
  };

  
  useEffect(() => {
    if (reportModalShow && reportModalId) {
      // When a report's modal opens set the report as read
      // since someone clicked on it - so they read it
      // but only if it is an agency user.
      isAgency === true && handleRowChangeRead(reportModalId, true);
    } else {
      setReportModalId('');
      setReportModalShow(false);
    }
  },[reportModalShow]) // this effect runs when the report modal is opened/closed
  

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
    if (e.target.value !== report['label']) {
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
    if (report['createdDate']) {
      const options = {
        day: '2-digit',
        year: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
      };
      setPostedDate(
        report['createdDate']
          .toDate()
          .toLocaleString('en-US', options)
          .replace(/,/g, '')
          .replace('at', '')
      );
    }
    if (report['city'] || report['state']) {
      setReportLocation(report['city'] + ', ' + report['state']);
    }
  }, [reportModalShow]);

  useEffect(() => {
    if (report['createdDate']) {
      const options = {
        day: '2-digit',
        year: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
      };
      setPostedDate(
        report['createdDate']
          .toDate()
          .toLocaleString('en-US', options)
          .replace(/,/g, '')
          .replace('at', '')
      );
    }
    if (report['label']) {
      setSelectedLabel(report['label']);
    }
  }, [reportModalShow]); // report

  useEffect(() => {
    getData();
  }, [update]);

  const columns = [
    { label: 'Title', accessor: 'title', sortable: true },
    { label: 'Date/Time', accessor: 'createdDate', sortable: true },
    { label: 'Candidates', accessor: 'candidates', sortable: false },
    { label: 'Topic Tags', accessor: 'topic', sortable: true },
    { label: 'Sources', accessor: 'hearFrom', sortable: false },
    { label: 'Labels', accessor: 'label', sortable: false },
    { label: 'Read/Unread', accessor: 'read', sortable: true },
  ];

  const readValues = [
    { label: 'All', value: 'all' },
    { label: 'Read', value: 'true' },
    { label: 'Unread', value: 'false' },
  ];

  const handleSorting = (sortField, sortOrder) => {
    if (sortField) {
      const sorted = [...loadedReports].sort((a, b) => {
        // column that includes null values
        if (a[sortField] === null) return 1;
        if (b[sortField] === null) return -1;
        if (a[sortField] === null && b[sortField] === null) return 0;
        return (
          a[sortField].toString().localeCompare(b[sortField].toString(), 'en', {
            numeric: true,
          }) * (sortOrder === 'asc' ? 1 : -1)
        );
      });
      setLoadedReports(sorted);
    }
  };

  return (
    <>
      <Card className="w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-8 flex items-center justify-between gap-8">
            <Typography variant="h5" color="blue">
              List of Reports
            </Typography>
            <Tooltip content="New Report">
            <Button
              onClick={() => setNewReportModal(true)}
              className="flex items-center gap-2">
              <IoAdd className="mr-1" size={15} />
              New Report
              </Button>
              </Tooltip>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="flex">
              <Tabs value={readFilter} className="w-full md:w-max">
                <TabsHeader>
                  {readValues.map(({ label, value }) => (
                    <Tab
                      key={value}
                      value={value}
                      onClick={() => handleReadFilterChanged(value)}>
                      {label}
                    </Tab>
                  ))}
                </TabsHeader>
              </Tabs>
              <Tooltip content="Refresh Reports" placement="right-end">
                <IconButton variant="text" onClick={handleRefresh}>
                  {!refresh && !reportsUpdated && <IoMdRefresh size={20} />}
                  {/* Displays loading icon when reports are being updated*/}
                  {refresh && <Spinner color="blue" />}
                  {/* Displays notification once reports have been refreshed. */}
                  {!refresh && showCheckmark && (
                    <IoMdCheckmark size={20} color="green" />
                  )}
                </IconButton>
              </Tooltip>
            </div>
            <div className="LAST-X-WEEKS">
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
        </CardHeader>
        <CardBody className="overflow-scroll px-0 pt-0">
          <InfiniteScroll
            className="overflow-x-auto"
            dataLength={endIndex}
            next={handleReportScroll}
            inverse={false} //
            hasMore={hasMore}
            loader={<h4>Loading...</h4>}
            scrollableTarget="scrollableDiv"
            reportTitle={reportTitle}>
            <table className="mt-4 w-full min-w-max table-fixed text-left">
              <TableHead columns={columns} handleSorting={handleSorting} />

              <TableBody
                filteredReports={filteredReports} // Table data
                columns={columns}
                endIndex={endIndex}
                onReportModalShow={handleReportModalShow}
                onRowChangeRead={handleRowChangeRead}
                onReportDelete={handleReportDelete}
                reportsReadState={reportsReadState}
              />
            </table>

            {reportModalShow && (
              <ReportModal
                reportModalShow={reportModalShow}
                report={report}
                reportTitle={reportTitle}
                key={reportModalId}
                note={note}
                detail={detail}
                checked={reportsReadState[reportModalId]} // Pass the checked state for the clicked report
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
        </CardBody>
        {newReportModal && (
          <NewReport
            setNewReportModal={setNewReportModal}
            onNewReportSubmit={handleNewReportSubmit}
          />
        )}
      </Card>
      {deleteModal && (
        <ConfirmModal
          func={handleDelete}
          title="Are you sure you want to delete this report?"
          subtitle=""
          CTA="Delete"
          closeModal={setDeleteModal}
        />
      )}
    </>
  );
};

export default ReportsSection;
