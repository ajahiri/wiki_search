from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import sqlite3
import os
import json

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

# dev run: flask --app main.py --debug run

@app.route('/')
def hello_world():
    return 'Hello!'

def get_db_connection():
    conn = sqlite3.connect('wiki_pagerank.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/search", methods=['GET'])
def search():
    args = request.args

    try:
        query = args.get('query')
        limit = args.get('limit')
        use_llm = int(args.get('use_llm'))
        offset = args.get('offset')

        # optionally, use openai api (chatgpt) to optimise a user's search query, this may give undesired results hence it being an optional flag
        if use_llm == 1:
            llm = OpenAI(temperature=0.1)

            prompt = PromptTemplate(
                input_variables=["query"],
                template="""Please analyze the following user web search query and optimize it in a way that only 
                extracts the subjects of questions. Rank the subjects by importance, place most important first. This 
                is searching through a database of wiki articles, so it is probably more important to place things 
                instead of concepts first. Please ensure your output is a list of these optimized queries. An example 
                is provided below before the actual user query so you understand what to output. Only return an array 
                in JSON format, this is a strict requirement.
    
                Example:
                Example query: What is the capital city of Germany?
                Example Response: 
                [Germany, capital city]
                
                User Query: {query}
                
                Return a JSON object with the result, but you must ensure that before the json starts you put JSON_S 
                and after the JSON is finished you append JSON_E. ['string1', 'string2']"""
            )

            chain = LLMChain(llm=llm, prompt=prompt)

            llm_result = chain.run(query=query)

            json_string = llm_result.split('JSON_S')[1].split('JSON_E')[0]

            search_terms = json.loads(json_string)

            query = search_terms[0]

        # tried to use multiple terms, but result was not good
        # placeholders_title = ' OR '.join(["title LIKE '%' || ? || '%'"] * len(search_terms))
        # placeholders_abstract = ' OR '.join(["abstract LIKE '%' || ? || '%'"] * len(search_terms))
        # stmt_parent = f"SELECT * from node_parent_list WHERE {placeholders_title} OR {placeholders_abstract} LIMIT ?"
        # term_vars = [term for term in search_terms]
        # for term in search_terms:
        #     term_vars.append(term)
        # term_vars.append(int(limit))
        # instead we'll just utilise the first search term after being processed by the llm

        db = get_db_connection()

        # get all the parent links (main links)
        node_parent_list_count = db.execute("SELECT COUNT(*) from node_parent_list WHERE title LIKE '%' || ? || '%' OR abstract "
                                      "LIKE '%' || ? || '%'"
                                      "LIMIT -1 OFFSET 0", [query, query]).fetchone()[0]
        print(node_parent_list_count)
        node_parent_list = db.execute("SELECT * from node_parent_list WHERE title LIKE '%' || ? || '%' OR abstract "
                                      "LIKE '%' || ? || '%'"
                                      "LIMIT ? OFFSET ?", [query, query, limit, offset]).fetchall()

        parent_list = [dict(row) for row in node_parent_list]

        # get parent sub-links (the child links)
        for parent_node in parent_list:
            url = str(parent_node.get('url'))
            stmt = "SELECT * FROM node_list INNER JOIN node_pageranks ON node_list.node_id = " \
                   "node_pageranks.node_id WHERE node_list.url LIKE '%" + url + "#%' ORDER BY " \
                                                                                "node_pageranks.pagerank DESC"
            child_nodes_rows = db.execute(stmt).fetchall()
            child_nodes_list = [dict(row) for row in child_nodes_rows]
            parent_node['sub_links'] = child_nodes_list

        db.close()

        return jsonify({
            'success': True,
            'data': parent_list,
            'result_count': node_parent_list_count
        })
    except Exception as e:
        print("An exception occurred")
        return jsonify({
            'success': False,
            'error': str(e)
        })


# app route is not used, couldn't get it to work and generate pageranks for parent links 
# @app.route("/generate_average_pageranks", methods=['GET'])
def generate_average_pageranks():
    try:
        db = get_db_connection()

        check_col = db.execute("SELECT COUNT(*) FROM pragma_table_info('node_parent_list') WHERE name = "
                               "'child_avg_pagerank'")
        res = check_col.fetchone()[0]

        if res == 0:
            db.execute("ALTER TABLE node_parent_list ADD COLUMN child_avg_pagerank REAL")

        # Commit the changes
        db.commit()

        cursor = db.cursor()

        cursor.execute("""
            CREATE TEMP VIEW child_nodes_pageranked AS
            SELECT *
            FROM node_list INNER JOIN node_pageranks ON node_list.node_id = node_pageranks.node_id
        """)

        cursor.execute("""
            UPDATE node_parent_list
            SET child_avg_pagerank = (
                SELECT AVG(child_nodes_pageranked.pagerank)
                FROM child_nodes_pageranked
                WHERE child_nodes_pageranked.url LIKE node_parent_list.url || '#' || '%'
            )
        """)

        db.commit()

        cursor.close()
        db.close()
        return jsonify({
            'success': True,
        })
    except Exception as e:
        print("An exception occurred")
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == "__main__":
    app.run(host='0.0.0.0')