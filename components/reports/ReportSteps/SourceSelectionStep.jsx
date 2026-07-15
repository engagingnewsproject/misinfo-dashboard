/**
 * @fileoverview SourceSelectionStep - Step 4 of the report creation process
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
 * @param {string[]} props.sources
 * @param {string} props.selectedSource
 * @param {Function} props.handleSourceChange
 * @param {boolean} props.showOtherSource
 * @param {string} props.otherSource
 * @param {Function} props.handleOtherSourceChange
 * @param {Object} props.errors
 * @param {Function} props.onNext
 * @param {Record<string, { en: string, es: string }>|undefined} props.labelMap
 */
const SourceSelectionStep = ({
	sources,
	selectedSource,
	handleSourceChange,
	showOtherSource,
	otherSource,
	handleOtherSourceChange,
	errors,
	onNext,
	labelMap,
}) => {
	const { t, i18n } = useTranslation('NewReport')
	const locale = i18n.language || 'en'

	const sourceList = useMemo(() => dedupeTagList(sources || []), [sources])

	return (
		<div className={globalStyles.form.viewWrapper}>
			<Typography variant="h5">{t('where')}</Typography>
			<Card>
				<List>
					{sourceList.map((source) => (
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
								locale,
								labelMap,
								t,
								system: 'sources',
							})}
						</ListItem>
					))}
				</List>
			</Card>
			{errors.source && selectedSource === '' && (
				<span className="text-red-500">{errors.source}</span>
			)}
			{showOtherSource && (
				<div className="w-full">
					<FormInput
						label={t('custom_source')}
						value={otherSource}
						onChange={handleOtherSourceChange}
						maxLength={CUSTOM_OTHER_TAG_MAX_LENGTH}
					/>
					<Typography
						variant="small"
						color="gray"
						className={globalStyles.mdInput.hint}>
						<IoIosInformationCircle />
						{t('specify_source', { max: CUSTOM_OTHER_TAG_MAX_LENGTH })}
					</Typography>
				</div>
			)}
			{selectedSource !== '' && (
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

export default SourceSelectionStep
