import type { UserDto } from "../types/user.dto";
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export default class PrivateAPI {

    static async getUserByToken(): Promise<UserDto> {
        // const axiosResposne = await api.get("https://localhost:5000" + API_ENDPOINTS.ACCOUNT.GET);
        // const response: ResponseDto<GetUserResponseDTO> = axiosResposne.data;

        // fake delay để giả lập async call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // trả về fake data
        return {
            id: 1,
            name: "Nguyen Van A",
            email: "nguyenvana@example.com",
            roles: ["admin"]
        };
    }
}