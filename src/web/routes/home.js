import bg from "../assets/bg-sm.png";
import addBot from "../assets/icons/addbot.png";
import search from "../assets/icons/search.png";
import { Link } from "wouter-preact";

export default function Home() {
  return (
    <div className="home">
      <div 
        className="hero" 
        style={{ backgroundImage: `linear-gradient(to bottom, #101010, rgba(0, 0, 0, 0)), linear-gradient(to top, #0a0a0a 0%, rgba(0, 0, 0, 0) 20%), url(${bg})` }}
      >
        <h1>Just a Discord <span className="app">App</span>.</h1>
        <p>Yeah just that, we dont have anything to offer... yet</p>
        <div className="buttons">
          <a href="/invite"><button><img src={addBot}></img> Add Me!</button></a>
          <Link href="/commands"><button><img src={search}></img> Explore the commands</button></Link>
        </div>
      </div>
    </div>
  );
}
