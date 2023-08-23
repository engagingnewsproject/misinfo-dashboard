// Example React component for dark mode toggle
import React, { useState, useEffect } from 'react';
import { Switch } from "@headlessui/react"

function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

	return (
		<Switch
			// Set checked to the initial banned value (false)
			checked={isDarkMode}
			// When switch toggled setBanned
			// onChange={handleDarkModeChange}
			// On click handler
			onClick={toggleDarkMode}
			className={`${
				isDarkMode ? "bg-slate-100" : "bg-gray-200"
			} relative inline-flex h-6 w-11 items-center rounded-full mr-2`}>
			<span className="sr-only">Dark Mode</span>
			<span
				aria-hidden="true"
				className={`${
					isDarkMode ? "translate-x-6" : "translate-x-1"
				} inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-600 transition`}
			/>
		</Switch>
  );
}

export default DarkModeToggle;