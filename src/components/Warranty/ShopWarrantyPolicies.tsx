import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Divider, CircularProgress } from '@mui/material';
import { Shield, AccessTime } from '@mui/icons-material';
import { warrantyApi, type WarrantyPolicyResponse } from '@/api/warranty-api';

interface ShopWarrantyPoliciesProps {
  shopId: string;
  shopName?: string;
}

const ShopWarrantyPolicies: React.FC<ShopWarrantyPoliciesProps> = ({ shopId, shopName }) => {
  const [policies, setPolicies] = useState<WarrantyPolicyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    warrantyApi.getShopPolicies(shopId)
      .then(res => setPolicies((res.data || []).filter(p => p.isActive)))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (policies.length === 0) return null;

  return (
    <Box>
      {shopName && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Shield sx={{ fontSize: 16, color: '#667eea' }} />
          {shopName}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {policies.map(policy => (
          <Box
            key={policy.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: policy.isDefault ? '#c7d2fe' : '#e5e7eb',
              bgcolor: policy.isDefault ? '#eef2ff' : '#f9fafb',
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                {policy.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                {policy.isDefault && (
                  <Chip label="Default" size="small" sx={{ bgcolor: '#667eea', color: '#fff', fontSize: 11, height: 20 }} />
                )}
                <Chip
                  icon={<AccessTime sx={{ fontSize: 12 }} />}
                  label={`${policy.durationMonths} months`}
                  size="small"
                  sx={{ fontSize: 11, height: 20, bgcolor: '#f3f4f6', color: '#374151' }}
                />
              </Box>
            </Box>

            {policy.coverageDescription && (
              <Typography sx={{ fontSize: 13, color: '#4b5563', mb: policy.excludedIssues.length > 0 ? 1 : 0 }}>
                {policy.coverageDescription}
              </Typography>
            )}

            {policy.excludedIssues.length > 0 && (
              <>
                <Divider sx={{ my: 0.75 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6b7280', mb: 0.5 }}>
                  Not covered:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {policy.excludedIssues.map((issue, i) => (
                    <Chip
                      key={i}
                      label={issue}
                      size="small"
                      sx={{ fontSize: 11, height: 20, bgcolor: '#00838f', color: '#ffffff' }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ShopWarrantyPolicies;
