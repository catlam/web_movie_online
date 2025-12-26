import React, { Fragment } from 'react';
import { Listbox, Transition, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { FaAngleDown, FaCheck } from 'react-icons/fa';
import { LanguageData, YearData } from '../Data/FilterData';

function Filters(props) {
    const {
        categories,
        category,
        setCategory,
        language,
        setLanguage,
        year,
        setYear,
    } = props?.data;

    const Filter = [
        {
            value: category,
            onChange: setCategory,
            items: categories?.length > 0
                ? [{ title: "All Categories" }, ...categories]
                : [{ title: "No category found" }],
        },
        {
            value: language,
            onChange: setLanguage,
            items: LanguageData,
        },
        {
            value: year,
            onChange: setYear,
            items: YearData,
        },
    ];

    return (
        <div className="my-6 bg-dry border text-dryGray border-gray-800 grid md:grid-cols-3 grid-cols-2 lg:gap-12 gap-2 rounded p-6">
            {Filter.map((item, index) => (
                <Listbox key={index} value={item.value} onChange={item.onChange}>
                    <div className="relative">
                        <ListboxButton className="relative border border-gray-800 w-full text-white bg-main rounded-lg cursor-default py-4 pl-6 pr-10 text-left text-sx">
                            <span className="block truncate">{item.value.title}</span>
                            <span className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-2">
                                <FaAngleDown className="h-5 w-5" aria-hidden="true" />
                            </span>
                        </ListboxButton>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveTo="opacity-0">
                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full bg-white border-gray-800 text-dryGray rounded-md shadow-lg max-h-60 py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {item.items.map((iterm, i) => (
                                    <ListboxOption
                                        key={i}
                                        className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-subMain text-white" : "text-main"}`}
                                        value={iterm}
                                    >
                                        {({ selected }) => (
                                            <>
                                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                    {iterm.title}
                                                </span>
                                                {selected ? (
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <FaCheck className="h-3 w-3" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </ListboxOption>
                                ))}
                            </ListboxOptions>
                        </Transition>
                    </div>
                </Listbox>
            ))}
        </div>
    );
}

export default Filters;