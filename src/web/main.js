import "./assets/style.css";
import { render, h } from 'preact';
import { Link, Route, Switch } from 'wouter-preact';

import Home from "./routes/home.js";
import Commands from "./routes/commands.js";

import Logo from "./assets/logo.png";
import CommandsIcon from "./assets/icons/commands.png";
import HomeIcon from "./assets/icons/home.png";

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
    </div>
  );
}

render(<App />, document.getElementById("app"));
