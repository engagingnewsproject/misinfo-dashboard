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

const SourceSelector = ({
	sources,
	selectedSource,
	handleSourceChange,
	showOtherSource,
	handleOtherSourceChange,
	otherSource,
	labelMap,
}) => {
	const { t, i18n } = useTranslation('NewReport')
	const list = useMemo(() => dedupeTagList(sources || []), [sources])

	return (
		<>
			{list.map((source) => (
				<ListItem
					id="source"
					key={source}
					selected={
						source === selectedSource ||
						(isOtherTagName(selectedSource) && isOtherTagName(source))
					}
					value={source}
					onClick={() => handleSourceChange(source)}>
					{getTagLabel({
						id: source,
						locale: i18n.language,
						labelMap,
						t,
						system: 'sources',
					})}
				</ListItem>
			))}
			{showOtherSource && (
				<div className="w-full">
					<FormInput
						type="text"
						label={t('custom_source')}
						value={otherSource}
						onChange={handleOtherSourceChange}
					/>
					<Typography
						variant="small"
						color="gray"
						className="mt-2 flex items-start gap-1 font-normal">
						<IoIosInformationCircle size="15" className="mt-1" />
						{t('source')}
					</Typography>
				</div>
			)}
		</>
	)
}

export default SourceSelector
