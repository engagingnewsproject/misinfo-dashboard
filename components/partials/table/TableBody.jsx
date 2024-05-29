import React, { useState, useEffect } from 'react';
import globalStyles from '../../../styles/globalStyles';
import { Typography } from '@material-tailwind/react';
import Switch from 'react-switch';
import { IoTrash } from 'react-icons/io5';
const TableBody = ({
  filteredReports,
  columns,
  endIndex,
  onReportModalShow,
  onChangeRead,
  onReportDelete,
  reportsReadState
}) => {
// console.log(reportsReadState)
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
        filteredReports.slice(0, endIndex).map((reportObj) => {
          const report = reportObj;
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
            <tr
              onClick={() => onReportModalShow(report['reportID'])}
              className={globalStyles.table.tr}
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
                    <div
                      className={globalStyles.column.data_center}
                      onClick={(e) => e.stopPropagation()}>
                     <Switch
                        onChange={(checked) =>
                          onChangeRead(report['reportID'], checked)
                        }
                        checked={reportsReadState[report['reportID']]} // Use reportsReadState
                        onColor="#2563eb"
                        offColor="#e5e7eb"
                        uncheckedIcon={false}
                        checkedIcon={false}
                        height={23}
                        width={43}
                        className={`${
                          report['read'] ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                      />
                      <button
                        onClick={() => onReportDelete(report['reportID'])}
                        data-tip="Delete report"
                        className={globalStyles.icon.hover}>
                        <IoTrash
                          size={20}
                          className="ml-4 fill-gray-400 hover:fill-red-600"
                        />
                      </button>
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
          );
        })
      )}
    </tbody>
  );
};

export default TableBody;
