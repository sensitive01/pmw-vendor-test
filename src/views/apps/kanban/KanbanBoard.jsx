'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, Paper, Fade, Grow, Tabs, Tab,
  useMediaQuery, useTheme, CircularProgress, Chip, Switch, FormControlLabel,
  Grid, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon, Edit as EditIcon, Save as SaveIcon,
  Close as CloseIcon, AccessTime as ClockIcon,
  DirectionsCar as CarIcon,
  TwoWheeler as BikeIcon,
  Category as OthersIcon,
  Schedule as ScheduleIcon,
  DateRange as CalendarIcon,
  Timelapse as TimelapseIcon
} from '@mui/icons-material';

const categories = ['Car', 'Bike', 'Others'];
const labels = ['Minimum Charges', 'Additional Hour', 'Full Day', 'Monthly'];

const typesByLabel = {
  'Minimum Charges': ['0 to 1 hour', '0 to 2 hours', '0 to 3 hours', '0 to 4 hours'],
  'Additional Hour': ['Additional 1 hour', 'Additional 2 hours', 'Additional 3 hours', 'Additional 4 hours'],
  'Full Day': ['Full day'], // Only 'Full day' option regardless of mode
  'Monthly': ['Monthly'],
};

const getCategoryIcon = (category) => {
  switch(category) {
    case 'Car': return <CarIcon />;
    case 'Bike': return <BikeIcon />;
    case 'Others': return <OthersIcon />;
    default: return null;
  }
};

// Styled components
const KanbanColumn = styled(Paper)(({ theme }) => ({
  height: '100%',
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    transform: 'none',
    '&:hover': {
      transform: 'none',
    },
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[8],
  },
  [theme.breakpoints.down('sm')]: {
    '&:hover': {
      transform: 'scale(1.01)',
    },
  },
}));

const RateDisplay = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
  transform: 'translateZ(0)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.05)',
    backgroundColor: theme.palette.primary.main,
    '& .MuiTypography-root': {
      color: theme.palette.primary.contrastText,
    },
  },
  [theme.breakpoints.down('sm')]: {
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
}));

const SectionToggle = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: theme.shadows[1],
}));

const getChargeIdForNewEntry = (category, label) => {
  // Simple mapping to assign single letter IDs like the backend expects
  const idMap = {
    'Car-Minimum Charges': 'A',
    'Car-Additional Hour': 'B',
    'Car-Full Day': 'C',
    'Car-Monthly': 'D',
    'Bike-Minimum Charges': 'E',
    'Bike-Additional Hour': 'F',
    'Bike-Full Day': 'G',
    'Bike-Monthly': 'H',
    'Others-Minimum Charges': 'I',
    'Others-Additional Hour': 'J',
    'Others-Full Day': 'K',
    'Others-Monthly': 'L'
  };
  
  const key = `${category}-${label}`;
  return idMap[key] || key.substring(0, 1).toUpperCase(); // Fallback to first letter capitalized
};

