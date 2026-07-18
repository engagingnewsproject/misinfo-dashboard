/**
 * Shared Tailwind class names for admin section layouts and data tables.
 * Used by HelpRequests, Agencies, Users, and other admin list views.
 */
const adminSectionStyles = {
	section_container:
		'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto',
	section_wrapper: 'flex flex-col h-full',
	section_header: 'flex justify-between ml-10 md:mx-0 py-5',
	section_title: 'text-xl font-extrabold text-[#2E3B4E] tracking-wider',
	section_filters: '',
	section_filtersWrap: 'p-0 px-4 md:p-4 md:py-0 md:px-4 flex items-center',
	table_main: 'min-w-full bg-white rounded-md p-1',
	table_thead: 'border-b dark:border-indigo-100 bg-slate-100',
	table_th: 'px-3 p-3 text-sm font-semibold text-left tracking-wide',
	table_tr:
		'border-b transition duration-300 ease-in-out hover:bg-indigo-50 dark:border-indigo-100 dark:hover:bg-indigo-100',
	table_td: 'whitespace-normal text-sm px-3 p-2 cursor-pointer',
	table_button: 'hover:fill-cyan-700',
	table_icon: 'ml-4 fill-gray-400 hover:fill-red-600',
	button:
		'flex items-center shadow ml-auto bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline',
}

export default adminSectionStyles
