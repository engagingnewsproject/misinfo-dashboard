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
import { Typography, Input, Textarea } from '@material-tailwind/react'
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
  imgPicker,
  handleSubmitClick,
  selectedImages = []
}) => {
  const { t } = useTranslation('NewReport')

  // State for image preview
  const [imagePreview, setImagePreview] = React.useState([])

  // Restore image previews when selectedImages prop changes (e.g., when going back)
  React.useEffect(() => {
    if (selectedImages && selectedImages.length > 0) {
      const previews = selectedImages.map(file => URL.createObjectURL(file))
      setImagePreview(previews)
    } else {
      setImagePreview([])
    }
  }, [selectedImages])

  // Handle image selection with preview
  const handleImageSelection = (e) => {
    const files = Array.from(e.target.files)
    setImagePreview(files.map(file => URL.createObjectURL(file)))
    handleImageChange(e)
  }

  // Clean up preview URLs on unmount
  React.useEffect(() => {
    return () => {
      imagePreview.forEach(url => URL.revokeObjectURL(url))
    }
  }, [imagePreview])

  return (
    <div className='flex flex-col gap-6 mb-1'>
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
        <Input
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
        <Input
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
              <Input
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
        <Input
          variant='static'
          id='multiple_files'
          multiple
          className={globalStyles.inputImage}
          accept='image/*'
          onChange={handleImageSelection}
          ref={imgPicker}
          type='file'
          label={t("image")}
        />
        <Typography
          variant='small'
          color='gray'
          className='mt-2 flex items-start gap-1'>
          <IoIosInformationCircle size="12" className='mt-1' />
          {t("imageDescription")}
        </Typography>
        
        {/* Image Preview */}
        {imagePreview.length > 0 && (
          <div className="mt-4">
            <Typography variant="small" color="gray" className="mb-2">
              Selected Images ({imagePreview.length}):
            </Typography>
            <div className="flex gap-2 overflow-x-auto">
              {imagePreview.map((url, index) => (
                <div key={index} className="flex-shrink-0">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* DESCRIBE IN DETAIL */}
      <div className='block'>
        <Textarea
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
