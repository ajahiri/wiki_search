import "./App.css";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { IconButton, Pagination, Tooltip } from "@mui/material";

import SmartToyIcon from "@mui/icons-material/SmartToy";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

function App() {
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [useLLM, setLLM] = useState(0);
  const [numResults, setNumResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const toggleLLM = () => {
    setLLM((prevVal) => (prevVal == 1 ? 0 : 1));
  };

  const searchChange = (e) => {
    setQuery(e?.target?.value || "");
  };

  const changePage = (event, pageNum) => {
    const page = pageNum - 1;
    setLoadingContent(true);
    setCurrentPage(page);
    window.scrollTo(0, 0);
    fetch(
      `http://localhost:5000/search?query=${query}&limit=${limit}&offset=${
        (page || 0) * limit
      }&use_llm=${useLLM}`,
      { method: "GET" }
    )
      .then((response) => response.json())
      .then((data) => {
        setData(data?.data || []);
        setNumResults(data?.result_count || 0);
        setLoadingContent(false);
      })
      .catch((err) => console.log(err));
  };

  const onSearch = (e) => {
    setHasSearched(true);
    setLoadingContent(true);
    setCurrentPage(0);
    fetch(
      `http://localhost:5000/search?query=${query}&limit=${limit}&offset=${0}&use_llm=${useLLM}`,
      { method: "GET" }
    )
      .then((response) => response.json())
      .then((data) => {
        window.scrollTo(0, 0);
        setData(data?.data || []);
        setNumResults(data?.result_count || 0);
        setLoadingContent(false);
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      <div className="searchBar">
        <motion.div
          className="searchBarInner"
          animate={{
            y: hasSearched ? -60 : "60vh",
            width: hasSearched ? "70vw" : "40vw",
          }}
          transition={{
            duration: 0.8,
            type: "tween",
            ease: "anticipate",
          }}
        >
          <input
            id="searchQueryInput"
            type="text"
            name="searchQueryInput"
            placeholder="Search"
            onChange={searchChange}
          />
          <button
            id="searchQuerySubmit"
            onClick={onSearch}
            type="submit"
            name="searchQuerySubmit"
          >
            <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24">
              <path
                fill="#666666"
                d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
              />
            </svg>
          </button>
          <div style={{ marginLeft: 30 }}>
            <Tooltip title="Optimise search with GPT">
              <IconButton onClick={toggleLLM}>
                {useLLM == 1 ? <SmartToyIcon /> : <SmartToyOutlinedIcon />}
              </IconButton>
            </Tooltip>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {hasSearched && (
          <motion.div
            style={{
              marginLeft: 50,
              marginRight: 50,
              marginTop: 80,
              minHeight: "100vh",
            }}
            initial={{ opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3,
              },
            }}
            exit={{ opacity: 0 }}
          >
            {loadingContent ? (
              <>
                <motion.div style={{ marginBottom: 30 }}>
                  <div style={{ marginRight: 100 }}>
                    <Skeleton enableAnimation={true} count={2} />
                  </div>
                  <div style={{ marginLeft: 40 }}>
                    <Skeleton count={3} />
                  </div>
                </motion.div>
                <motion.div style={{ marginBottom: 30 }}>
                  <div style={{ marginRight: 100 }}>
                    <Skeleton count={2} />
                  </div>
                  <div style={{ marginLeft: 40 }}>
                    <Skeleton count={3} />
                  </div>
                </motion.div>
                <motion.div style={{ marginBottom: 30 }}>
                  <div style={{ marginRight: 100 }}>
                    <Skeleton count={2} />
                  </div>
                  <div style={{ marginLeft: 40 }}>
                    <Skeleton count={3} />
                  </div>
                </motion.div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <p>
                  {numResults} results were found. Showing page{" "}
                  {currentPage + 1} of {Math.ceil(numResults / limit)}
                </p>
                {data &&
                  data?.map((item) => {
                    return (
                      <div key={item.url}>
                        <div style={{ marginRight: 100 }}>
                          <a href={item.url} target="_blank">
                            <h3>{item.title}</h3>
                          </a>
                          <p>{item.abstract}</p>
                        </div>
                        <div style={{ marginLeft: 40 }}>
                          <ul>
                            {item?.sub_links?.map((subLink) => {
                              return (
                                <li key={subLink.node_id}>
                                  <Tooltip
                                    title={
                                      "Pagerank: " +
                                      subLink.pagerank.toExponential()
                                    }
                                    placement="right"
                                  >
                                    <a href={subLink.url} target="_blank">
                                      {subLink.anchor}
                                    </a>
                                  </Tooltip>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                <div
                  style={{
                    marginLeft: "auto",
                    marginRight: "auto",
                    marginTop: 20,
                    marginBottom: 20,
                  }}
                >
                  <Pagination
                    count={Math.ceil(numResults / limit)}
                    page={currentPage + 1}
                    onChange={changePage}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hasSearched && (
          <motion.div
            className="main-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="title">
              Welcome to <a>WikiSearch!</a>
            </h1>

            <p className="description">Tell us what you're looking for:</p>
          </motion.div>
        )}
      </AnimatePresence>

      <footer>
        <p>42913 Social and Information Network Analysis - Autumn 2023</p>
      </footer>
    </>
  );
}

export default App;
