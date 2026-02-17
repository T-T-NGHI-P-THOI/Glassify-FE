import {
    Box,
    Typography,
    Paper,
    IconButton,
    Avatar,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Divider,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    Description,
    Delete,
    InsertDriveFile,
    CloudUpload,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import RemovebgAPI from '@/api/removebgAPI';

interface ProductImage {
    name: string;
    size: number;
    type: string;
    preview?: string;
}

interface FrameVariantForm {
    colorName: string;
    colorHex: string;
    size: 'S' | 'M' | 'L';
    frameWidthMm?: number;
    lensWidthMm?: number;
    lensHeightMm?: number;
    bridgeWidthMm?: number;
    templeLengthMm?: number;
    hasNosepads: boolean;
    hasSpringHinge: boolean;
    vrEnabled: boolean;
    model3dFile?: File;
}


const UploadArea = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.custom.border.light}`,
    borderRadius: 12,
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.custom.neutral[50],
    },
}));

const CreateFrameVariantPage = () => {
    const theme = useTheme()
    const [productImages, setProductImages] = useState<ProductImage[]>([]);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleRemoveFile = (index: number) => {
        setProductImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const imageFiles = Array.from(files).filter((file) =>
            file.type.startsWith('image/')
        );

        if (imageFiles.length !== files.length) {
            console.warn('Chỉ cho phép upload file ảnh');
            // nếu dùng toast:
            // toast.error('Chỉ cho phép upload file ảnh');
        }

        const newFiles: ProductImage[] = imageFiles.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            preview: URL.createObjectURL(file),
        }));

        setProductImages((prev) => [...prev, ...newFiles]);
        // setFormData((prev) => ({ ...prev, businessLicenseUrl: newFiles[0].name }));

        // reset input để upload lại cùng file vẫn trigger onChange
        // e.target.value = '';
    };
    

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

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Color Name" placeholder="Black / Silver" />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <TextField fullWidth label="Color Hex" placeholder="#000000" />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <TextField fullWidth type="color" label="Pick Color" />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel>Frame Size</InputLabel>
                        <Select label="Frame Size">
                            <MenuItem value="S">Small</MenuItem>
                            <MenuItem value="M">Medium</MenuItem>
                            <MenuItem value="L">Large</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>


            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                Frame Dimensions (mm)
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Frame Width" type="number" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Lens Width" type="number" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Lens Height" type="number" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Bridge Width" type="number" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Temple Length" type="number" />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                Frame Features
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel control={<Switch />} label="Has Nose Pads" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel control={<Switch />} label="Spring Hinge" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel control={<Switch />} label="VR Enabled" />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                Hình ảnh quảng bá
            </Typography>


            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
                Please upload your business license and related documents for verification. Accepted formats: PDF,
                JPG, PNG (max 10MB each)
            </Typography>

            <input
                type="file"
                id="license-upload"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />

            <label htmlFor="license-upload">
                <UploadArea>
                    <CloudUpload sx={{ fontSize: 48, color: theme.palette.custom.neutral[400], mb: 2 }} />
                    <Typography sx={{ fontSize: 16, fontWeight: 500, color: theme.palette.custom.neutral[700], mb: 1 }}>
                        Drag and drop files here or click to browse
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                        PDF, JPG, PNG up to 10MB
                    </Typography>
                </UploadArea>
            </label>

            {productImages.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 2 }}>
                        Uploaded Files ({productImages.length})
                    </Typography>

                    {productImages.map((file, index) => (
                        <Paper
                            key={index}
                            elevation={0}
                            sx={{
                                p: 2,
                                mb: 1.5,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.custom.border.light}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            {/* Thumbnail */}
                            <Avatar
                                variant="rounded"
                                src={file.preview} // URL.createObjectURL(file)
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 1,
                                    bgcolor: theme.palette.grey[100],
                                }}
                            />
                            {/* Info */}

                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                                    {file.name}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                    {formatFileSize(file.size)}
                                </Typography>
                            </Box>

                            {/* Remove */}
                            <IconButton
                                size="small"
                                onClick={() => handleRemoveFile(index)}
                                sx={{ color: theme.palette.custom.status.error.main }}
                            >
                                <Delete />
                            </IconButton>
                        </Paper>
                    ))}
                </Box>
            )}

            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.custom.status.info.light,
                }}
            >
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.info.main, mb: 1 }}>
                    Required Documents:
                </Typography>
                <Typography
                    component="ul"
                    sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], m: 0, pl: 2 }}
                >
                    <li>Business Registration Certificate</li>
                    <li>Owner's ID Card (front and back)</li>
                    <li>Tax Registration Certificate (if applicable)</li>
                    <li>Bank Account Verification</li>
                </Typography>
            </Box>
        </Box>
    );
}

export default CreateFrameVariantPage
export { UploadArea };
