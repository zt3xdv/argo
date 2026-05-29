import { useState, useEffect } from 'preact/hooks';

export default function Commands() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="commands">
      <div className="header">
        <h1>Commands</h1>
        <p>All the App commands.</p>
      </div>

      <div className="commands-list">
        {loading ? (
          <p>Loading commands...</p>
        ) : commands.length === 0 ? (
          <p>No commands available.</p>
        ) : (
          commands.map((cmd, index) => (
            <div key={index} className="command-item">
              <h3>/{cmd.name}</h3>
              <p>{cmd.description}</p>
              <span className="category">{cmd.category}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
