import { motion } from 'framer-motion';
import { Upload, RotateCcw, ZoomIn, ZoomOut, Move3D, Box, Lightbulb } from 'lucide-react';
import { Suspense, useState, useCallback, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  Box as MuiBox,
  Button,
  Typography,
  Container,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Components
const GlassCard = styled(Paper)({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 16,
  padding: '24px',
});

const GradientText = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 700,
}));

const UploadZone = styled(MuiBox)(({ theme }) => ({
  padding: theme.spacing(6),
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

const ControlButton = styled(MuiBox)(({ theme, active }: { theme?: any; active: boolean }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'all 0.3s ease',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.2) : theme.palette.action.hover,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
}));

const InstructionChip = styled(Chip)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  background: alpha(theme.palette.background.paper, 0.8),
  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
}));

// 3D Model Components
interface ModelProps {
  url: string;
  autoRotate: boolean;
}

const Model = ({ url, autoRotate }: ModelProps) => {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.5;
    }
  });

  // Center and scale the model
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2 / maxDim;

  scene.position.sub(center);
  scene.scale.setScalar(scale);

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
    </group>
  );
};

const LoadingSpinner = () => (
  <mesh>
    <boxGeometry args={[0.5, 0.5, 0.5]} />
    <meshStandardMaterial color="#D4AF37" wireframe />
  </mesh>
);

const DefaultModel = ({ autoRotate }: { autoRotate: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      {/* Glasses Frame */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        {/* Left Lens */}
        <mesh position={[-0.6, 0, 0]}>
          <torusGeometry args={[0.35, 0.05, 16, 32]} />
          <meshStandardMaterial color="#C4A052" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Right Lens */}
        <mesh position={[0.6, 0, 0]}>
          <torusGeometry args={[0.35, 0.05, 16, 32]} />
          <meshStandardMaterial color="#C4A052" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Bridge */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
          <meshStandardMaterial color="#C4A052" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Left Temple */}
        <mesh position={[-1.1, 0, 0.3]} rotation={[0, Math.PI / 2 + 0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.2, 16]} />
          <meshStandardMaterial color="#C4A052" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Right Temple */}
        <mesh position={[1.1, 0, 0.3]} rotation={[0, -Math.PI / 2 - 0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.2, 16]} />
          <meshStandardMaterial color="#C4A052" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Lens Glass - Left */}
        <mesh position={[-0.6, 0, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.2}
            metalness={0.1}
            roughness={0}
          />
        </mesh>

        {/* Lens Glass - Right */}
        <mesh position={[0.6, 0, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.2}
            metalness={0.1}
            roughness={0}
          />
        </mesh>
      </mesh>
    </group>
  );
};

const ThreeDViewer = () => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetModel = useCallback(() => {
    if (modelUrl) {
      URL.revokeObjectURL(modelUrl);
    }
    setModelUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [modelUrl]);

  return (
    <MuiBox component="section" id="3d-viewer" sx={{ py: 12, position: 'relative' }}>
      <MuiBox
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.05), transparent)',
          opacity: 0.5,
        }}
      />

      <Container
        maxWidth={false}
        sx={{
          maxWidth: "1600px",
          mx: "auto",
          position: "relative",
          zIndex: 10
        }}
      >
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <MuiBox textAlign="center" mb={6}>
            <Typography variant="h2" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
              Xem Mô Hình <GradientText variant="h2">3D</GradientText>
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth="800px" mx="auto">
              Upload file .glb hoặc .gltf để xem mô hình 3D kính của bạn. Di chuyển chuột để xoay và zoom.
            </Typography>
          </MuiBox>
        </motion.div> */}

        <Grid container spacing={4}>
          {/* 3D Canvas */}
          <Grid size={{ xs: 12, lg: 12 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <GlassCard
                elevation={3}
                sx={{
                  position: 'relative',
                  aspectRatio: '16/9',
                  overflow: 'hidden',
                  border: isDragging ? 2 : 1,
                  borderColor: isDragging ? 'primary.main' : 'divider',
                  transition: 'all 0.3s ease',
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Canvas
                  camera={{ position: [0, 0, 4], fov: 40 }}
                  style={{
                    background: 'linear-gradient(to bottom right, rgba(18, 18, 18, 1), rgba(10, 10, 10, 1))'
                  }}
                >
                  <ambientLight intensity={0.5} />
                  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} />

                  <Suspense fallback={<LoadingSpinner />}>
                    <PresentationControls
                      global
                      zoom={0.8}
                      rotation={[0, 0, 0]}
                      polar={[-Math.PI / 4, Math.PI / 4]}
                      azimuth={[-Math.PI / 4, Math.PI / 4]}
                    >
                      {modelUrl ? (
                        <Model url={modelUrl} autoRotate={autoRotate} />
                      ) : (
                        <DefaultModel autoRotate={autoRotate} />
                      )}
                    </PresentationControls>
                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} />
                    <Environment preset="studio" />
                  </Suspense>

                  <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    autoRotate={false}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 4}
                  />
                </Canvas>

                {/* Instructions Overlay */}
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                  }}
                >
                  <InstructionChip
                    icon={<Move3D size={16} />}
                    label="Kéo để xoay"
                    size="small"
                  />
                  <InstructionChip
                    icon={<ZoomIn size={16} />}
                    label="Cuộn để zoom"
                    size="small"
                  />
                </Stack>
              </GlassCard>
            </motion.div>
          </Grid>


        </Grid>

        {/* Controls Panel */}
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {/* Upload Section */}
              <GlassCard>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Upload size={20} color="#D4AF37" />
                  <Typography variant="h6" fontWeight={600}>
                    Upload Mô Hình
                  </Typography>
                </Stack>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="model-upload"
                />

                <label htmlFor="model-upload">
                  <UploadZone>
                    <Box size={32} style={{ margin: '0 auto 8px', color: '#999' }} />
                    <Typography variant="body2" color="text.secondary">
                      Kéo thả hoặc click để upload
                    </Typography>
                    <Typography variant="caption" color="text.secondary" mt={0.5}>
                      .glb, .gltf
                    </Typography>
                  </UploadZone>
                </label>

                {modelUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={resetModel}
                    startIcon={<RotateCcw size={16} />}
                    sx={{ mt: 2 }}
                  >
                    Xóa Mô Hình
                  </Button>
                )}
              </GlassCard>

              {/* View Controls */}
              <Grid size={{ xs: 12, lg: 12 }}>
                <GlassCard>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Lightbulb size={20} color="#D4AF37" />
                    <Typography variant="h6" fontWeight={600}>
                      Điều Khiển
                    </Typography>
                  </Stack>

                  <ControlButton active={autoRotate}>
                    <Typography variant="body2" fontWeight={500}>
                      Tự động xoay
                    </Typography>
                    <Switch
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                      size="small"
                    />
                  </ControlButton>
                </GlassCard>
              </Grid>

            </motion.div>
          </Grid>
        </Grid>

      </Container>
    </MuiBox>
  );
};

export default ThreeDViewer;