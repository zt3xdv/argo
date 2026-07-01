import bg from "../assets/bg.png";
import addBot from "../assets/icons/addbot.png";
import search from "../assets/icons/search.png";
import Icon from "../components/icon.js";
import { Link } from "wouter-preact";
import { useState, useEffect } from 'preact/hooks';

export default function Home() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/stats')
      .then((response) => response.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching stats:', error);
      });
  }, []);
  
  return (
    <div className="home">
      <div 
        className="hero" 
        style={{ backgroundImage: `linear-gradient(to bottom, #101010, rgba(0, 0, 0, 0)), linear-gradient(to top, #0a0a0a 0%, rgba(0, 0, 0, 0) 20%), url(${bg})` }}
      >
        <div className="content">
          <h1>Just a Discord <span className="app">App</span>.</h1>
          <p>Yeah just that, we dont have anything to offer... yet</p>
          <div className="buttons">
            <a href="/invite"><button><Icon src={addBot} style={{ width: "auto", height: "1.5em" }}/> Add Me!</button></a>
            <Link href="/commands"><button><Icon src={search} style={{ width: "auto", height: "1.5em" }}/> Explore the commands</button></Link>
          </div>
        </div>
      </div>
      <div
        className="section stats"
      >
        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <>
            <div
              className="stat"
            >
              <p>ping</p>
              <h1>{stats.ping}</h1>
            </div>
            <div
              className="stat"
            >
              <p>users</p>
              <h1>{stats.totalUsers}</h1>
            </div>
            <div
              className="stat"
            >
              <p>guilds</p>
              <h1>{stats.guildCount}</h1>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
