/**
 * @fileoverview ReviewStep - Step 6 of the report creation process
 * 
 * This component handles the review step where users can see a summary
 * of their report before submission.
 * 
 * @module components/reports/ReportSteps/ReviewStep
 * @requires react
 * @requires @material-tailwind/react
 * @requires next-i18next
 */

import React from 'react'
import { Typography, Button } from '@material-tailwind/react'
import { useTranslation } from 'next-i18next'
import globalStyles from '../../../styles/globalStyles'

/**
 * ReviewStep Component
 * 
 * Renders the review step of the report creation process.
 * Displays a summary of the report data for user review.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.reportData - Complete report data object
 * @param {Function} props.onSubmit - Function to submit the report
 * @param {Function} props.onBack - Function to go back to previous step
 * @returns {JSX.Element} The review step component
 */
const ReviewStep = ({
  reportData,
  onSubmit,
  onBack
}) => {
  const { t } = useTranslation('NewReport')

  // Helper function to render links safely
  const renderLinks = () => {
    if (reportData.link && reportData.secondLink) {
      return (
        <>
          <Typography>{reportData.link}</Typography>
          <Typography>{reportData.secondLink}</Typography>
        </>
      )
    } else if (reportData.link) {
      return <Typography>{reportData.link}</Typography>
    } else if (reportData.secondLink) {
      return <Typography>{reportData.secondLink}</Typography>
    } else {
      return <Typography>{t("noLinks")}</Typography>
    }
  }

  // Helper function to render images
  const renderImages = () => {
    if (reportData.images && reportData.images.length > 0) {
      return (
        <div className="flex max-w-full min-w-0 flex-wrap gap-2">
          {reportData.images.map((image, index) => (
            <a
              key={`${image}-${index}`}
              href={image}
              target="_blank"
              rel="noreferrer"
              className="shrink-0">
              {/* Plain img: next/image optimizer can 401 Firebase Storage URLs */}
              <img
                src={image}
                alt={`Uploaded image ${index + 1}`}
                className="h-[100px] w-[100px] rounded object-cover"
              />
            </a>
          ))}
        </div>
      )
    } else {
      return <Typography>{t("noImages")}</Typography>
    }
  }

  return (
    <div className={`review-step ${globalStyles.form.viewWrapper}`}>
      <Typography variant='h5'>{t("review")}</Typography>
      <div className="py-6">
        <div className="space-y-4">
          {/* Agency */}
          <div>
            <Typography variant="h6" color="blue">{t("agency")}</Typography>
            <Typography>{reportData.selectedAgency}</Typography>
          </div>
          
          {/* Topic */}
          <div>
            <Typography variant="h6" color="blue">{t("topic")}</Typography>
            <Typography>{reportData.selectedTopic}</Typography>
          </div>
          
          {/* Source */}
          <div>
            <Typography variant="h6" color="blue">{t("source_title")}</Typography>
            <Typography>{reportData.selectedSource}</Typography>
          </div>
          
          {/* Title */}
          <div>
            <Typography variant="h6" color="blue">{t("title_text")}</Typography>
            <Typography>{reportData.title}</Typography>
          </div>
          
          {/* Links */}
          <div>
            <Typography variant="h6" color="blue">{t("links")}</Typography>
            <div className="space-y-1">
              {renderLinks()}
            </div>
          </div>
          
          {/* Images */}
          <div>
            <Typography variant="h6" color="blue">{t("image_text")}</Typography>
            {renderImages()}
          </div>
          
          {/* Description */}
          <div>
            <Typography variant="h6" color="blue">{t("detailed")}</Typography>
            <Typography>
              {reportData.detail || t("noDescription")}
            </Typography>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button color="blue" className="w-full" onClick={onSubmit}>
            {t("submit")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReviewStep
