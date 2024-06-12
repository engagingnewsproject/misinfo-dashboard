import React, { useState, useEffect } from 'react';
import globalStyles from '../../../styles/globalStyles';
import { Tooltip, Typography } from '@material-tailwind/react';
import { Switch } from "@material-tailwind/react";
import { IoTrash } from 'react-icons/io5';
const TableBody = ({
  filteredReports,
  columns,
  endIndex,
  onReportModalShow,
  onRowChangeRead,
  onReportDelete,
  reportsReadState
}) => {
  function trimToWordCount(str, wordCount) {
    // Split the string into an array of words
    const words = str.split(' ');

    // If the word count is less than or equal to the desired count, return the original string
    if (words.length <= wordCount) {
      return str;
    }

    // Select the first 'wordCount' words and join them back into a string
    return words.slice(0, wordCount).join(' ') + '...';
  }
  return (
    <tbody>
      {/* Check if loadedReports is empty */}
      {filteredReports.length === 0 ? (
        <tr>
          <td colSpan="7" className="text-center">
            No reports
          </td>
        </tr>
      ) : (
        filteredReports.slice(0, endIndex).map((reportObj, i = self.crypto.randomUUID()) => {
          const report = reportObj;
          let details = report.detail
          details = trimToWordCount(details, 25);
          const formattedDate = new Date(report['createdDate'].seconds * 1000)
          .toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
          });
          return (
            <Tooltip content={
              <div className="w-80">
                <Typography
                  color="white"
                  className="font-normal opacity-80"
                >
                  {details}
                </Typography>
              </div>
            }
              key={i}
            >
            <tr
              onClick={() => onReportModalShow(report['reportID'])}
              className={`${globalStyles.table.tr} cursor-pointer`}
              key={report['reportID']}>
              {columns.map(({ accessor }) => {
                let tData;
                if (accessor === 'createdDate') {
                  tData = <Typography>{ formattedDate }</Typography>
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
                  );
                } else if (accessor === 'read') {
                  // Special handling for read/unread column
                  tData = (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={reportsReadState[report.reportID] !== undefined && reportsReadState[report.reportID]}
                        onChange={(e) => onRowChangeRead(report.reportID,e.target.checked)}
                        color="blue" 
                      />
                      <Tooltip content="Delete Report" placement="top-start">
                      <button
                        onClick={() => onReportDelete(report['reportID'])}
                        data-tip="Delete report"
                        className={globalStyles.icon.hover}>
                        <IoTrash
                          size={20}
                          className="ml-4 fill-gray-400 hover:fill-red-600"
                        />
                        </button>
                      </Tooltip>
                    </div>
                  );
                } else {
                  // Render other data normally
                  tData = report[accessor] || '——';
                }
                return (
                  <td className={globalStyles.table.tdText} key={accessor}>
                    {tData}
                  </td>
                );
              })}
              </tr>
            </Tooltip>
          );
        })
      )}
    </tbody>
  );
};

export default TableBody;
