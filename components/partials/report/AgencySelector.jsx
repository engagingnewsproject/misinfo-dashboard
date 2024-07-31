// AgencySelector.jsx
import React from 'react';
import { List, ListItem, Card, Typography } from "@material-tailwind/react";
import { useTranslation } from 'next-i18next'; // Import the hook

const AgencySelector = ({
  agencies,
  selectedAgency,
  onAgencyChange,
  showForwardArrow
}) => {
	const { t } = useTranslation("NewReport") // Use the translation hook
	
	return (
		<>
			<Typography variant="h5" className="text-center mb-4">
				{t('which_agency')}
			</Typography>
			<Card>
				<List>
					{agencies.length === 0 && <Typography>{t('noAgencies')}</Typography>}
					{agencies.map((agency, index) => (
						<ListItem
							key={index}
							selected={agency === selectedAgency}
							onClick={() => {
								onAgencyChange(agency)
								showForwardArrow(true)
							}}
							className={`cursor-pointer ${agency === selectedAgency ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
							{agency}
						</ListItem>
					))}
				</List>
			</Card>
		</>
	)
};

export default AgencySelector;
