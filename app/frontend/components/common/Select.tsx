import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Add missing ChevronDownIcon import
import { ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from './IconComponents';

interface SelectProps<T> {
    items: T[];
    selectedItem: T | null;
    onSelectItem: (item: T | null) => void;
    getLabel: (item: T) => string;
    placeholder: string;
    disabled?: boolean;
}

const Select = <T extends {}>({ items, selectedItem, onSelectItem, getLabel, placeholder, disabled = false }: SelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectRef = useRef<HTMLDivElement>(null);

    const filteredItems = items.filter(item =>
        getLabel(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const searchPlaceholder = `Search for a ${placeholder.replace(/^Select\s*/i, '')}...`;

    return (
        <div className={`relative w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={selectRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={disabled}
            >
                <span className={`truncate ${selectedItem ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {selectedItem ? getLabel(selectedItem) : placeholder}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                    >
                        <div className="p-2">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <ul className="max-h-60 overflow-y-auto dark-scrollbar py-1">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, index) => (
                                    <li
                                        key={index}
                                        onClick={() => {
                                            onSelectItem(item);
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-900/50 cursor-pointer"
                                    >
                                        <span className="truncate">{getLabel(item)}</span>
                                        {selectedItem && getLabel(item) === getLabel(selectedItem) && (
                                            <CheckIcon className="w-4 h-4 text-green-600" />
                                        )}
                                    </li>
                                ))
                            ) : (
                                <li className="px-3 py-2 text-sm text-gray-500 text-center">No results found</li>
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Select;