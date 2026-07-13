/**
 * @fileoverview Shared city/state location field for profile forms.
 *
 * Idle mode shows a read-only summary (optional Edit button); edit mode
 * shows State/City selects with optional Cancel/Save so agency and user
 * location pickers can share one chrome style.
 */
import React from 'react'
import { State, City } from 'country-state-city'
import { Button } from '@material-tailwind/react'
import FormInput from '../../ui/FormInput'
import FormSelect from '../../ui/FormSelect'

/**
 * Presentational location picker with floating-label controls.
 *
 * @param {Object} props
 * @param {string} [props.idPrefix='location']
 * @param {string} props.label
 * @param {boolean} props.isEditing
 * @param {string} props.displayValue
 * @param {string} [props.country='US']
 * @param {Object|null} props.stateValue
 * @param {Object|null} props.cityValue
 * @param {{ state?: string, city?: string }} [props.errors]
 * @param {(e?: React.MouseEvent|React.FormEvent) => void} [props.onToggleEdit]
 * @param {(state: Object) => void} props.onStateChange
 * @param {(city: Object) => void} props.onCityChange
 * @param {string} [props.stateLabel='State']
 * @param {string} [props.cityLabel='City']
 * @param {string} [props.cancelLabel='Cancel']
 * @param {string} [props.editLabel='Edit Location']
 * @param {boolean} [props.showEditButton=true] - Idle-mode Edit button
 * @param {boolean} [props.showCancelButton=true] - Edit-mode Cancel control
 * @param {((e: React.MouseEvent) => void)|undefined} [props.onSave]
 * @param {string} [props.saveLabel='Save']
 * @param {string|null} [props.successMessage]
 * @returns {JSX.Element}
 */
const LocationField = ({
  idPrefix = 'location',
  label,
  isEditing,
  displayValue,
  country = 'US',
  stateValue,
  cityValue,
  errors = {},
  onToggleEdit,
  onStateChange,
  onCityChange,
  stateLabel = 'State',
  cityLabel = 'City',
  cancelLabel = 'Cancel',
  editLabel = 'Edit Location',
  showEditButton = true,
  showCancelButton = true,
  onSave,
  saveLabel = 'Save',
  successMessage = null,
}) => {
  if (!isEditing) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex-1 min-w-0">
            <FormInput
              id={`${idPrefix}_summary`}
              label={label}
              type="text"
              className="bg-white"
              value={displayValue}
              readOnly
            />
          </div>
          {showEditButton && (
            <Button
              type="button"
              variant="outlined"
              color="blue"
              className="shrink-0"
              onClick={onToggleEdit}>
              {editLabel}
            </Button>
          )}
        </div>
        {successMessage && (
          <p className="text-green-800 text-sm mt-2 transition-opacity opacity-100">
            {successMessage}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 w-full min-w-0">
          <FormSelect
            id={`${idPrefix}_state`}
            label={stateLabel}
            isSearchable
            value={stateValue}
            options={State.getStatesOfCountry(country)}
            getOptionLabel={(options) => options['name']}
            getOptionValue={(options) => options['name']}
            onChange={onStateChange}
          />
          {errors.state && !stateValue && (
            <span className="text-red-500 text-xs">{errors.state}</span>
          )}
        </div>
        <div className="flex-1 w-full min-w-0">
          <FormSelect
            id={`${idPrefix}_city`}
            label={cityLabel}
            value={cityValue}
            options={City.getCitiesOfState(
              stateValue?.countryCode,
              stateValue?.isoCode
            )}
            getOptionLabel={(options) => options['name']}
            getOptionValue={(options) => options['name']}
            onChange={onCityChange}
          />
          {errors.city && !cityValue && (
            <span className="text-red-500 text-xs">{errors.city}</span>
          )}
        </div>
        {showCancelButton && (
          <button
            type="button"
            className="text-red-500 cursor-pointer shrink-0 sm:mt-3"
            onClick={onToggleEdit}>
            {cancelLabel}
          </button>
        )}
      </div>
      {onSave && (
        <div className="flex justify-end">
          <Button type="button" color="blue" onClick={onSave}>
            {saveLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export default LocationField
