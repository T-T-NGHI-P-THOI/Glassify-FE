import { removeBackgroundFromImageFile, type RemoveBgError } from "remove.bg";

class RemovebgAPI {
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

  static async removeBackgroundFromImageFile(file: File) {
    removeBackgroundFromImageFile({
      path: path,
      apiKey: "GACbDGkvbUeiT5SAJXpPB3VB",
      size: "regular",
      type: "person"
        }).then((result: RemoveBgResult) => {
      console.log(`File saved to ${outputFile}`);
      console.log(`${result.creditsCharged} credit(s) charged for this image`);
      console.log(`Result width x height: ${result.resultWidth} x ${result.resultHeight}, type: ${result.detectedType}`);
      console.log(result.base64img.substring(0, 40) + "..");
    }).catch((errors: Array<RemoveBgError>) => {
      console.log(JSON.stringify(errors));
    });

    return null;
  }
}

export default RemovebgAPI;
