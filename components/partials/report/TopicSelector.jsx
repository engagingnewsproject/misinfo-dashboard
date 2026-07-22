import React, { useMemo } from 'react'
import { ListItem, Typography } from '@material-tailwind/react'
import FormInput from '../../ui/FormInput'
import { IoIosInformationCircle } from 'react-icons/io'
import { useTranslation } from 'next-i18next'
import {
	dedupeTagList,
	getTagLabel,
	isOtherTagName,
} from '../../../utils/tag-defaults'

const TopicSelector = ({
	topics,
	selectedTopic,
	handleTopicChange,
	showOtherTopic,
	handleOtherTopicChange,
	otherTopic,
	labelMap,
}) => {
	const { t, i18n } = useTranslation('NewReport')
	const list = useMemo(() => dedupeTagList(topics || []), [topics])

	return (
		<div data-component="TopicSelector" className="contents">
			{list.map((topic) => (
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
						locale: i18n.language,
						labelMap,
						t,
						system: 'topics',
					})}
				</ListItem>
			))}
			{showOtherTopic && (
				<div className="w-full">
					<FormInput
						type="text"
						label={t('custom_topic')}
						value={otherTopic}
						onChange={handleOtherTopicChange}
					/>
					<Typography
						variant="small"
						color="gray"
						className="mt-2 flex items-start gap-1 font-normal">
						<IoIosInformationCircle size="15" className="mt-1" />
						{t('specify_topic')}
					</Typography>
				</div>
			)}
		</div>
	)
}

export default TopicSelector
