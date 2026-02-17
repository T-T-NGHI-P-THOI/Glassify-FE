import axios from "axios";
import api from "./axios.config";

class RemovebgAPI {
  static async removeBgAPI(file: File): Promise<Blob> {
    try {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("size", "auto");
      console.log("RemoveBG key: " + import.meta.env.REMOVEBG_API_KEY)

      const response = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        formData,
        {
          headers: {
            "X-Api-Key": import.meta.env.VITE_REMOVEBG_API_KEY,
          },
          responseType: "blob",
        }
      );

      return response.data;

    } catch (error) {
      console.error("RemoveBG API error:", error);
      throw error;
    }
  }

  static async removeBg(blob: any): Promise<ArrayBuffer> {
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", blob);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": "GACbDGkvbUeiT5SAJXpPB3VB" },
      body: formData,
    });

    if (response.ok) {
      return await response.arrayBuffer();
    } else {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
  }

  
}

export default RemovebgAPI;
