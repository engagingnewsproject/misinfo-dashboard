import React from 'react';
import { List, ListItem, Input, Typography } from '@material-tailwind/react';
import { IoIosInformationCircle } from "react-icons/io";
import { useTranslation } from 'next-i18next'; // Import the useTranslation hook

const SourceSelector = ({ sources, selectedSource, handleSourceChange, showOtherSource, handleOtherSourceChange, otherSource }) => {
    const { t } = useTranslation('NewReport'); // Use the useTranslation hook
    return (
        <>
            {sources.map((source, i) => (
                <ListItem
                    id='source'
                    key={i}
                    selected={source === selectedSource}
                    value={source}
                    onClick={() => handleSourceChange(source)}>
                    {t(`sources.${source}`)} {/* Translate each source name */}
                </ListItem>
            ))}
            {showOtherSource && (
                <div className='w-full'>
                    <Input
                        type='text'
                        label={t("custom_source")}
                        value={otherSource}
                        onChange={handleOtherSourceChange}
                    />
                    <Typography
                        variant='small'
                        color='gray'
                        className='mt-2 flex items-start gap-1 font-normal'>
                        <IoIosInformationCircle size="15" className='mt-1' />
                        {t("specify_custom_source")} {/* Updated translation key for clarity */}
                    </Typography>
                </div>
            )}
        </>
    );
}

export default SourceSelector;
