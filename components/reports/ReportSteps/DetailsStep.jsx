/**
 * @fileoverview DetailsStep - Step 5 of the report creation process
 * 
 * This component handles the details input step where users can provide
 * title, links, images, and detailed description for their report.
 * 
 * @module components/reports/ReportSteps/DetailsStep
 * @requires react
 * @requires @material-tailwind/react
 * @requires next-i18next
 */

import React from 'react'
import FormInput from '../../ui/FormInput'
import FormTextarea from '../../ui/FormTextarea'
import MediaUploadField from '../../ui/MediaUploadField'
import { Typography } from '@material-tailwind/react'
import { useTranslation } from 'next-i18next'
import { IoIosInformationCircle } from 'react-icons/io'
import globalStyles from '../../../styles/globalStyles'

/**
 * DetailsStep Component
 * 
 * Renders the details input step of the report creation process.
 * Handles title, links, image upload, and description input.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Report title
 * @param {Function} props.setTitle - Function to update title
 * @param {boolean} props.titleError - Title validation error state
 * @param {string} props.link - Primary link URL
 * @param {Function} props.setLink - Function to update primary link
 * @param {string} props.secondLink - Secondary link URL
 * @param {Function} props.setSecondLink - Function to update secondary link
 * @param {string} props.detail - Report description
 * @param {Function} props.setDetail - Function to update description
 * @param {boolean} props.detailError - Description validation error state
 * @param {Function} props.handleImageChange - Function to handle image selection
 * @param {Function} [props.handleRemoveImage] - Function to remove a selected image
 * @param {React.RefObject} props.imgPicker - Reference to file input
 * @param {Function} props.handleSubmitClick - Function to handle form submission
 * @param {File[]} props.selectedImages - Array of currently selected image files
 * @returns {JSX.Element} The details step component
 */
const DetailsStep = ({
  title,
  setTitle,
  titleError,
  link,
  setLink,
  secondLink,
  setSecondLink,
  detail,
  setDetail,
  detailError,
  handleImageChange,
  handleRemoveImage,
  imgPicker,
  handleSubmitClick,
  selectedImages = []
}) => {
  const { t } = useTranslation('NewReport')

  return (
    <div data-component="DetailsStep" className='flex flex-col gap-6 mb-1'>
      <div className='block'>
        <Typography variant='h5'>{t("share")}</Typography>
        <Typography
          variant='small'
          color='gray'
          className='mt-2 flex items-start gap-1 italic'>
          <IoIosInformationCircle size="12" className='mt-1' />
          {t("personalInfo")}
        </Typography>
      </div>
      
      {/* TITLE */}
      <div className='block'>
        <Typography>{t("detailDescription")}</Typography>
        <FormInput
          variant='outlined'
          color='gray'
          id='title'
          type='text'
          label={t("title")}
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          error={titleError}
        />
        <Typography
          variant='small'
          color={titleError ? 'red' : 'gray'}
          className='mt-2 flex items-start gap-1 font-normal'>
          <IoIosInformationCircle size="12" className='mt-1' />
          {t("provide_title")} {t("max")}
        </Typography>
        {detailError && (
          <Typography color="red" className="mt-2">{t("atLeast")}</Typography>
        )}
      </div>
      
      {/* LINKS */}
      <div className='block'>
        <FormInput
          variant='outlined'
          color='gray'
          label={t("linkFirst")}
          id='link'
          type='text'
          onChange={(e) => setLink(e.target.value)}
          value={link}
        />
        {!link && (
          <Typography
            variant='small'
            color='gray'
            className='mt-2 flex items-start gap-1 font-normal'>
            <IoIosInformationCircle size="12" className='mt-1' />
            {t("example")} https://
          </Typography>
        )}
        {/* Link 02 */}
        {link && (
          <>
            <div className='mt-2'>
              <FormInput
                variant='outlined'
                color='gray'
                label={t("linkFirst")}
                id='secondLink'
                type='text'
                onChange={(e) => setSecondLink(e.target.value)}
                value={secondLink}
              />
            </div>
            <Typography
              variant='small'
              color='gray'
              className='mt-2 flex items-start gap-1 font-normal'>
              <IoIosInformationCircle size="12" className='mt-1' />
              {t("example")} https://
            </Typography>
          </>
        )}
      </div>
      
      {/* IMAGE UPLOAD */}
      <div className='block'>
        <MediaUploadField
          id='multiple_files'
          inputRef={imgPicker}
          onChange={handleImageChange}
          onRemoveFile={handleRemoveImage}
          files={selectedImages}
          label={t("image")}
          actionText={t("choose_files")}
          helperText={t("imageDescription")}
        />
      </div>
      
      {/* DESCRIBE IN DETAIL */}
      <div className='block'>
        <FormTextarea
          type="textarea"
          id='detail'
          onChange={(e) => setDetail(e.target.value)}
          value={detail}
          label={t("detailed")}
          rows={8}
        />
        <Typography
          variant='small'
          color='gray'
          className='mt-2 flex items-start gap-1'>
          <IoIosInformationCircle size="15" className='mt-1' />
          {t("detailedDescription")}
        </Typography>
      </div>
      
      {/* REVIEW BUTTON */}
      <button
        onClick={handleSubmitClick}
        className={globalStyles.button.md_block}
        type='button'>
        {t("Review")}
      </button>
    </div>
  )
}

export default DetailsStep
