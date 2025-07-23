/**
 * @fileoverview LanguageSwitcher Component - UI toggle for application language
 *
 * This component provides a simple toggle switch for switching between English and Spanish.
 * Features include:
 * - Integration with next-i18next and Next.js router for locale switching
 * - Visual indication of the active language
 * - Responsive and accessible toggle UI
 *
 * Integrates with:
 * - react-switch for the toggle UI
 * - next-i18next and next/router for locale management
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React from "react";
import Switch from "react-switch"
import { useTranslation } from 'next-i18next';
import { useRouter } from "next/router";


/**
 * LanguageSwitcher Component
 *
 * Renders a toggle switch for switching between English and Spanish locales.
 * Updates the Next.js router to change the application language.
 *
 * @returns {JSX.Element} The rendered language switcher UI
 */
const LanguageSwitcher = () => {
  const router = useRouter()
  const { i18n } = useTranslation();

  const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
  ];

  /**
   * handleLanguageChange - Handles the toggle switch event to change the language.
   * Updates the Next.js router locale.
   * @param {Object} e - The event object from react-switch
   */
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