
import React, { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

function App() {
 
  const [userEmail, setUserEmail] = useState("");

  const handleLogin = (email) => {
    setUserEmail(email);
   
  };

  const handleLogout = () => {
    setUserEmail("");
    
  };

  
  if (!userEmail) {
    return <LoginPage onLogin={handleLogin} />;
  }

  
  return <HomePage userEmail={userEmail} onLogout={handleLogout} />;
}

export default App;
