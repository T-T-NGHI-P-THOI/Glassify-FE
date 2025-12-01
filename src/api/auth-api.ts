import type { UserDto } from "../types/user.dto";

export default class PrivateAPI {

    static async getUserByToken(): Promise<UserDto> {

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