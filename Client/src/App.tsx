import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Chatpage from "./pages/Chatpage"
import Home from "./pages/Home"
import Settings from "./pages/Settings"
import ControlMemory from "./pages/ControlMemory"
import Layout from "./components/Layout/Layout"

export default function App() {
  return (
    <Layout>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chatpage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/memory" element={<ControlMemory />} />
        </Routes>
      </Router>
    </Layout>
  )
}

