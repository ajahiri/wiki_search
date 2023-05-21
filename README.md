# wiki_search

An application of pagerank on wiki pages for 42913 Social and Information Network Analysis.

Submission for 42913 Social and Information Network Analysis - Autumn 2023 Assignment 3.

Please read below for which files to look at:

Graph_Processor_w_Pagerank.ipynb - This contains the source code for all the dataset processing we did on the files given to us. We process everything into a SQLite file.

backend/app.py - All the source code pertaining to the Flask Python web server backend. This contains all the SQL queries and code for resolving links/sub-links as well as the ChatGPT integration.

backend/wiki_pagerank.db - The SQLite database file. Inspect if you'd like but this just contains all the data from the processing steps we did in the Google Colab .ipynb file.

frontend/src/App.js - The main source code for the React web application frontend. There is more code in the src directory but all the pertinant source code in contained in this single App.js file.

For a more useful look at the source code see the actual sources:

Colab: https://colab.research.google.com/drive/1UOgbHCms373AgdLvdlLFxGYue8LuV4WG?usp=sharing

GitHub: https://github.com/ajahiri/wiki_search

Arian Jahiri 13348469
