import React, { useEffect, useState } from 'react';
import MainModal from './MainModal';
import { Input } from '../UsedInputs';
import { useDispatch, useSelector } from 'react-redux';
import { createCategoryAction, updateCategoryAction } from '../../Redux/Actions/CategoriesActions';
import toast from 'react-hot-toast';

function CategoryModal({ modalOpen, setModalOpen, category }) {
  const [title, setTitle] = useState("")
  const dispatch = useDispatch()

  const {isLoading, isError, isSuccess} = useSelector(
    (state) => state.categoryCreate);
  const { isLoading:upLoading, isError:upError, isSuccess:upSuccess } = useSelector(
    (state) => state.categoryUpdate);
  // create category handler
  const submitHandler = (e) =>{
    e.preventDefault()
    if(title){
      // if category is not empty
      if(category){
        dispatch(updateCategoryAction(category?._id, {title: title}))
        setModalOpen(!modalOpen)
      }
      else{
        dispatch(createCategoryAction({title: title}));
        setTitle("")
      }
    }
    else{
      toast.error("Please write a category name")
    }
  }

  // useEffect
  useEffect(() => {
    // error
    if (upError || isError){
      toast.error(upError || isError)
      dispatch({
        type: isError ? "CREATE_CATEGORY_RESET" : "UPDATE_CATEGORY_RESET"
      })
    }

    // success
    if (isSuccess || upSuccess) {
      dispatch({
        type: isError ? "CREATE_CATEGORY_RESET" : "UPDATE_CATEGORY_RESET"
      })
    }
    // if category is not null then set title to category title
    if(category){
      setTitle(category?.title)
    }

    // if modal is closed then set title to empty
    if(modalOpen === false){
      setTitle("")
    }

  },[dispatch, isError, isSuccess, upSuccess, upError, category, modalOpen])


  return (
    <MainModal modalOpen={modalOpen} setModalOpen={setModalOpen}>
      <div className="inline-block border border-border w-full align-middle p-10 overflow-y-auto h-full bg-main text-white rounded-2xl text-center">
        <h2 className="text-3xl font-bold">{category ? "Update" : "Create"}</h2>
        <form onSubmit={submitHandler} className="flex flex-col gap-6 text-left mt-6">
          <Input
            label="Category Name"
            placeholder={"Action"}
            type="text"
            bg={false}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            disabled={isLoading || upLoading}
            type="submit"
            className="w-full flex-rows gap-4 py-3 hover:bg-dry text-lg bg-subMain rounded transition border-2 border-subMain text-white"
          >
            {
              isLoading || upLoading 
                ? "Loading..." 
                : category 
                ? "Update" 
                : "Create"
            }
            
          </button>
        </form>
      </div>
    </MainModal>
  );
}

export default CategoryModal;
