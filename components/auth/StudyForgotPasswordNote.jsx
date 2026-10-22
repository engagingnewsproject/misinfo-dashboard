/**
 * Shown on study sites instead of the Forgot Password link. Prolific inboxes
 * do not receive Google's reset email, so participants message the researcher.
 */
import React from 'react'
import { useTranslation } from 'next-i18next'
import { brand } from '../../config/brand'

const StudyForgotPasswordNote = () => {
	const { t } = useTranslation('Welcome')
	if (!brand.isStudyCopy) return null

	return (
		<p
			data-component="StudyForgotPasswordNote"
			className="mt-4 text-sm font-normal leading-relaxed text-[#2E3B4E]">
			{t('forgotStudyNote')}
		</p>
	)
}

export default StudyForgotPasswordNote
