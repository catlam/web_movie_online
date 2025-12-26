import axios from 'axios';

const API_KEY = 'ad3aeef270a7e3bfa6fc65c8ebde574d';  // Thay YOUR_API_KEY bằng API key của bạn từ TMDb
const BASE_URL = 'https://api.themoviedb.org/3';

export const getMovies = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/movie/popular`, {
            params: {
                api_key: API_KEY,
            },
        });
        return response.data.results;  // Trả về danh sách phim từ API
    } catch (error) {
        console.error('Error fetching data from TMDb:', error);
        return [];
    }
};

export const getMovieDetails = async (movieId) => {
    try {
        const response = await axios.get(`${BASE_URL}/movie/popular/${movieId}`, {
            params: {
                api_key: API_KEY,
            },
        });
        return response.data; // Trả về thông tin chi tiết của bộ phim
    } catch (error) {
        console.error('Error fetching movie details from TMDb:', error);
        return null;
    }
};
