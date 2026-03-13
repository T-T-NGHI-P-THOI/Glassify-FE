export class CameraService {

   async startCamera(video: HTMLVideoElement) {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "user" },
        });

        video.srcObject = stream;

        return new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
    }

}