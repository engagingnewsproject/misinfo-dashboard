/**
 * @fileoverview SourceSelectionStep - Step 4 of the report creation process
 * 
 * This component handles the source selection step where users choose where
 * they heard about the potential misinformation. Supports both predefined
 * sources and custom source creation.
 * 
 * @module components/reports/ReportSteps/SourceSelectionStep
 * @requires react
 * @requires @material-tailwind/react
 * @requires next-i18next
 */

import React from 'react'
import { Typography, Card, List, ListItem, Input } from '@material-tailwind/react'
import { IoIosInformationCircle } from "react-icons/io"
import { useTranslation } from 'next-i18next'
import globalStyles from '../../../styles/globalStyles'

/**
 * SourceSelectionStep Component
 * 
 * Renders the source selection step of the report creation process.
 * Displays a list of available sources and allows custom source creation.
 * 
 * @param {Object} props - Component props
 * @param {Array<string>} props.sources - List of available sources
 * @param {string} props.selectedSource - Currently selected source
 * @param {Function} props.handleSourceChange - Function to handle source selection
 * @param {boolean} props.showOtherSource - Whether to show custom source input
 * @param {string} props.otherSource - Custom source value
 * @param {Function} props.handleOtherSourceChange - Function to handle custom source input
 * @param {Object} props.errors - Form validation errors
 * @param {Function} props.onNext - Function to proceed to next step
 * @returns {JSX.Element} The source selection step component
 */
const SourceSelectionStep = ({
  sources,
  selectedSource,
  handleSourceChange,
  showOtherSource,
  otherSource,
  handleOtherSourceChange,
  errors,
  onNext
}) => {
  const { t } = useTranslation('NewReport')
  
  // Default sources for translation
  const defaultSources = ["Newspaper", "Other", "Social", "Website"]

  return (
    <div className={globalStyles.form.viewWrapper}>
      <Typography variant='h5'>{t("where")}</Typography>
      <Card>
        <List>
          {[
            ...sources.filter((source) => source !== "Other"),
            ...sources.filter((source) => source === "Other"),
          ].map((source, i = self.crypto.randomUUID()) => (
            <ListItem
              id='source'
              key={i}
              selected={source === selectedSource}
              value={t(source)}
              onClick={() => handleSourceChange(source)}>
              {defaultSources.includes(source) ? t("sources." + source) : source}
            </ListItem>
          ))}
        </List>
      </Card>
      {errors.source && selectedSource === "" && (
        <span className='text-red-500'>{errors.source}</span>
      )}
      {showOtherSource && (
        <div className='w-full'>
          <Input
            label={t("custom_source")}
            value={otherSource}
            onChange={handleOtherSourceChange}
          />
          <Typography
            variant='small'
            color='gray'
            className={globalStyles.mdInput.hint}>
            <IoIosInformationCircle />
            {t("custom_source")}
          </Typography>
        </div>
      )}
      {selectedSource !== "" && (
        <div className='absolute bottom-4 right-4 sm:right-6'>
          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default SourceSelectionStep
