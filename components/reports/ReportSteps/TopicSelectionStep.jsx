/**
 * @fileoverview TopicSelectionStep - Step 3 of the report creation process
 * 
 * This component handles the topic selection step where users choose what
 * topic their report relates to. Supports both predefined topics and custom
 * topic creation.
 * 
 * @module components/reports/ReportSteps/TopicSelectionStep
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
 * TopicSelectionStep Component
 * 
 * Renders the topic selection step of the report creation process.
 * Displays a list of available topics and allows custom topic creation.
 * 
 * @param {Object} props - Component props
 * @param {Array<string>} props.allTopicsArr - List of all available topics
 * @param {string} props.selectedTopic - Currently selected topic
 * @param {Function} props.handleTopicChange - Function to handle topic selection
 * @param {boolean} props.showOtherTopic - Whether to show custom topic input
 * @param {string} props.otherTopic - Custom topic value
 * @param {Function} props.handleOtherTopicChange - Function to handle custom topic input
 * @param {Object} props.errors - Form validation errors
 * @param {Function} props.onNext - Function to proceed to next step
 * @returns {JSX.Element} The topic selection step component
 */
const TopicSelectionStep = ({
  allTopicsArr,
  selectedTopic,
  handleTopicChange,
  showOtherTopic,
  otherTopic,
  handleOtherTopicChange,
  errors,
  onNext
}) => {
  const { t } = useTranslation('NewReport')
  
  // Default topics for translation
  const defaultTopics = ["Health", "Other", "Politics", "Weather"]

  return (
    <div className={globalStyles.form.viewWrapper}>
      <Typography variant='h5'>{t("about")}</Typography>
      <Card>
        <List>
          {[
            ...allTopicsArr.filter((topic) => topic !== "Other"),
            ...allTopicsArr.filter((topic) => topic === "Other"),
          ].map((topic, i = self.crypto.randomUUID()) => (
            <ListItem
              id='topic'
              key={i}
              selected={topic === selectedTopic}
              value={topic}
              onClick={() => handleTopicChange(topic)}>
              {defaultTopics.includes(topic) ? t("topics." + topic) : topic}
            </ListItem>
          ))}
        </List>
      </Card>
      {errors.topic && selectedTopic === "" && (
        <span className='text-red-500'>{errors.topic}</span>
      )}
      {showOtherTopic && (
        <div className='w-full'>
          <Input
            label={t("custom_topic")}
            value={otherTopic}
            onChange={handleOtherTopicChange}
          />
          <Typography
            variant='small'
            color='gray'
            className={globalStyles.mdInput.hint}>
            <IoIosInformationCircle />
            {t("specify_topic")}
          </Typography>
        </div>
      )}
      {/* FORWARD ARROW */}
      {selectedTopic !== "" && (
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

export default TopicSelectionStep
