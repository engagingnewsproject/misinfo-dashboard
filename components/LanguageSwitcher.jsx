import React from "react";
import Switch from "react-switch"
import { useTranslation } from 'next-i18next';
import { useRouter } from "next/router";


const LanguageSwitcher = () => {
  const router = useRouter()
  const { i18n } = useTranslation();

  const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
  ];

  const handleLanguageChange = (e) => {
    console.log(e.checked)
    if (e) {
        const path = router.asPath
  
        router.push(path, path,  { locale: 'es' } )
      
    } else {
      const path = router.asPath
  
      router.push(path, path,  { locale: 'en' } )
     }
  };

  const active = "text-blue-600 font-bold text-sm"
  const nonactive = "text-gray-600 text-sm"


  return (
      <div className="flex items-center gap-1">
        <span className={router.locale== "en" ? active :nonactive }>English</span>
        <Switch value={router.locale== "en" ? false : true} 					
        checked={router.locale == "en" ? false : true}
        onChange={handleLanguageChange} 
        checkedIcon	={false} uncheckedIcon = {true}
        onColor="#2563eb"/>
        <span className={router.locale == "es" ? active : nonactive }>Español</span>
      </div>

  )
}
export default LanguageSwitcher;