import React from 'react';
import { Input, Typography } from '@material-tailwind/react';
import { IoIosInformationCircle } from "react-icons/io";
import { useTranslation } from 'next-i18next';
import globalStyles from '../../../styles/globalStyles';

const ImageUploader = ({ handleImageChange, imgPicker, imageDescription }) => {
  const { t } = useTranslation('NewReport');

  return (
    <div className='block'>
      <Input
        variant='static'
        id='multiple_files'
        multiple
        className={globalStyles.inputImage} // Use the global style for the input
        accept='image/*'
        onChange={handleImageChange}
        ref={imgPicker}
        type='file'
        label={t("image")}
      />
      <Typography
        variant='small'
        color='gray'
        className='mt-2 flex items-start gap-1'>
        <IoIosInformationCircle size="15" className='mt-1' />
        {t(imageDescription)}
      </Typography>
    </div>
  );
};

export default ImageUploader;
