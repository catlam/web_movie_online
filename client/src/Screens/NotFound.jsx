import React from 'react'
import { BiHomeAlt } from 'react-icons/bi'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="flex-colo w-full min-h-screen text-white bg-main lg:py-10 px-6">
       <h1 className="text-5xl">PAGE NOT FOUND</h1> 
       <p className="font-medium italic py-3 text-border leading-6">
        The page you are looking for does not exist. You may have
          mistyped the URL
       </p>
       <Link 
          to="/"
          className="bg-subMain transition text-white flex-rows gap-4 font-medium py-3 px-6 hover:text-main rounded-md"
        >
          <BiHomeAlt/> Back Home
       </Link>
    </div>
  )
}

export default NotFound