export const Message = ({ label, placeholder, name, register }) => {
    return (
        <div className="text-sm w-full">
            <label className="text-border font-semibold">{label}</label>
            <textarea
                className="w-full h-40 mt-2 p-6 bg-main border border-border rounded "
                placeholder={placeholder}
                {...register}
                name={name}
            ></textarea>
        </div>
    );
};

export const Select = ({ label, options = [], name, register, placeholder, ...rest }) => {
    return (
        <div className="text-sm w-full">
            {label && <label className="text-border font-semibold block mb-2">{label}</label>}
            <select
                {...register}
                name={name}
                className="w-full px-6 py-4 text-text bg-main border border-border rounded focus:outline-none transition"
                defaultValue=""
                {...rest}
            >
                {/* Placeholder option */}
                <option value="" disabled>
                    {placeholder || "Choose an option"}
                </option>

                {/* Real options */}
                {options.map((option, index) => (
                    <option key={index} value={option.value ?? option.title}>
                        {option.title}
                    </option>
                ))}
            </select>
        </div>
    );
};

export const Input = ({
    label,
    placeholder,
    type = "text",
    bg = false,
    register,
    name,
    value,
    onChange,
    right = null, 
}) => {
    return (
        <div className="text-sm w-full">
            {label && <label className="text-border font-semibold">{label}</label>}

            <div className="relative mt-2">
                <input
                    name={name}
                    value={value}
                    onChange={onChange}
                    {...register}
                    type={type}
                    placeholder={placeholder}
                    className={`w-full text-sm p-4 ${right ? "pr-12" : ""}
            border border-border rounded text-white
            ${bg ? "bg-main" : "bg-dry"}`}
                />

                {right && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        {right}
                    </div>
                )}
            </div>
        </div>
    );
};