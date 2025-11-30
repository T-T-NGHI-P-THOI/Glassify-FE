import { Route, Routes } from "react-router-dom"
import Login from "../pages/auth/Login"

const RouteComponent = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />

        </Routes>
    )
}

export default RouteComponent