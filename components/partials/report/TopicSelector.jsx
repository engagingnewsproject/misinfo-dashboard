import React from 'react';
import { List, ListItem, Input, Typography } from '@material-tailwind/react';
import { IoIosInformationCircle } from "react-icons/io";
import { useTranslation } from 'next-i18next'; // Import the useTranslation hook

const TopicSelector = ({ topics, selectedTopic, handleTopicChange, showOtherTopic, handleOtherTopicChange, otherTopic }) => {
  const { t } = useTranslation('NewReport'); // Use the useTranslation hook

  return (
    <>
      {topics.map((topic, index) => (
        <ListItem
          id='topic'
          key={index}
          selected={topic === selectedTopic}
          value={topic}
          onClick={() => handleTopicChange(topic)}>
          {t(`topics.${topic}`, topic)} {/* Translate topic names */}
        </ListItem>
      ))}
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
            className='mt-2 flex items-start gap-1 font-normal'>
            <IoIosInformationCircle size="15" className='mt-1' />
            {t("specify_topic")}
          </Typography>
        </div>
      )}
    </>
  );
}

export default TopicSelector;
