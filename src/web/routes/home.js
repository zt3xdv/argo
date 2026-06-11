import bg from "../assets/bg-sm.png";
import addBot from "../assets/icons/addbot.png";
import search from "../assets/icons/search.png";
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
        <h1>Just a Discord <span className="app">App</span>.</h1>
        <p>Yeah just that, we dont have anything to offer... yet</p>
        <div className="buttons">
          <a href="/invite"><button><img src={addBot}></img> Add Me!</button></a>
          <Link href="/commands"><button><img src={search}></img> Explore the commands</button></Link>
        </div>
      </div>
      <div
        className="section stats"
      >
        <h2>Stats</h2>
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
      <div
        className="section features"
      >
        <h2>Features</h2>
        <div
          className="feature"
        >
          <h3>Commands</h3>
          <p>to enchance your experience on Discord</p>
        </div>
        <div
          className="feature"
        >
          <h3>Fast</h3>
          <p>i dont think but it seems fast</p>
        </div>
      </div>
    </div>
  );
}
