import React from 'react'
import globalStyles from '../../styles/globalStyles'
import { Tooltip, Typography, Switch } from '@material-tailwind/react'
import { IoTrash } from 'react-icons/io5'
import MemoizedTooltipContent from './MemoizedTooltipContent'
import {
  displayLabel,
  getLabelBadgeStyle,
  isInvestigationPending,
} from '../../config/labels'
import { DEFAULT_INVESTIGATION_ROW } from '../../utils/appearance-config'

const TableBody = ({
  loadedReports,
  columns,
  onReportModalShow,
  onRowChangeRead,
  onReportDelete,
  reportsReadState,
  agencyLabelColors = {},
  agencyLabelColorsByAgency = {},
  investigationHighlight = DEFAULT_INVESTIGATION_ROW,
}) => {
  function trimToWordCount(str, wordCount) {
    const words = str.split(' ')
    return words.length <= wordCount ? str : words.slice(0, wordCount).join(' ') + '...'
  }

  const getColorsForReport = (report) => {
    if (agencyLabelColors && Object.keys(agencyLabelColors).length > 0) {
      return agencyLabelColors
    }
    return agencyLabelColorsByAgency[report.agency] || {}
  }

  const highlightBg = investigationHighlight?.bg || DEFAULT_INVESTIGATION_ROW.bg
  const highlightHover =
    investigationHighlight?.hover || DEFAULT_INVESTIGATION_ROW.hover

  return (
    <tbody>
      {loadedReports.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className="text-center">
            No reports
          </td>
        </tr>
      ) : (
        loadedReports.map((report) => {
          const details = trimToWordCount(report.detail || '',25)
          const title = report.title
          const isArchived = report.archived === true
          const needsInvestigation = isInvestigationPending(report.label)
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
              className={`p-4 border-b border-blue-gray-50 cursor-pointer ${
                needsInvestigation ? '' : 'hover:bg-gray-100'
              }`}
              style={
                needsInvestigation ? { backgroundColor: highlightBg } : undefined
              }
              onMouseEnter={
                needsInvestigation
                  ? (e) => {
                      e.currentTarget.style.backgroundColor = highlightHover
                    }
                  : undefined
              }
              onMouseLeave={
                needsInvestigation
                  ? 'bg-red-50 hover:bg-red-100'
                  : 'hover:bg-gray-100'
              }`}>
              {columns.map(({ accessor }) => {
                let tData
                if (accessor === 'createdDate') {
                  tData = <Typography>{formattedDate}</Typography>
                } else if (accessor === 'label') {
                  const badgeStyle = getLabelBadgeStyle(
                    report.label,
                    getColorsForReport(report),
                  )
                  tData = (
                    <Typography
                      className={`${globalStyles.label.default} px-5 py-1 rounded-md`}
                      style={badgeStyle}
                      data-tip="Change label"
                      data-for="labelTooltip">
                      {displayLabel(report.label)}
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
                      <Typography className="flex items-center gap-2">
                        {title}
                        {isArchived && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                            Archived
                          </span>
                        )}
                      </Typography>
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
