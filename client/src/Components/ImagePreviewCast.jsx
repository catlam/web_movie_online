

export const ImagepreviewCast = ({ image, name }) => {
    return (
        <div className="w-32 mt-2 h-32 p-2 rounded">
            <img 
                src={image ? image : "/images/user.png"} 
                alt={name}
                className="w-full object-cover rounded" 
            />
        </div>
    )
}