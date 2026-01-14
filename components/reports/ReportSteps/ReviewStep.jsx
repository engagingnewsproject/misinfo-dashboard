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
import { Typography, Card, Button } from '@material-tailwind/react'
import { useTranslation } from 'next-i18next'
import globalStyles from '../../../styles/globalStyles'
import Image from 'next/image'
import Link from 'next/link'

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
      return <Typography>No links provided</Typography>
    }
  }

  // Helper function to render images
  const renderImages = () => {
    if (reportData.images && reportData.images.length > 0) {
      return (
        <div className="flex w-full overflow-y-auto gap-2">
          {reportData.images.map((image, index) => (
            <div key={index} className="flex-shrink-0">
              <Link href={image} target="_blank">
                <Image
                  src={image}
                  width={100}
                  height={100}
                  alt={`Uploaded image ${index + 1}`}
                  className="object-cover rounded"
                />
              </Link>
            </div>
          ))}
        </div>
      )
    } else {
      return <Typography>No images uploaded</Typography>
    }
  }

  return (
    <div className={globalStyles.form.viewWrapper}>
      <Typography variant='h5'>{t("review")}</Typography>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Agency */}
          <div>
            <Typography variant="h6" color="blue">Agency</Typography>
            <Typography>{reportData.selectedAgency}</Typography>
          </div>
          
          {/* Topic */}
          <div>
            <Typography variant="h6" color="blue">Topic</Typography>
            <Typography>{reportData.selectedTopic}</Typography>
          </div>
          
          {/* Source */}
          <div>
            <Typography variant="h6" color="blue">Source</Typography>
            <Typography>{reportData.selectedSource}</Typography>
          </div>
          
          {/* Title */}
          <div>
            <Typography variant="h6" color="blue">Title</Typography>
            <Typography>{reportData.title}</Typography>
          </div>
          
          {/* Links */}
          <div>
            <Typography variant="h6" color="blue">Links</Typography>
            <div className="space-y-1">
              {renderLinks()}
            </div>
          </div>
          
          {/* Images */}
          <div>
            <Typography variant="h6" color="blue">Images</Typography>
            {renderImages()}
          </div>
          
          {/* Description */}
          <div>
            <Typography variant="h6" color="blue">Description</Typography>
            <Typography>
              {reportData.detail || 'No description provided'}
            </Typography>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button color="gray" onClick={onBack}>
            {t("back")}
          </Button>
          <Button color="blue" onClick={onSubmit}>
            {t("submit")}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ReviewStep
