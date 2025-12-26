

export const Imagepreview = ({ image, name }) => {
    return (
        <div className="w-auto mt-2 h-auto p-2 bg-main border border-border rounded">
            <img 
                src={image ? image : "/images/user.png"} 
                alt={name}
                className="w-full object-cover rounded" 
            />
        </div>
    )
}