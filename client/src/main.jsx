import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App.jsx";
import "./styles/app.css";
import { SessionProvider } from './app/Session.jsx';

createRoot(document.getElementById("root")).render(<React.StrictMode><BrowserRouter><SessionProvider><App /></SessionProvider></BrowserRouter></React.StrictMode>);
