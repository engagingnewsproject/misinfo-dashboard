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
  p: {
    default: "block mt-1 font-sans text-base antialiased font-normal leading-relaxed text-gray-700"
  },
  form: {
    wrap: "relative flex justify-center text-gray-700 bg-white shadow-none rounded-xl bg-clip-border",
    element: "max-w-screen-lg mt-8 mb-2 w-96",
    viewWrapper: "flex flex-col justify-center gap-2 mt-4 px-5",
    input_title: "block -mb-3 font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-blue-600",
    input_wrap: "relative h-11 w-full min-w-[200px]"
  },
  input: {
    wrap: 'relative w-full min-w-[200px] h-10',
    input: "peer w-full h-full bg-sky-50 text-blue-gray-700 font-sans font-normal outline outline-0 focus:outline-transparent border-t-transparent focus:shadow-none disabled:bg-blue-gray-50 disabled:border-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 border focus:border-2 focus:border-t-transparent text-sm px-3 py-2.5 rounded-[7px] border-blue-gray-200 focus:border-gray-900",
    label: "flex w-full h-full select-none pointer-events-none absolute left-0 font-normal !overflow-visible truncate peer-placeholder-shown:text-blue-gray-500 leading-tight peer-focus:leading-tight peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500 transition-all -top-1.5 peer-placeholder-shown:text-sm text-[11px] peer-focus:text-[11px] before:content[' '] before:block before:box-border before:w-2.5 before:h-1.5 before:mt-[6.5px] before:mr-1 peer-placeholder-shown:before:border-transparent before:rounded-tl-md before:border-t peer-focus:before:border-t-2 before:border-l peer-focus:before:border-l-2 before:pointer-events-none before:transition-all peer-disabled:before:border-transparent after:content[' '] after:block after:flex-grow after:box-border after:w-2.5 after:h-1.5 after:mt-[6.5px] after:ml-1 peer-placeholder-shown:after:border-transparent after:rounded-tr-md after:border-t peer-focus:after:border-t-2 after:border-r peer-focus:after:border-r-2 after:pointer-events-none after:transition-all peer-disabled:after:border-transparent peer-placeholder-shown:leading-[3.75] text-gray-500 peer-focus:text-gray-900 before:border-blue-gray-200 peer-focus:before:!border-gray-900 after:border-blue-gray-200 peer-focus:after:!border-gray-900",
    hint: "flex items-center gap-1 mt-2 font-sans text-sm antialiased font-normal leading-normal text-gray-700",
    radio: "bg-blue-600 hover:bg-blue-500 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500",
    radio_checked: "bg-blue-800 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500",
  },
  textarea: {
    el: "peer h-full min-h-[100px] w-full resize-none rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:resize-none disabled:border-0 disabled:bg-blue-gray-50",
    label: "before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500",
    hint: "flex gap-1 mt-1 font-sans text-sm antialiased font-normal leading-relaxed text-gray-700",
  },
  button: {
    sm: "select-none rounded-lg bg-blue-600 py-2 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    md: "select-none rounded-lg bg-blue-600 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    md_selected: "select-none rounded-lg bg-blue-800 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    md_block: "select-none rounded-lg bg-blue-600 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none block w-full",
  },
  headerStyle: "text-lg font-bold text-black tracking-wider mb-4",
  linkStyle: "font-light mb-1 text-sm underline underline-offset-1",
  wrap: "relative align-middle select-none font-sans font-medium text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-8 max-w-[32px] h-8 max-h-[32px] rounded-lg text-xs bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none",
  icon: {
    filled: "fill-blue-600 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2",
    hover: "hover:fill-cyan-700",
  },
  page: {
    wrap: "w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto"
  },
  heading: {
    h1: {
      blue: "text-2xl font-extrabold text-blue-600 tracking-wider",
      black: "text-2xl font-extrabold text-black-600 tracking-wider",
    },
    h2: "text-md font-semibold text-blue-600"
  }
};

export default globalStyles;
