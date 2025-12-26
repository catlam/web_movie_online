import Axios from "./Axios";


// *********** PUBLIC APIs ****************
// get all movies function
export const getAllMoviesServices = async (
  category,
  time,
  language,
  rate,
  year,
  search,
  pageNumber,
  sort = "az",
) => {
  const { data } = await Axios.get(
    `/movies?category=${category}&time=${time}&language=${language}&rate=${rate}&year=${year}&search=${search}&pageNumber=${pageNumber}&sort=${sort}`
  );
  return data;

};

// get random movies function
export const getRandomMoviesService = async (size = 8) => {
  const { data } = await Axios.get('/movies/random/all', { params: { size } });
  return data;
};

// get movie by id function
export const getMovieByIdService = async (id) => {
  const { data } = await Axios.get(`/movies/${id}`);
  return data;
};

//get top rated movies function
export const getTopRatedMovieService = async () => {
  const { data } = await Axios.get(`/movies/rated/top`);
  return data;
}

// review movie function
export const reviewMovieService = async (token, id, review) => {
  const { data } = await Axios.post(`/movies/${id}/reviews`, review, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return data;
};

// delete review movie function
export const deleteReviewMovieService = async (token, movieId) => {
  const { data } = await Axios.delete(`/movies/${movieId}/reviews`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return data;
};

// delete movie function
export const deleteMovieService = async (id, token) => {
  const { data } = await Axios.delete(`/movies/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return data;
};

// delete all movies function
export const deleteAllMoviesService = async (token) => {
  const { data } = await Axios.delete(`/movies`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return data;
};

// create movie function
export const createMovieService = async (token, movie) => {
  const { data } = await Axios.post(`/movies`, movie, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return data;
};

// update movie function
export const updateMovieService = async (token, id, movie) => {
  const { data } = await Axios.put(`/movies/${id}`, movie, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return data;
};
