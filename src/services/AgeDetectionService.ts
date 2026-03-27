import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

export interface AgeGenderResult {
    age: number;
    gender: "male" | "female";
    genderProbability: number;
    ageGroup: string;   // "Teen" | "20s" | "30s" | ...
    ageRange: string;   // "22–28"
}

function toAgeGroup(age: number): { group: string; range: string } {
    if (age < 13)  return { group: "Child", range: `${Math.max(1, age - 2)}–${age + 2}` };
    if (age < 20)  return { group: "Teen",  range: `${Math.max(13, age - 2)}–${Math.min(19, age + 2)}` };
    if (age < 30)  return { group: "20s",   range: `${Math.max(20, age - 3)}–${Math.min(29, age + 3)}` };
    if (age < 40)  return { group: "30s",   range: `${Math.max(30, age - 3)}–${Math.min(39, age + 3)}` };
    if (age < 50)  return { group: "40s",   range: `${Math.max(40, age - 4)}–${Math.min(49, age + 4)}` };
    if (age < 60)  return { group: "50s",   range: `${Math.max(50, age - 4)}–${Math.min(59, age + 4)}` };
    return { group: "60s+", range: `${Math.max(60, age - 5)}–${age + 5}` };
}

// @vladmandic/face-api result type cho detectSingleFace().withAgeAndGender()
type FaceApiResult = faceapi.WithAge<faceapi.WithGender<{ detection: faceapi.FaceDetection }>>;

export class AgeDetectionService {
    private loaded = false;

    async loadModels(): Promise<void> {
        if (this.loaded) return;
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        this.loaded = true;
    }

    /** VIDEO mode — tự throttle từ bên ngoài (ví dụ mỗi 3–5 giây) */
    async detectFromVideo(video: HTMLVideoElement): Promise<AgeGenderResult | null> {
        if (!this.loaded) return null;
        const result = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withAgeAndGender() as FaceApiResult | undefined;
        return result ? this.format(result) : null;
    }

    /** IMAGE mode — gọi một lần sau khi ảnh load xong */
    async detectFromImage(img: HTMLImageElement): Promise<AgeGenderResult | null> {
        if (!this.loaded) return null;
        const result = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withAgeAndGender() as FaceApiResult | undefined;
        return result ? this.format(result) : null;
    }

    private format(r: FaceApiResult): AgeGenderResult {
        const age = Math.round(r.age);
        const { group, range } = toAgeGroup(age);
        return {
            age,
            // Gender enum: Gender.MALE = "male", Gender.FEMALE = "female"
            gender: r.gender as "male" | "female",
            genderProbability: r.genderProbability,
            ageGroup: group,
            ageRange: range,
        };
    }
}