import theme from "@/theme";
import { Description, Delete } from "@mui/icons-material";
import { Box, Typography, Divider, Paper, IconButton, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { UploadArea } from "./CreateFrameVariantPage";
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface UploadToRemoveBgImage {
    originalFile: File;
    originalPreview: string;

    removedBgBlob?: Blob;
    removedBgPreview?: string;
}
type ViewType = 'front' | 'left' | 'back';

const GenerateFrameModel = () => {
    const theme = useTheme()
    const [frontImage, setFrontImage] = useState<UploadToRemoveBgImage | null>(null);
    const [leftImage, setLeftImage] = useState<UploadToRemoveBgImage | null>(null);
    const [backImage, setBackImage] = useState<UploadToRemoveBgImage | null>(null);

    const handleUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        view: ViewType
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const image: UploadToRemoveBgImage = {
            originalFile: file,
            originalPreview: URL.createObjectURL(file),
        };

        if (view === 'front') setFrontImage(image);
        if (view === 'left') setLeftImage(image);
        if (view === 'back') setBackImage(image);
    };

    const handleRemoveBackground = async (
        image: UploadToRemoveBgImage,
        setImage: React.Dispatch<React.SetStateAction<UploadToRemoveBgImage | null>>
    ) => {
        // File trong browser chính là Blob
        const arrayBuffer = new ArrayBuffer;

        // convert ArrayBuffer -> Blob
        const blob = new Blob([arrayBuffer], { type: "image/png" });

        const preview = URL.createObjectURL(blob);

        setImage({
            ...image,
            removedBgBlob: blob,
            removedBgPreview: preview,
        });
    };

    const handleRemoveImage = (
        setImage: React.Dispatch<React.SetStateAction<UploadToRemoveBgImage | null>>
    ) => {
        setImage(null);
    };

    useEffect(() => {
        setFrontImage({
            // chỉ để satisfy type
            originalFile: new File([], "front.jpg"),

            // ảnh trước remove bg
            originalPreview: "/tests/front.jpg",

            // ảnh sau remove bg
            removedBgPreview: "/tests/front-removebg-preview.png",
        });
    }, []);

    return (
        <Box>
            <Typography
                sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: theme.palette.custom.neutral[800],
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                Frame Variant Information
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                Front View
            </Typography>

            <input
                type="file"
                accept="image/*"
                hidden
                id="front-image"
                onChange={(e) => handleUpload(e, 'front')}
            />

            {!frontImage && (
                <label htmlFor="front-image">
                    <UploadArea>
                        <Typography>Upload Front View</Typography>
                    </UploadArea>
                </label>
            )}

            {frontImage && (
                <Paper sx={{ p: 2, mt: 2 }}>
                    <ReactCompareSlider
                        portrait={false}
                        transition="0.15s linear"
                        itemOne={
                            <ReactCompareSliderImage
                                src={frontImage.originalPreview}
                                alt="Image one"
                                style={{ objectPosition: 'top center' }}
                            />
                        }
                        itemTwo={
                            <ReactCompareSliderImage
                                src={frontImage.removedBgPreview}
                                alt="Image two"
                                style={{
                                    objectPosition: 'top center',
                                    backgroundColor: 'white',
                                    backgroundImage: `
                                        linear-gradient(45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                                        linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                                    backgroundSize: `20px 20px`,
                                    backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`,
                                }}
                            />
                        }
                        style={{ width: '100%', height: '50%' }}
                    />


                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <IconButton
                            onClick={() =>
                                handleRemoveBackground(frontImage, setFrontImage)
                            }
                        >
                            <Description />
                        </IconButton>

                        <IconButton
                            onClick={() => handleRemoveImage(setFrontImage)}
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </Paper>
            )}

            {/* LEFT */}
            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                Left View
            </Typography>

            <input
                type="file"
                accept="image/*"
                hidden
                id="left-image"
                onChange={(e) => handleUpload(e, 'left')}
            />

            {!leftImage && (
                <label htmlFor="left-image">
                    <UploadArea>
                        <Typography>Upload Left View</Typography>
                    </UploadArea>
                </label>
            )}

            {leftImage && (
                <Paper sx={{ p: 2, mt: 2 }}>
                    <ReactCompareSlider
                        portrait={false}
                        transition="0.15s linear"
                        itemOne={
                            <ReactCompareSliderImage
                                src={leftImage.originalPreview}
                                alt="Image one"
                                style={{ objectPosition: 'top center' }}
                            />
                        }
                        itemTwo={
                            <ReactCompareSliderImage
                                src={leftImage.removedBgPreview}
                                alt="Image two"
                                style={{
                                    objectPosition: 'top center',
                                    backgroundColor: 'white',
                                    backgroundImage: `
                                        linear-gradient(45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                                        linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                                    backgroundSize: `20px 20px`,
                                    backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`,
                                }}
                            />
                        }
                        style={{ width: '100%', height: '50%' }}
                    />


                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <IconButton
                            onClick={() =>
                                handleRemoveBackground(leftImage, setLeftImage)
                            }
                        >
                            <Description />
                        </IconButton>

                        <IconButton
                            onClick={() => handleRemoveImage(setLeftImage)}
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </Paper>
            )}

            {/* BACK VIEW */}
            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                Back View
            </Typography>

            
            <input
                type="file"
                accept="image/*"
                hidden
                id="back-image"
                onChange={(e) => handleUpload(e, 'back')}
            />

            {!backImage && (
                <label htmlFor="back-image">
                    <UploadArea>
                        <Typography>Upload Front View</Typography>
                    </UploadArea>
                </label>
            )}

            {backImage && (
                <Paper sx={{ p: 2, mt: 2 }}>
                    <ReactCompareSlider
                        portrait={false}
                        transition="0.15s linear"
                        itemOne={
                            <ReactCompareSliderImage
                                src={backImage.originalPreview}
                                alt="Image one"
                                style={{ objectPosition: 'top center' }}
                            />
                        }
                        itemTwo={
                            <ReactCompareSliderImage
                                src={backImage.removedBgPreview}
                                alt="Image two"
                                style={{
                                    objectPosition: 'top center',
                                    backgroundColor: 'white',
                                    backgroundImage: `
                                        linear-gradient(45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                                        linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                                    backgroundSize: `20px 20px`,
                                    backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`,
                                }}
                            />
                        }
                        style={{ width: '100%', height: '50%' }}
                    />


                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <IconButton
                            onClick={() =>
                                handleRemoveBackground(backImage, setBackImage)
                            }
                        >
                            <Description />
                        </IconButton>

                        <IconButton
                            onClick={() => handleRemoveImage(setBackImage)}
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </Paper>
            )}

        </Box>
    );
}

export default GenerateFrameModel;