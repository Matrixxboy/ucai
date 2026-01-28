import { createBrowserRouter } from "react-router-dom"

import Home from "../pages/Home"
import Chatpage from "../pages/Chatpage"
import Settings from "../pages/Settings"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/chat",
    element: <Chatpage />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
])

export default router
