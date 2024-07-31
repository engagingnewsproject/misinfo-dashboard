// AgencySelector.jsx
import React from 'react';
import { List, ListItem, Card, Typography } from "@material-tailwind/react";
import { useTranslation } from 'next-i18next'; // Import the hook

const AgencySelector = ({
  agencies,
  selectedAgency,
  handleAgencyChange,
  showForwardArrow
}) => {
	const { t } = useTranslation("NewReport") // Use the translation hook
	
  return (
    <Card>
      <Typography variant='h5' className="text-center mb-4">{t("which_agency")}</Typography>
      <List>
        {agencies.length === 0 && <Typography>{t("noAgencies")}</Typography>}
        {agencies.map((agency, index) => (
          <ListItem
            key={index}
            selected={agency === selectedAgency}
            onClick={() => {
              handleAgencyChange(agency);
              showForwardArrow(true);
            }}
            className={`cursor-pointer ${agency === selectedAgency ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
          >
            {agency}
          </ListItem>
        ))}
      </List>
    </Card>
  );
};

export default AgencySelector;
