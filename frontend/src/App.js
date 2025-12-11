import React, { useState } from "react";
import axios from "axios";

function App() {
  const [token, setToken] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState({ email: "", password: "" });
  const [myFiles, setMyFiles] = useState([]); // user's files

  // Handle Login
  const handleLogin = async () => {
    try {
      const res = await axios.post("/api/login", user);
      setToken(res.data.token);
      setMessage("✅ Login successful!");
    } catch (err) {
      setMessage("❌ Login failed! Check credentials.");
    }
  };

  // Handle File Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !token) return setMessage("Please login and select a file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("privacy", "public");

    try {
      await axios.post("/api/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("✅ File uploaded successfully!");
    } catch (err) {
      setMessage("❌ Upload failed. Try again.");
    }
  };

  // Fetch user's files
  const handleViewFiles = async () => {
    try {
      const res = await axios.get("/api/my-files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyFiles(res.data);
      setMessage("✅ Files fetched successfully!");
    } catch (err) {
      setMessage("❌ Failed to load files.");
    }
  };

  // Delete file
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await axios.delete(`/api/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("🗑 File deleted successfully!");
      setMyFiles(myFiles.filter((f) => f._id !== id)); // remove from table instantly
    } catch (err) {
      setMessage("❌ Failed to delete file.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h2>📁 Secure File Upload System</h2>

      {/* Login Section */}
      <h3>Login</h3>
      <input
        type="email"
        placeholder="Email"
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={user.password}
        onChange={(e) => setUser({ ...user, password: e.target.value })}
      />
      <button onClick={handleLogin}>Login</button>

      <hr />

      {/* Upload Section */}
      <form onSubmit={handleUpload}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Upload</button>
      </form>

      <hr />

      {/* View Files Section */}
      <button onClick={handleViewFiles} disabled={!token}>
        View My Files
      </button>

      <p style={{ color: "green" }}>{message}</p>

      {/* Table of Files */}
      {myFiles.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>🗂 My Uploaded Files</h3>
          <table border="1" style={{ margin: "auto", width: "80%" }}>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Privacy</th>
                <th>Size (KB)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myFiles.map((f) => (
                <tr key={f._id}>
                  <td>{f.filename}</td>
                  <td>{f.privacy}</td>
                  <td>{(f.size / 1024).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(f._id)}
                      style={{ color: "white", backgroundColor: "red", border: "none", padding: "5px 10px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
