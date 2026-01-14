// MemoizedTooltipContent.jsx
import React from 'react'
import { Typography } from '@material-tailwind/react'

// Memoized Tooltip Component
const MemoizedTooltipContent = React.memo(({ details }) => (
  <div className="w-80">
    <Typography color="white" className="font-normal opacity-80">
      Description: {details}
    </Typography>
  </div>
))

// Add the display name for the memoized component
MemoizedTooltipContent.displayName = 'MemoizedTooltipContent'

export default MemoizedTooltipContent
