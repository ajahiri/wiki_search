import styles from "./styles/Home.module.css";
import "./App.css";

function App() {
  return (
    <div className={styles.container}>
      <title>WikiSearch</title>
      <link rel="icon" href="/favicon.ico" />

      <main>
        <h1 className={styles.title}>
          Welcome to <a>WikiSearch!</a>
        </h1>

        <p className={styles.description}>Tell us what you're looking for:</p>
      </main>

      <footer>
        <p>42913 Social and Information Network Analysis - Autumn 2023</p>
      </footer>
    </div>
  );
}

export default App;
