import { useState, useEffect } from 'preact/hooks';

export default function Commands() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetch('/api/commands')
      .then((response) => response.json())
      .then((data) => {
        setCommands(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching commands:', error);
        setLoading(false);
      });
  }, []);

  const categories = ['All', ...new Set(commands.map((cmd) => cmd.category).filter(Boolean))];

  const filteredCommands = activeTab === 'All'
    ? commands
    : commands.filter((cmd) => cmd.category === activeTab);

  return (
    <div className="commands">
      <div className="header">
        <h1>Commands</h1>
        <p>All the App commands.</p>
      </div>

      {!loading && commands.length > 0 && (
        <div className="tabs-container">
          {categories.map((category) => (
            <button
              key={category}
              className={`tab-button ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="commands-list">
        {loading ? (
          <p>Loading commands...</p>
        ) : filteredCommands.length === 0 ? (
          <p>No commands available in this category.</p>
        ) : (
          filteredCommands.map((cmd, index) => (
            <div key={index} className="command-item">
              <div className="header">
                <h3>/{cmd.name}</h3>
                <span className="category">{cmd.category}</span>
              </div>
              <p>{cmd.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
