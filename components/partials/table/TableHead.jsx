import React, { useState } from 'react';
import { Typography } from '@material-tailwind/react';
import { HiOutlineChevronUpDown } from "react-icons/hi2";

const TableHead = ({ columns, handleSorting }) => {
  const [sortField, setSortField] = useState('');
  const [order, setOrder] = useState('asc');

  const handleSortingChange = (accessor) => {
    if (accessor) {
      const sortOrder =
        accessor === sortField && order === 'asc' ? 'desc' : 'asc';
      setSortField(accessor);
      setOrder(sortOrder);
      handleSorting(accessor, sortOrder);
    }
  };

  return (
    <thead>
      <tr className="bg-gray-100">
        {columns.map(({ label, accessor }) => {
          return (
            <th
              key={accessor}
              onClick={() => handleSortingChange(accessor)}
              className="cursor-pointer border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 transition-colors hover:bg-blue-gray-100">
              <Typography
                variant="paragraph"
                color="blue-gray"
                className="flex items-center justify-between gap-2 font-normal leading-none opacity-70">
                {label}
                <HiOutlineChevronUpDown strokeWidth={2} className="h-4 w-4" />
              </Typography>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default TableHead;
