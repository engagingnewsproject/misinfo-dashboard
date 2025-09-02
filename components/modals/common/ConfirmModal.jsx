/**
 * @fileoverview ConfirmModal - Confirmation Dialog Component
 * 
 * This component provides a reusable confirmation dialog that can be used
 * throughout the application for actions that require user confirmation,
 * such as deletions, logouts, or data resets. It supports different
 * action types with appropriate icons and styling.
 * 
 * @module components/modals/ConfirmModal
 * @requires react
 * @requires react-icons/ri
 * @requires react-icons/bi
 * @requires react-icons/io
 * @requires @material-tailwind/react
 */

import React, { useState } from 'react'
import { RiDeleteBin2Fill } from 'react-icons/ri'
import { BiLogOut } from 'react-icons/bi'
import { IoMdRefresh } from "react-icons/io"
import { Button } from '@material-tailwind/react'

/**
 * ConfirmModal - A reusable confirmation dialog component.
 * 
 * This modal displays a confirmation dialog with customizable title, subtitle,
 * and call-to-action text. It supports different action types (Delete, Log out,
 * Reset Report) with appropriate icons. The modal includes both confirm and
 * cancel buttons, with the confirm action being triggered on form submission.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.func - Function to execute when user confirms the action
 * @param {string} props.title - Main title text displayed in the modal
 * @param {string} props.subtitle - Subtitle text providing additional context
 * @param {string} props.CTA - Call-to-action text for the confirm button (also determines icon)
 * @param {Function} props.closeModal - Function to close the modal
 * @returns {JSX.Element} Modal dialog with confirmation interface
 * @example
 * <ConfirmModal
 *   func={handleDelete}
 *   title="Delete Report"
 *   subtitle="This action cannot be undone."
 *   CTA="Delete"
 *   closeModal={setShowModal}
 * />
 */
const ConfirmModal = ({ func, title, subtitle, CTA, closeModal }) => {
    /**
     * Handles form submission when user confirms the action.
     * 
     * @param {Event} e - Form submission event
     */
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent the default form submission behavior
        func(e); // Call the provided function on form submission
    };

    /**
     * Handles cancellation when user clicks cancel or outside the modal.
     * 
     * @param {Event} e - Click event
     */
    const handleCancel = (e) => {
        e.stopPropagation(); // Prevent event propagation
        closeModal(false); // Close the modal
    };

    /**
     * Renders the appropriate icon based on the CTA type.
     * 
     * @returns {JSX.Element} Icon component for the current action type
     */
    const renderIcon = () => {
        switch (CTA) {
            case "Delete":
                return <RiDeleteBin2Fill className="text-blue-500" size={30}/>;
            case "Log out":
                return <BiLogOut className="text-blue-500" size={30}/>;
            case "Reset Report":
                return <IoMdRefresh className="text-blue-500" size={30}/>;
            default:
                return null;
        }
    };

    return (
        <div>
            {/* Backdrop overlay */}
            <div className="flex justify-center items-center z-[9998] fixed top-0 left-0 w-full h-screen bg-black opacity-60">
            </div>
            
            {/* Modal container */}
            <div 
                className="flex justify-center items-center z-[9999] fixed top-0 left-0 w-full h-screen"
                onClick={() => closeModal(false)}>
                
                {/* Modal content */}
                <div 
                    className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
                    onClick={(e) => {
                        e.stopPropagation()
                    }}>
                    
                    {/* Modal header with icon and text */}
                    <div className="grid justify-items-center mb-4">
                        {renderIcon()}
                        <div className="flex-col mt-3 mb-2 text-center tracking-wide">
                            <div className="text-lg text-blue-500 font-bold my-2">{title}</div>
                            <div className="text-xs font-light">{subtitle}</div>
                        </div>
                    </div>
                    
                    {/* Form with action buttons */}
                    <form onSubmit={handleSubmit}>
                        <div className="mt-6 flex justify-between">
                            {/* Cancel button */}
                            <Button
                                type='button'
                                onClick={handleCancel}
                                color='red'
                            >
                                Cancel
                            </Button>
                            
                            {/* Confirm button */}
                            <Button
                                type="submit" 
                                autoFocus
                            >
                                {CTA}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal