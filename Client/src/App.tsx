import { RouterProvider } from "react-router-dom"
import router from "./Router/Router"
import Layout from "./components/Layout/Layout"

export default function App() {
  return (
    <Layout>
      <RouterProvider router={router} />
    </Layout>
  )
}

