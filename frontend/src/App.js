import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import InterviewRoom from "./pages/InterviewRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<InterviewRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;