const ParkingChargesKanban = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const theme = useTheme();
  const [charges, setCharges] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editStates, setEditStates] = useState({});
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const [vendorExists, setVendorExists] = useState(false);
  
  // Enable/disable toggles with default values
  const [enableToggles, setEnableToggles] = useState({
    carEnabled: false,
    bikeEnabled: false,
    othersEnabled: false,
    carTemporary: false,
    bikeTemporary: false,
    othersTemporary: false,
    carFullDay: false,
    bikeFullDay: false,
    othersFullDay: false,
    carMonthly: false,
    bikeMonthly: false,
    othersMonthly: false,
  });
  
  // Full day modes with default values
  const [fullDayModes, setFullDayModes] = useState({
    car: 'Full Day',
    bike: 'Full Day',
    others: 'Full Day'
  });

  const vendorId = session?.user?.id;

  useEffect(() => {
    if (vendorId) {
      checkVendorExists();
    }
  }, [vendorId]);

  const checkVendorExists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/vendor/getchargesdata/${vendorId}`);
      
      if (response.data && response.data.vendor) {
        setVendorExists(true);
        const { vendor } = response.data;
        const chargesMap = {};

        vendor.charges.forEach(charge => {
          let label;
          const typeLC = charge.type.toLowerCase();
          
          if (typeLC.includes('additional')) {
            label = 'Additional Hour';
          } else if (typeLC.includes('full day') || typeLC.includes('24 hour')) {
            label = 'Full Day';
          } else if (typeLC.includes('monthly')) {
            label = 'Monthly';
          } else {
            label = 'Minimum Charges';
          }

          const key = `${charge.category}-${label}`;
          chargesMap[key] = {
            ...charge,
            label
          };
        });
        
        setCharges(chargesMap);

        // Set enable/disable toggles from backend data
        setEnableToggles({
          carEnabled: vendor.carenable === "true",
          bikeEnabled: vendor.bikeenable === "true",
          othersEnabled: vendor.othersenable === "true",
          carTemporary: vendor.cartemp === "true",
          bikeTemporary: vendor.biketemp === "true",
          othersTemporary: vendor.otherstemp === "true",
          carFullDay: vendor.carfullday === "true",
          bikeFullDay: vendor.bikefullday === "true",
          othersFullDay: vendor.othersfullday === "true",
          carMonthly: vendor.carmonthly === "true",
          bikeMonthly: vendor.bikemonthly === "true",
          othersMonthly: vendor.othersmonthly === "true",
        });
        
        // Get full day modes
        fetchFullDayModes();
      } else {
        // Vendor doesn't exist in the Parking collection yet
        setVendorExists(false);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setVendorExists(false);
        console.log("Vendor not found in parking collection, need to initialize first");
      } else {
        console.error('Error checking vendor:', err);
        setError(`Failed to load data: ${err.message}`);
        setTimeout(() => setError(''), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeVendor = async () => {
    try {
      setLoading(true);
      
      // First, create a default parking entry
      const defaultPayload = {
        vendorid: vendorId,
        charges: [] // Empty charges
      };
      
      // Initialize with default settings
      await axios.post(`${API_URL}/vendor/addparkingcharges`, defaultPayload);
      
      // Set default toggle states
      const defaultToggles = {
        carEnabled: false,
        bikeEnabled: false,
        othersEnabled: false,
        carTemporary: false,
        bikeTemporary: false,
        othersTemporary: false,
        carFullDay: false,
        bikeFullDay: false,
        othersFullDay: false,
        carMonthly: false,
        bikeMonthly: false,
        othersMonthly: false,
      };
      
      // Update the enable states
      await axios.put(
        `${API_URL}/vendor/updateenable/${vendorId}`,
        defaultToggles
      );
      
      setVendorExists(true);
      setEnableToggles(defaultToggles);
      
      setSuccess("Vendor initialized successfully!");
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error initializing vendor:', err);
      setError(`Failed to initialize vendor: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharges = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendor/getchargesdata/${vendorId}`);
      
      if (!response.data || !response.data.vendor) {
        setCharges({});
        return;
      }
      
      const { vendor } = response.data;
      const chargesMap = {};

      vendor.charges.forEach(charge => {
        let label;
        const typeLC = charge.type.toLowerCase();
        
        if (typeLC.includes('additional')) {
          label = 'Additional Hour';
        } else if (typeLC.includes('full day') || typeLC.includes('24 hour')) {
          label = 'Full Day';
        } else if (typeLC.includes('monthly')) {
          label = 'Monthly';
        } else {
          label = 'Minimum Charges';
        }

        const key = `${charge.category}-${label}`;
        chargesMap[key] = {
          ...charge,
          label
        };
      });
      
      setCharges(chargesMap);
    } catch (err) {
      console.error('Error fetching charges:', err);
      if (err.response && err.response.status !== 404) {
        setError(`Failed to load charges data: ${err.message}`);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const fetchFullDayModes = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendor/getfullday/${vendorId}`);
      if (response.data && response.data.data) {
        setFullDayModes({
          car: response.data.data.fulldaycar || 'Full Day',
          bike: response.data.data.fulldaybike || 'Full Day',
          others: response.data.data.fulldayothers || 'Full Day'
        });
      }
    } catch (err) {
      console.error('Error fetching full day modes:', err);
      if (err.response && err.response.status !== 404) {
        setError(`Failed to load full day modes: ${err.message}`);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const updateEnabledVehicles = async (category, field, value) => {
    try {
      if (!vendorExists) {
        await initializeVendor();
      }
      
      const payload = {
        ...enableToggles,
        [field]: value,
      };

      await axios.put(
        `${API_URL}/vendor/updateenable/${vendorId}`,
        payload
      );

      setSuccess(`${category} ${field} updated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating enabled vehicles:', err);
      setError(`Failed to update ${category} ${field}: ${err.message}`);
      setTimeout(() => setError(''), 5000);
      
      // Revert the toggle state
      setEnableToggles(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    }
  };

  const updateFullDayMode = async (vehicleType, mode) => {
    try {
      if (!vendorExists) {
        await initializeVendor();
      }
      
      // Fix: Updated the endpoint URL to match the backend route
      // The backend has "upadatefullday" instead of "updatefullday"
      const endpoint = `upadatefullday${vehicleType}`;
      
      // Create the proper payload based on vehicle type
      const payload = {};
      payload[`fullday${vehicleType}`] = mode;
      
      // Make the API call with the corrected endpoint and proper payload
      await axios.put(
        `${API_URL}/vendor/${endpoint}/${vendorId}`,
        payload
      );
      
      // Update local state
      setFullDayModes(prev => ({
        ...prev,
        [vehicleType]: mode
      }));
      
      setSuccess(`${vehicleType} full day mode updated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(`Error updating ${vehicleType} full day mode:`, err);
      setError(`Failed to update ${vehicleType} full day mode: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSave = async (category, label, type, amount) => {
    try {
      if (!type || !amount) {
        throw new Error('Please enter both type and amount');
      }

      if (!vendorExists) {
        await initializeVendor();
      }

      const existingCharge = charges[`${category}-${label}`];
      const chargeid = existingCharge?.chargeid || getChargeIdForNewEntry(category, label);

      const payload = {
        vendorid: vendorId,
        charges: [{
          type,
          amount,
          category,
          chargeid
        }]
      };

      await axios.post(`${API_URL}/vendor/addparkingcharges`, payload);
      await fetchCharges();
      
      setEditStates(prev => ({
        ...prev,
        [`${category}-${label}`]: false
      }));
      
      setSuccess('Charge saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save charges');
      setTimeout(() => setError(''), 5000);
    }
  };

  const ChargeCard = ({ category, label }) => {
    const [formData, setFormData] = useState({
      type: charges[`${category}-${label}`]?.type || '',
      amount: charges[`${category}-${label}`]?.amount || ''
    });

    useEffect(() => {
      setFormData({
        type: charges[`${category}-${label}`]?.type || '',
        amount: charges[`${category}-${label}`]?.amount || ''
      });
    }, [charges, category, label]);
    
    const isEditing = editStates[`${category}-${label}`];
    const hasValue = `${category}-${label}` in charges;
    const charge = charges[`${category}-${label}`];

    // Get type options based on label
    const typeOptions = typesByLabel[label];

    const handleTypeChange = (e) => {
      setFormData({ ...formData, type: e.target.value });
    };

    const handleAmountChange = (e) => {
      setFormData({ ...formData, amount: e.target.value });
    };

    return (
      <Grow in={true} timeout={300}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {label}
            </Typography>
            <Fade in={true} timeout={500}>
              <Box>
                {isEditing ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Duration</InputLabel>
                      <Select
                        value={formData.type}
                        onChange={handleTypeChange}
                        label="Duration"
                        startAdornment={<ClockIcon sx={{ mr: 1 }} />}
                      >
                        {typeOptions.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleAmountChange}
                      InputProps={{
                        startAdornment: '₹',
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          setEditStates(prev => ({
                            ...prev,
                            [`${category}-${label}`]: false
                          }));
                          setFormData({
                            type: charge?.type || '',
                            amount: charge?.amount || ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(category, label, formData.type, formData.amount)}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : hasValue ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <RateDisplay>
                      <Typography variant="h4" color="primary.main" gutterBottom>
                        ₹{charge.amount}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClockIcon sx={{ mr: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                          {charge.type}
                        </Typography>
                      </Box>
                    </RateDisplay>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setEditStates(prev => ({
                        ...prev,
                        [`${category}-${label}`]: true
                      }))}
                    >
                      Edit Rate
                    </Button>
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setEditStates(prev => ({
                      ...prev,
                      [`${category}-${label}`]: true
                    }))}
                  >
                    Set Rate
                  </Button>
                )}
              </Box>
            </Fade>
          </CardContent>
        </StyledCard>
      </Grow>
    );
  };

  const CategorySection = ({ category }) => {
    const vehicleType = category.toLowerCase();
    const currentMode = fullDayModes[vehicleType];
    const categoryEnabled = enableToggles[`${vehicleType}Enabled`];

    const handleCategoryToggle = async () => {
      const field = `${vehicleType}Enabled`;
      const newValue = !enableToggles[field];
      
      setEnableToggles(prev => ({
        ...prev,
        [field]: newValue
      }));
      
      await updateEnabledVehicles(category, field, newValue);
    };

    const handleSectionToggle = async (section) => {
      const field = `${vehicleType}${section}`;
      const newValue = !enableToggles[field];
      
      setEnableToggles(prev => ({
        ...prev,
        [field]: newValue
      }));
      
      await updateEnabledVehicles(category, field, newValue);
    };

    return (
      <Box sx={{ mb: 4 }}>
        <SectionToggle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getCategoryIcon(category)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {category}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch 
                checked={categoryEnabled}
                onChange={handleCategoryToggle}
              />
            }
            label={categoryEnabled ? "On" : "Off"}
          />
        </SectionToggle>
        
        {categoryEnabled && (
          <Box sx={{ pl: 3, pt: 1 }}>
            <SectionToggle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon />
                <Typography variant="subtitle1" sx={{ ml: 1 }}>
                  Temporary
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch 
                    checked={enableToggles[`${vehicleType}Temporary`]}
                    onChange={() => handleSectionToggle('Temporary')}
                  />
                }
                label={enableToggles[`${vehicleType}Temporary`] ? "On" : "Off"}
              />
            </SectionToggle>
            
            {enableToggles[`${vehicleType}Temporary`] && (
              <Box sx={{ pl: 3, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <ChargeCard category={category} label="Minimum Charges" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <ChargeCard category={category} label="Additional Hour" />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <SectionToggle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelapseIcon />
                <Typography variant="subtitle1" sx={{ ml: 1 }}>
                  Full Day
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch 
                    checked={enableToggles[`${vehicleType}FullDay`]}
                    onChange={() => handleSectionToggle('FullDay')}
                  />
                }
                label={enableToggles[`${vehicleType}FullDay`] ? "On" : "Off"}
              />
            </SectionToggle>
            
            {enableToggles[`${vehicleType}FullDay`] && (
              <Box sx={{ pl: 3, mb: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Full Day Mode:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={currentMode === '24 Hours' ? 'contained' : 'outlined'}
                      onClick={() => updateFullDayMode(vehicleType, '24 Hours')}
                    >
                      24 Hours
                    </Button>
                    <Button
                      variant={currentMode === 'Full Day' ? 'contained' : 'outlined'}
                      onClick={() => updateFullDayMode(vehicleType, 'Full Day')}
                    >
                      Full Day
                    </Button>
                  </Box>
                </Box>
                {/* Only show one ChargeCard for Full Day regardless of selected mode */}
                <ChargeCard category={category} label="Full Day" />
              </Box>
            )}
            
            <SectionToggle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon />
                <Typography variant="subtitle1" sx={{ ml: 1 }}>
                  Monthly
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch 
                    checked={enableToggles[`${vehicleType}Monthly`]}
                    onChange={() => handleSectionToggle('Monthly')}
                  />
                }
                label={enableToggles[`${vehicleType}Monthly`] ? "On" : "Off"}
              />
            </SectionToggle>
            
            {enableToggles[`${vehicleType}Monthly`] && (
              <Box sx={{ pl: 3, mb: 2 }}>
                <ChargeCard category={category} label="Monthly" />
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderInitializationPrompt = () => {
    return (
      <Box sx={{ textAlign: 'center', p: 4, my: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Parking charges data needs to be initialized before you can configure rates
        </Alert>
        <Button 
          variant="contained" 
          size="large"
          onClick={initializeVendor}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Initialize Parking Charges'}
        </Button>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Parking Charges Management
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
      </Box>
      
      {!vendorExists ? (
        renderInitializationPrompt()
      ) : (
        <Box sx={{ width: '100%' }}>
          {categories.map((category) => (
            <CategorySection key={category} category={category} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ParkingChargesKanban;
