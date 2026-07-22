/**
 * @fileoverview TopicSelectionStep - Step 3 of the report creation process
 */

import React, { useMemo } from 'react'
import { Typography, Card, List, ListItem } from '@material-tailwind/react'
import FormInput from '../../ui/FormInput'
import { IoIosInformationCircle } from 'react-icons/io'
import { useTranslation } from 'next-i18next'
import globalStyles from '../../../styles/globalStyles'
import { CUSTOM_OTHER_TAG_MAX_LENGTH } from '../../../config/tagSystems'
import {
	dedupeTagList,
	getTagLabel,
	isOtherTagName,
} from '../../../utils/tag-defaults'

/**
 * @param {Object} props
 * @param {string[]} props.allTopicsArr
 * @param {string} props.selectedTopic
 * @param {Function} props.handleTopicChange
 * @param {boolean} props.showOtherTopic
 * @param {string} props.otherTopic
 * @param {Function} props.handleOtherTopicChange
 * @param {Object} props.errors
 * @param {Function} props.onNext
 * @param {Record<string, { en: string, es: string }>|undefined} props.labelMap
 */
const TopicSelectionStep = ({
	allTopicsArr,
	selectedTopic,
	handleTopicChange,
	showOtherTopic,
	otherTopic,
	handleOtherTopicChange,
	errors,
	onNext,
	labelMap,
}) => {
	const { t, i18n } = useTranslation('NewReport')
	const locale = i18n.language || 'en'

	const topics = useMemo(() => dedupeTagList(allTopicsArr || []), [allTopicsArr])

	return (
		<div data-component="TopicSelectionStep" className={globalStyles.form.viewWrapper}>
			<Typography variant="h5">{t('about')}</Typography>
			<Card>
				<List>
					{topics.map((topic) => (
						<ListItem
							id="topic"
							key={topic}
							selected={
								topic === selectedTopic ||
								(isOtherTagName(selectedTopic) && isOtherTagName(topic))
							}
							value={topic}
							onClick={() => handleTopicChange(topic)}>
							{getTagLabel({
								id: topic,
								locale,
								labelMap,
								t,
								system: 'topics',
							})}
						</ListItem>
					))}
				</List>
			</Card>
			{errors.topic && selectedTopic === '' && (
				<span className="text-red-500">{errors.topic}</span>
			)}
			{showOtherTopic && (
				<div className="w-full">
					<FormInput
						label={t('custom_topic')}
						value={otherTopic}
						onChange={handleOtherTopicChange}
						maxLength={CUSTOM_OTHER_TAG_MAX_LENGTH}
					/>
					<Typography
						variant="small"
						color="gray"
						className={globalStyles.mdInput.hint}>
						<IoIosInformationCircle />
						{t('specify_topic', { max: CUSTOM_OTHER_TAG_MAX_LENGTH })}
					</Typography>
				</div>
			)}
			{selectedTopic !== '' && (
				<div className="absolute bottom-4 right-4 sm:right-6">
					<button
						onClick={onNext}
						className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2">
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							/>
						</svg>
					</button>
				</div>
			)}
		</div>
	)
}

export default TopicSelectionStep
