/**
 * @fileoverview AgencySelectionStep - Step 2 of the report creation process
 * 
 * This component handles the agency selection step where users choose which
 * agency to submit their report to. Agencies are filtered based on the user's
 * location and state.
 * 
 * @module components/reports/ReportSteps/AgencySelectionStep
 * @requires react
 * @requires @material-tailwind/react
 * @requires next-i18next
 */

import React from 'react'
import { Typography, Card, List, ListItem } from '@material-tailwind/react'
import { useTranslation } from 'next-i18next'
import globalStyles from '../../../styles/globalStyles'

/**
 * AgencySelectionStep Component
 * 
 * Renders the agency selection step of the report creation process.
 * Displays a list of available agencies for the user's state and
 * handles agency selection with validation.
 * 
 * @param {Object} props - Component props
 * @param {Array<string>} props.agencies - List of available agencies
 * @param {string} props.selectedAgency - Currently selected agency
 * @param {Function} props.setSelectedAgency - Function to update selected agency
 * @param {Object} props.errors - Form validation errors
 * @param {Function} props.onNext - Function to proceed to next step
 * @returns {JSX.Element} The agency selection step component
 */
const AgencySelectionStep = ({
  agencies,
  selectedAgency,
  setSelectedAgency,
  errors,
  onNext
}) => {
  const { t } = useTranslation('NewReport')

  return (
    <div className={globalStyles.form.viewWrapper}>
      <Typography variant='h5'>{t("which_agency")}</Typography>
      <Card>
        <List>
          {agencies.length === 0 && t("noAgencies")}
          {agencies.map((agency, i = self.crypto.randomUUID()) => (
            <ListItem
              id='agency'
              key={i}
              selected={agency === selectedAgency}
              value={agency}
              onClick={() => setSelectedAgency(agency)}>
              {agency}
            </ListItem>
          ))}
        </List>
      </Card>
      {errors.agency && selectedAgency === "" && (
        <span className='text-red-500'>{errors.agency}</span>
      )}
      {/* FORWARD ARROW */}
      {selectedAgency !== "" && (
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

export default AgencySelectionStep
