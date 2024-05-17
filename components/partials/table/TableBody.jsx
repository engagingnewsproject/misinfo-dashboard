import React, { useState, useEffect } from 'react'
import globalStyles from '../../../styles/globalStyles'
import { Typography } from '@material-tailwind/react'
import Switch from 'react-switch'
import { IoTrash } from 'react-icons/io5'
const TableBody = ({
  loadedReports,
  columns,
  endIndex,
  reportsRead,
  onReportModalShow,
  onChangeRead,
  onReportDelete
}) => {
  return (
    <tbody>
      {/* Check if loadedReports is empty */}
      {loadedReports.length === 0 ? (
        <tr>
          <td colSpan="7" className="text-center">
            No reports
          </td>
        </tr>
      ) : (
        loadedReports.slice(0, endIndex).map((reportObj) => {
          const report = Object.values(reportObj)[0]
          const reportIdValue = Object.values(reportObj)[1]
          const reportId =
            typeof reportIdValue === 'string' ? reportIdValue : ''
          console.log(report.id)
          const posted = report['createdDate']
            .toDate()
            .toLocaleString('en-US', globalStyles.dateOptions)
            .replace(/,/g, '')
            .replace('at', '')
          return (
            <tr
              onClick={() => onReportModalShow(reportId)}
              className={globalStyles.table.tr}
              key={reportId}>
              {columns.map(({ accessor }) => {
                let tData
                if (accessor === 'createdDate') {
                  // Handle Firestore timestamp object
                  const dateObject = report[accessor].toDate()
                  tData = dateObject.toLocaleString(
                    'en-US',
                    globalStyles.dateOptions
                  )
                } else if (accessor === 'label') {
                  // Special handling for label column
                  tData = report[accessor] ? (
                    <Typography
                      className={globalStyles.label.special}
                      data-tip="Change label"
                      data-for="labelTooltip">
                      {report[accessor]}
                    </Typography>
                  ) : (
                    <Typography
                      className={globalStyles.label.default}
                      data-tip="Change label"
                      data-for="labelTooltip">
                      {'None'}
                    </Typography>
                  )
                } else if (accessor === 'read') {
                  // Special handling for read/unread column
                  tData = (
                    <td
                      className={globalStyles.column.data_center}
                      onClick={(e) => e.stopPropagation()}>
                      <Switch
                        onChange={(checked) => onChangeRead(reportId, checked)}
                        checked={reportsRead[reportId]}
                        onColor="#2563eb"
                        offColor="#e5e7eb"
                        uncheckedIcon={false}
                        checkedIcon={false}
                        height={23}
                        width={43}
                        className={`${
                          report.read ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                      />
                      <button
                        onClick={() => onReportDelete(reportId)}
                        data-tip="Delete report"
                        className={globalStyles.icon.hover}>
                        <IoTrash
                          size={20}
                          className="ml-4 fill-gray-400 hover:fill-red-600"
                        />
                      </button>
                    </td>
                  )
                } else {
                  // Render other data normally
                  tData = report[accessor] || '——'
                }
                return (
                  <td key={accessor}>
                    <Typography
                      color="blue-gray"
                      className={globalStyles.table.tdText}>
                      {tData}
                    </Typography>
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
