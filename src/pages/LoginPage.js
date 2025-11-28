
import React, { useState } from "react";
import { API_BASE } from "../api/apiConfig";

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const endpoint = mode === "signup" ? "/signup" : "/login";

    try {
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          
          onLogin(email);
        } else {
          // signup
          setIsError(false);
          setMessage(data.message || "Signup successful! Please login.");
          setMode("login");
        }
      } else {
        setIsError(true);
        setMessage(data.message || "Authentication failed");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>EventPlanner</h1>
        <div className="tabs">
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setMessage("");
              setIsError(false);
            }}
          >
            Sign Up
          </button>
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
              setIsError(false);
            }}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="primary-btn" disabled={loading}>
            {loading
              ? mode === "signup"
                ? "Creating account..."
                : "Logging in..."
              : mode === "signup"
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.85rem",
              color: isError ? "#ff6b6b" : "#4caf50",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
