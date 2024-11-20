import React from 'react'
import globalStyles from '../../../styles/globalStyles'
import { Tooltip, Typography, Switch } from '@material-tailwind/react'
import { IoTrash } from 'react-icons/io5'
import MemoizedTooltipContent from './MemoizedTooltipContent'

const TableBody = ({
  loadedReports,
  columns,
  onReportModalShow,
  onRowChangeRead,
  onReportDelete,
  reportsReadState
}) => {
  function trimToWordCount(str, wordCount) {
    const words = str.split(' ')
    return words.length <= wordCount ? str : words.slice(0, wordCount).join(' ') + '...'
  }

  return (
    <tbody>
      {loadedReports.length === 0 ? (
        <tr>
          <td colSpan="7" className="text-center">
            No reports
          </td>
        </tr>
      ) : (
        loadedReports.map((report) => {
          const details = trimToWordCount(report.detail || '',25)
          const title = report.title
          const formattedDate = new Date(report['createdDate'].seconds * 1000).toLocaleString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            }
          )

          return (
            <tr
              key={report.reportID}
              onClick={() => onReportModalShow(report.reportID)}
              className={`${globalStyles.table.tr} cursor-pointer`}>
              {columns.map(({ accessor }) => {
                let tData
                if (accessor === 'createdDate') {
                  tData = <Typography>{formattedDate}</Typography>
                } else if (accessor === 'label') {
                  tData = (
                    <Typography
                      className={`${globalStyles.label.default} ${
                        report.label === 'Flagged' && 'bg-orange-200'
                      } ${report.label === 'Important' && 'bg-yellow-400'}`}
                      data-tip="Change label"
                      data-for="labelTooltip">
                      {report[accessor] || 'None'}
                    </Typography>
                  )
                } else if (accessor === 'read') {
                  tData = (
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={reportsReadState[report.reportID] || false}
                        onChange={(e) => onRowChangeRead(report.reportID, e.target.checked)}
                        color="blue"
                      />
                      <Tooltip content="Delete Report" placement="top-start">
                        <button
                          onClick={() => onReportDelete(report.reportID)}
                          data-tip="Delete report"
                          className={globalStyles.icon.hover}>
                          <IoTrash size={20} className="ml-4 fill-gray-400 hover:fill-red-600" />
                        </button>
                      </Tooltip>
                    </div>
                  )
                } else if (accessor === 'title') {
                  // Apply the tooltip specifically to the detail column
                  tData = (
                    <Tooltip content={<MemoizedTooltipContent details={details} />} placement="bottom-end">
                      <Typography>{title}</Typography>
                    </Tooltip>
                  )
                } else {
                  // Render other data normally
                  tData = report[accessor] || '——'
                }
                return (
                  <td className={globalStyles.table.tdText} key={`${report.reportID}-${accessor}`}>
                    {tData}
                  </td>
                )
              })}
            </tr>
          )
        })
      )}
    </tbody>
  )
}

export default TableBody
