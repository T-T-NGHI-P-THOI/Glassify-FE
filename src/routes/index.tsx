import { Routes } from "react-router-dom"
import PublicRoutesComponent from "./public-route"
import PrivateRoutesComponent from "./private-route"

const RouteComponent = () => {
    return (
        <Routes>
            {PublicRoutesComponent()}
            {PrivateRoutesComponent()}
        </Routes>
    )
}

export default RouteComponent