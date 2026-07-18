/**
 * @fileoverview Agency settings form for the profile page.
 *
 * View mode is read-only with one Edit; edit mode reveals name, location,
 * and logo controls with Cancel/Done in the header (same as Account).
 */
import React from 'react'
import Image from 'next/image'
import { Button, Typography } from '@material-tailwind/react'
import FormInput from '../ui/FormInput'
import MediaUploadField from '../ui/MediaUploadField'
import LocationField from '../partials/forms/LocationField'

/**
 * Renders the agency settings section (name, location, logo).
 *
 * @param {Object} props
 * @param {Object} props.agency
 * @param {string} props.agencyName
 * @param {string|null} props.agencyCity
 * @param {string|null} props.agencyState
 * @param {{ country: string, state: Object|null, city: Object|null }} props.data
 * @param {Object} props.errors
 * @param {File[]} props.images
 * @param {React.RefObject<HTMLInputElement>} props.imgPicker
 * @param {boolean} props.isEditing - Section-level edit mode
 * @param {boolean} props.agencyUpdateMessageShow
 * @param {() => void} props.onEdit
 * @param {() => void} props.onCancel
 * @param {(e: React.FormEvent) => void} props.onSubmit
 * @param {(e: React.ChangeEvent) => void} props.onNameChange
 * @param {(state: Object) => void} props.onStateChange
 * @param {(city: Object) => void} props.onCityChange
 * @param {(e: React.ChangeEvent) => void} props.onImageChange
 * @param {(index: number) => void} props.onRemoveImage
 * @returns {JSX.Element}
 */
const AgencySettingsForm = ({
  agency,
  agencyName,
  agencyCity,
  agencyState,
  data,
  errors,
  images,
  imgPicker,
  isEditing,
  agencyUpdateMessageShow,
  onEdit,
  onCancel,
  onSubmit,
  onNameChange,
  onStateChange,
  onCityChange,
  onImageChange,
  onRemoveImage,
}) => {
  const logoSrc = agency.logo?.[0] || '/img/no-image.webp'
  const logoAlt = agency.logo?.[0]
    ? `${agency.name} logo`
    : 'No agency logo'

  return (
    <section className="mb-8 p-6 bg-white rounded-lg border border-blue-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Typography variant="h2" className="mt-0 mb-0 text-brand">
          Agency Settings
        </Typography>
        {isEditing ? (
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outlined"
              color="red"
              onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" color="blue" form="agencyDesign">
              Done
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outlined"
            color="blue"
            className="shrink-0"
            onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>

      <div className="w-full h-auto">
        <form
          id="agencyDesign"
          className="flex flex-col"
          onSubmit={onSubmit}>
          <div className="mt-4 mb-4 flex flex-col gap-4">
            <div>
              <FormInput
                id="agency_name"
                onChange={onNameChange}
                label="Agency Name"
                type="text"
                className="bg-white"
                value={agencyName}
                readOnly={!isEditing}
              />
              {errors.name && (
                <span className="text-red-500 text-xs">{errors.name}</span>
              )}
            </div>

            <LocationField
              idPrefix="agency"
              label="Agency Location"
              isEditing={isEditing}
              displayValue={`${agencyCity || ''}, ${agencyState || ''}`}
              country={data.country || 'US'}
              stateValue={data.state}
              cityValue={data.city}
              errors={{ state: errors.state, city: errors.city }}
              onStateChange={onStateChange}
              onCityChange={onCityChange}
              showEditButton={false}
              showCancelButton={false}
            />

            {isEditing ? (
              <div className="flex-1 min-w-0">
                {images.length === 0 && (
                  <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={70}
                    height={100}
                    className="mb-2 h-auto"
                  />
                )}
                <MediaUploadField
                  id="agency_logo_file"
                  inputRef={imgPicker}
                  onChange={onImageChange}
                  onRemoveFile={onRemoveImage}
                  files={images}
                  multiple={false}
                  label="Agency Logo"
                  actionText="Choose image"
                />
                {errors.image && images.length === 0 && (
                  <span className="text-red-500">{errors.image}</span>
                )}
              </div>
            ) : (
              <div className="relative w-full bg-white rounded-md border border-blue-gray-200 px-3 py-3">
                <span className="pointer-events-none absolute left-3 -top-2 z-[1] bg-white px-1 text-[11px] leading-tight text-gray-900">
                  Agency Logo
                </span>
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={70}
                  height={100}
                  className="h-auto"
                />
              </div>
            )}
          </div>

          {agencyUpdateMessageShow && (
            <div className="flex justify-end transition-opacity opacity-100">
              Agency updated
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

export default AgencySettingsForm
