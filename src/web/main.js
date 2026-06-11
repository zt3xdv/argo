import "./assets/style.css";
import { render, h } from 'preact';
import { Link, Route, Switch } from 'wouter-preact';

import Home from "./routes/home.js";
import Commands from "./routes/commands.js";

import Logo from "./assets/argo-nobg.png";
import CommandsIcon from "./assets/icons/commands.png";
import HomeIcon from "./assets/icons/home.png";
import HeartIcon from "./assets/icons/heart.png";

export default function App() {
  return (
    <div>
      <nav class="navbar">
        <img class="nav-brand" src={Logo}></img>
        <ul class="nav-links">
          <li class="nav-item">
            <Link href="/"><img src={HomeIcon} style={{ width: "auto", height: 20 }}></img></Link>
          </li>
          <li class="nav-item">
            <Link href="/commands"><img src={CommandsIcon} style={{ width: "auto", height: 20 }}></img></Link>
          </li>
        </ul>
      </nav>
      
      <main class="main-content">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/commands" component={Commands} />
          <Route>
            <div class="card">
              <strong style={{ color: 'var(--accent-color)' }}>404 - Page not found</strong>
            </div>
          </Route>
        </Switch>
      </main>
      <footer className="footer-container">
        <div className="footer-brand">
          <img className="brand-icon" src={Logo} alt="Argo Logo" />
          <span className="brand-name">Argo</span>
        </div>

        <div className="footer-content">
          <nav className="footer-links">
            <a href="https://github.com/zt3xdv/argo" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/zt3xdv" target="_blank" rel="noopener noreferrer">Author</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

render(<App />, document.getElementById("app"));
