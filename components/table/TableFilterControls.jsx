import React from 'react'
import { Tabs, TabsHeader, Tab, Tooltip, IconButton, Spinner } from '@material-tailwind/react'
import { IoMdRefresh } from 'react-icons/io'

const TableFilterControls = ({
	readFilter,
	onReadFilterChange,
	onRefresh,
	refresh,
	showCheckmark,
	includeArchived,
	onIncludeArchivedChange,
}) => {
  return (
    <div data-component="TableFilterControls" className="flex items-center gap-4">
      <Tabs value={readFilter} className="w-full md:w-max">
        <TabsHeader>
          {['all', 'true', 'false'].map((value) => (
            <Tab key={value} value={value} onClick={() => onReadFilterChange(value)}>
              {value === 'all' ? 'All' : value === 'true' ? 'Read' : 'Unread'}
            </Tab>
          ))}
        </TabsHeader>
      </Tabs>
      <Tooltip content="Refresh Reports" placement="bottom-start">
        <IconButton variant="text" className='border-b-2 border-l-2 border-r-2' onClick={onRefresh}>
          {!refresh && !showCheckmark && <IoMdRefresh size={20} />}
          {refresh && <Spinner color="blue" />}
          {!refresh && showCheckmark && <IoMdRefresh size={20} color="green" />}
        </IconButton>
      </Tooltip>
      {onIncludeArchivedChange && (
        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => onIncludeArchivedChange(e.target.checked)}
          />
          Show archived
        </label>
      )}
    </div>
  )
}

export default TableFilterControls
