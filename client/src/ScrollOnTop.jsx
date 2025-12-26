import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollOnTop(props) {
    const location = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location])
    return <>{props.children}</>
  
}

export default ScrollOnTop