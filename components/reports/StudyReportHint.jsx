/**
 * One line above the Report button on study sites, telling the participant
 * what to click. Hidden on the live sites.
 */
import React from 'react'
import { useTranslation } from 'next-i18next'
import { brand } from '../../config/brand'

const StudyReportHint = () => {
	const { t } = useTranslation('Home')
	if (!brand.isStudyCopy) return null

	return (
		<p
			data-component="StudyReportHint"
			className="mb-3 text-sm font-normal leading-relaxed text-[#2E3B4E]">
			{t('studyReportHint')}
		</p>
	)
}

export default StudyReportHint
