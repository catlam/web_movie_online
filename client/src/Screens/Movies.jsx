import React, { useEffect, useMemo, useState } from "react";
import Layout from "../Layout/Layout";
import Filters from "../Components/Filters";
import Movie from "../Components/Movie";
import SeriesCard from "../Components/SeriesCard";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { TbPlayerTrackNext, TbPlayerTrackPrev } from "react-icons/tb";
import Loader from "../Components/Notifications/Loader";
import { RiMovie2Line } from "react-icons/ri";
import { getAllMoviesAction } from "../Redux/Actions/MoviesActions";
import { getAllMoviesServices } from "../Redux/APIs/MoviesServices";
import { listSeriesService } from "../Redux/APIs/seriesServices";
import { LanguageData, YearData } from "../Data/FilterData";
import { useParams } from "react-router-dom";

function MoviesPage() {
  const { search } = useParams();
  const dispatch = useDispatch();

  const [category, setCategory] = useState({ title: "All Categories" });
  const [year, setYear] = useState(YearData[0]);
  const [language, setLanguage] = useState(LanguageData[0]);
  const sameClass = "text-white py-2 px-4 rounded font-semibold border-2 border-subMain hover:bg-subMain";

  const { isLoading, isError, movies, pages, page } = useSelector(
    (state) => state.getAllMovies
  );
  const { categories } = useSelector((state) => state.categoryGetAll);

  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState("");
  const [unified, setUnified] = useState([]);
  const [uPage, setUPage] = useState(1);
  const uPageSize = 20;

  const queries = useMemo(() => ({
    category: category?.title === "All Categories" ? "" : category?.title,
    language: language?.title === "Sort By Language" ? "" : language?.title,
    year: year?.title.replace(/\D/g, ""),
    search: search || "",
  }), [category, language, year, search]);

  const hasFilterOrSearch = queries.search || queries.category || queries.language || queries.year;

  useEffect(() => {
    if (hasFilterOrSearch) return;
    if (isError) toast.error(isError);
    dispatch(getAllMoviesAction({
      category: "",
      language: "",
      year: "",
      search: "",
      pageNumber: 1,
      sort: "az",
    }));
    setUnified([]);
    setUPage(1);
  }, [dispatch, isError, hasFilterOrSearch]);

  useEffect(() => {
    if (!hasFilterOrSearch) return;

    const loadUnified = async () => {
      try {
        setULoading(true);
        setUError("");
        setUnified([]);
        setUPage(1);

        const [movieResp, seriesResp] = await Promise.all([
          getAllMoviesServices(
            queries.category, "", queries.language, "", queries.year, queries.search, 1, "az", 100
          ),
          listSeriesService({
            pageNumber: 1,
            limit: 100,
            sort: "az",
            search: queries.search,
            category: queries.category,   
            language: queries.language,   
            year: queries.year || "",     
          }),
        ]);


        const movieList = Array.isArray(movieResp?.movies) ? movieResp.movies : [];
        const seriesList = Array.isArray(seriesResp?.items) ? seriesResp.items : [];

        const uni = [
          ...movieList.map(m => ({ ...m, __kind: "movie" })),
          ...seriesList.map(s => ({ ...s, __kind: "series" })),
        ];

        const filtered = uni.filter(item => {
          const itemCategory = String(item.category || "").toLowerCase();
          const queryCategory = String(queries.category || "").toLowerCase();
          const itemLanguage = String(item.language || "").toLowerCase();
          const queryLanguage = String(queries.language || "").toLowerCase();
          const itemYear = String(item.year || "");
          const queryYear = String(queries.year || "");
          return (
            (!queryCategory || itemCategory === queryCategory) &&
            (!queryLanguage || itemLanguage === queryLanguage) &&
            (!queryYear || itemYear === queryYear)
          );
        });

        filtered.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
        setUnified(filtered);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Unified search failed";
        setUError(msg);
        toast.error(msg);
      } finally {
        setULoading(false);
      }
    };

    loadUnified();
  }, [hasFilterOrSearch, queries]);

  const uPages = Math.max(1, Math.ceil(unified.length / uPageSize));
  const uSlice = unified.slice((uPage - 1) * uPageSize, uPage * uPageSize);

  const nextUPage = () => setUPage(p => Math.min(p + 1, uPages));
  const prevUPage = () => setUPage(p => Math.max(p - 1, 1));

  const datas = {
    categories,
    category,
    setCategory,
    language,
    setLanguage,
    year,
    setYear,
  };

  useEffect(() => {
    console.log("Queries:", queries);
  }, [queries]);

  return (
    <Layout>
      <div className="min-height-screen px-5 sm:px-8 lg:px-16 xl:px-24 2xl:px-32 max-w-screen-2xl mx-auto my-6">
        <Filters data={datas} />
        {hasFilterOrSearch ? (
          <>
            <p className="text-lg font-medium my-6">
              Total{" "}
              <span className="font-bold text-subMain">
                {unified.length}
              </span>{" "}
              items Found {search && `for "${search}"`}
            </p>
            {uLoading ? (
              <div className="w-full gap-6 flex-colo min-h-[30vh]">
                <Loader />
              </div>
            ) : unified.length > 0 ? (
              <>
                <div className="grid sm:mt-6 mt-4 xl:grid-cols-4 2xl:grid-cols-5 lg:grid-cols-3 sm:grid-cols-2 gap-6">
                  {uSlice.map((item, idx) => (
                    <div key={item?._id || `${item.__kind}-${idx}`} className="relative">
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/60 border border-border z-10">
                        {item.__kind === "movie" ? "Movie" : "Series"}
                      </span>
                      {item.__kind === "series" ? (
                        <SeriesCard series={item} />
                      ) : (
                        <Movie movie={item} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="w-full flex-rows gap-6 md:my-12 my-8">
                  <button onClick={prevUPage} disabled={uPage === 1} className={sameClass}>
                    <TbPlayerTrackPrev className="text-xl" />
                  </button>
                  <button onClick={nextUPage} disabled={uPage === uPages} className={sameClass}>
                    <TbPlayerTrackNext className="text-xl" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full gap-6 flex-colo min-h-[30vh]">
                <div className="w-24 h-24 p-5 rounded-full mb-4 bg-dry text-subMain text-4xl flex-colo">
                  <RiMovie2Line />
                </div>
                <p className="text-border text-sm">No results</p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-lg font-medium my-6">
              Total{" "}
              <span className="font-bold text-subMain">
                {movies ? movies?.length : 0}
              </span>{" "}
              items Found
            </p>
            {isLoading ? (
              <div className="w-full gap-6 flex-colo min-h-screen">
                <Loader />
              </div>
            ) : movies?.length > 0 ? (
              <>
                <div className="grid sm:mt-10 mt-6 xl:grid-cols-4 2xl:grid-cols-5 lg:grid-cols-3 sm:grid-cols-2 gap-6">
                  {movies.map((movie, index) => (
                    <Movie key={movie?._id || index} movie={movie} />
                  ))}
                </div>
                <div className="w-full flex-rows gap-6 md:my-20 my-10">
                  <button
                    onClick={() => dispatch(getAllMoviesAction({ ...queries, pageNumber: page - 1 }))}
                    disabled={page === 1}
                    className={sameClass}
                  >
                    <TbPlayerTrackPrev className="text-xl" />
                  </button>
                  <button
                    onClick={() => dispatch(getAllMoviesAction({ ...queries, pageNumber: page + 1 }))}
                    disabled={page === pages}
                    className={sameClass}
                  >
                    <TbPlayerTrackNext className="text-xl" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full gap-6 flex-colo min-h-screen">
                <div className="w-24 h-24 p-5 rounded-full mb-4 bg-dry text-subMain text-4xl flex-colo">
                  <RiMovie2Line />
                </div>
                <p className="text-border text-sm">It seems like we don't have any movies</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default MoviesPage;