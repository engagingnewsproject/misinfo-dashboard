// styles/globalStyles.js
const globalStyles = {
  dateOptions: {
    day: "2-digit",
    year: "numeric",
    month: "short",
    hour: "numeric",
    minute: "numeric",
  },
  tableHeading: {
    default: "px-3 py-1 text-sm font-semibold text-left tracking-wide",
    default_center: "text-center p-2 text-sm font-semibold tracking-wide",
    small: "",
  },
  column: {
    data: "whitespace-normal text-sm px-3 py-1 cursor-pointer",
    data_center:
      "whitespace-normal md:whitespace-nowrap text-sm px-3 py-1 cursor-pointer text-center",
  },
  label: {
    default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
    special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl",
  },
  icon: {
    hover: "hover:fill-cyan-700",
  },
  headerStyle: "text-lg font-bold text-black tracking-wider mb-4",
  linkStyle: "font-light mb-1 text-sm underline underline-offset-1",
  button: {
    sm: "select-none rounded-lg bg-blue-500 py-2 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    md: "select-none rounded-lg bg-blue-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    md_block: "select-none rounded-lg bg-blue-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none block w-full",
  },
  page: {
    wrap: "w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto"
  },
  heading: {
    h1: "text-2xl font-extrabold text-blue-600 tracking-wider",
    h2: "text-xl font-extrabold text-blue-600 tracking-wider"
  }
};

export default globalStyles;
