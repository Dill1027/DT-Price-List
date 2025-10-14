import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Deep Tec. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Contact
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;