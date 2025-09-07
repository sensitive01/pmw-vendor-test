'use client'
import { useRouter } from 'next/navigation'; 
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import {
  Box,
  Step,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Collapse,
  InputAdornment,
  CircularProgress,
  Switch,
  FormGroup,
} from '@mui/material'
import MuiStepper from '@mui/material/Stepper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import StepLabel from '@mui/material/StepLabel'
import {
  DirectionsCarFilled,
  TwoWheeler,
  LocalShipping,
  AccessTime,
  CalendarMonth,
  AutorenewRounded,
  Close as CloseIcon,
  Check as CheckIcon,
  KeyboardArrowRight,
  Assignment,
  ScheduleOutlined,
  WatchLater
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

// Component Imports
import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'
import DirectionalIcon from '@components/DirectionalIcon'
import { createBookingNotification, showNotification } from '@/utils/requestNotificationPermission'

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),
  background: '#ffffff',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  overflow: 'hidden'
}))

const Stepper = styled(MuiStepper)(({ theme }) => ({
  justifyContent: 'center',
  '& .MuiStep-root': {
    '&:first-of-type': {
      paddingInlineStart: 0
    },
    '&:last-of-type': {
      paddingInlineEnd: 0
    },
    [theme.breakpoints.down('md')]: {
      paddingInline: 0
    }
  }
}))

const OptionCard = styled(Paper)(({ selected }) => ({
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  border: selected ? '1px solid #1976d2' : '1px solid #e0e0e0',
  backgroundColor: selected ? '#f5f9ff' : '#ffffff',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected ? '#f5f9ff' : '#f8f8f8',
    transform: 'translateY(-2px)'
  }
}))

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 20,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main
}))

const BookingTypeToggle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: '48px',
  border: '1px solid #e0e0e0',
  background: '#f8f8f8',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 120,
  height: 34,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(86px)',
      color: '#ff0000',
      '& + .MuiSwitch-track': {
        backgroundColor: '#4caf50',
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 30,
    height: 30,
    backgroundColor: props => props.checked ? '#ff0000' : '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& svg': {
      fontSize: '20px',
      color: props => props.checked ? 'white' : '#757575'
    }
  },
  '& .MuiSwitch-track': {
    borderRadius: 34 / 2,
    backgroundColor: theme.palette.mode === 'light' ? '#4caf50' : '#39393D',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}))

const steps = [
  {
    title: 'Vehicle Type',
  },
  {
    title: 'Booking Details',
  },
  {
    title: 'Personal Info',
  }
]

export default function ParkingBooking() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession()
  const vendorId = session?.user?.id
  const [activeStep, setActiveStep] = useState(0)
  const [vehicleType, setVehicleType] = useState('Car')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [sts, setSts] = useState('Subscription') // Only Subscription now
  const [parkingDate, setParkingDate] = useState('')
  const [parkingTime, setParkingTime] = useState('')
  const [tentativeCheckout, setTentativeCheckout] = useState('')
  const [carType, setCarType] = useState('')
  const [personName, setPersonName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [subscriptionType, setSubscriptionType] = useState('Monthly')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' })
  const [errors, setErrors] = useState({})
  const [bookType, setBookType] = useState('Hourly')
  const [is24Hours, setIs24Hours] = useState(false)
  const [minDate, setMinDate] = useState('')
  const [minTime, setMinTime] = useState('')
  const [minTentativeDateTime, setMinTentativeDateTime] = useState('')
  const timerRef = useRef(null)
  const router = useRouter();

  const formatToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTimeTo12Hour = (time24h) => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const updateCurrentDateTime = () => {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    setParkingDate(dateString);
    setParkingTime(timeString);
    setMinDate(dateString);
    setMinTime(timeString);

    return { dateString, timeString };
  };

  useEffect(() => {
    updateCurrentDateTime();

    timerRef.current = setInterval(() => {
      const { dateString, timeString } = updateCurrentDateTime();
      updateMinTentativeDateTime(dateString, timeString);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    updateMinTentativeDateTime();
  }, [parkingDate, parkingTime]);

  const updateMinTentativeDateTime = (date = parkingDate, time = parkingTime) => {
    if (!date || !time) return;

    const dateTimeString = `${date}T${time}`;
    setMinTentativeDateTime(dateTimeString);

    if (tentativeCheckout && tentativeCheckout < dateTimeString) {
      setTentativeCheckout(dateTimeString);
    }
  };

  const validate = () => {
    const newErrors = {};

    switch (activeStep) {
      case 0:
        if (!vehicleType) newErrors.vehicleType = 'Please select a vehicle type';
        break;
      case 1:
        if (!vehicleNumber) newErrors.vehicleNumber = 'Vehicle number is required';
        if (!parkingDate) newErrors.parkingDate = 'Parking date is required';
        if (!parkingTime) newErrors.parkingTime = 'Parking time is required';
        break;
      case 2:
        if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
          newErrors.mobileNumber = 'Enter a valid 10-digit number';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const formattedDate = formatToDDMMYYYY(parkingDate);
      const formattedTime = formatTimeTo12Hour(parkingTime);
      const formattedBookingDate = formatToDDMMYYYY(new Date().toISOString());
      const formattedBookingTime = formatTimeTo12Hour(new Date().toTimeString().substring(0, 5));

      const status = 'PENDING';

      const payload = {
        vendorId,
        personName,
        mobileNumber,
        vehicleType,
        carType: vehicleType === 'Car' ? carType : '',
        vehicleNumber,
        bookingDate: formattedBookingDate,
        bookingTime: formattedBookingTime,
        parkedDate: formattedDate,
        parkedTime: formattedTime,
        parkingDate: formattedDate,
        parkingTime: formattedTime,
        tenditivecheckout: tentativeCheckout ? formatToDDMMYYYY(tentativeCheckout.split('T')[0]) + ' ' + formatTimeTo12Hour(tentativeCheckout.split('T')[1]) : '',
        subsctiptiontype: subscriptionType,
        status,
        sts,
        bookType: ''
      };

      const response = await axios.post(`${API_URL}/vendor/createbooking`, payload);

      showNotification('New Booking Created', {
        body: `${vehicleType} booking for ${vehicleNumber} created successfully`,
        tag: 'new-booking'
      });

      createBookingNotification({
        vehicleType,
        vehicleNumber,
        personName,
        status
      });

      setAlert({
        show: true,
        message: 'Booking created successfully!',
        type: 'success'
      });

      setTimeout(() => {
        setActiveStep(0);
        setVehicleType('Car');
        setVehicleNumber('');
        setSts('Subscription');
        setPersonName('');
        setMobileNumber('');
        setBookType('Hourly');
        setIs24Hours(false);
        setTentativeCheckout('');
        setSubscriptionType('Monthly');
        updateCurrentDateTime();
        router.push('/pages/subscriptionbooking');
      }, 1000);
    } catch (error) {
      setAlert({
        show: true,
        message: 'Failed to create booking. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookTypeChange = (event) => {
    const checked = event.target.checked;
    setIs24Hours(checked);
    setBookType(checked ? '24 Hours' : 'Hourly');
  };

  const handleVehicleNumberChange = (e) => {
    setVehicleNumber(e.target.value.toUpperCase());
  };

  const handleParkingDateChange = (e) => {
    const selectedDate = e.target.value;
    setParkingDate(selectedDate);

    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setMinTime(`${hours}:${minutes}`);
      if (parkingTime < `${hours}:${minutes}`) {
        setParkingTime(`${hours}:${minutes}`);
      }
    } else {
      setMinTime('00:00');
    }
  };

  const handleParkingTimeChange = (e) => {
    const selectedTime = e.target.value;

    const today = new Date().toISOString().split('T')[0];
    if (parkingDate === today && selectedTime < minTime) {
      setAlert({
        show: true,
        message: 'You cannot select a past time',
        type: 'error'
      });
      return;
    }

    setParkingTime(selectedTime);
  };

  const renderVehicleTypeStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom style={{ marginTop: '20px', marginBottom: '20px' }}>
        Vehicle Type
      </Typography>
      <Grid container spacing={2}>
        {[
          { value: 'Car', label: 'Car', icon: DirectionsCarFilled },
          { value: 'Bike', label: 'Bikes', icon: TwoWheeler },
          { value: 'Others', label: 'Other', icon: LocalShipping }
        ].map((option) => (
          <Grid item xs={12} sm={4} key={option.value}>
            <OptionCard
              selected={vehicleType === option.value}
              onClick={() => setVehicleType(option.value)}
              elevation={vehicleType === option.value ? 2 : 1}
            >
              <IconWrapper>
                <option.icon color="#ffe32a" />
              </IconWrapper>
              <Typography variant="subtitle1">{option.label}</Typography>
              {vehicleType === option.value && (
                <CheckIcon color="primary" sx={{ ml: 'auto' }} />
              )}
            </OptionCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderBookingDetailsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom style={{ marginTop: '20px', marginBottom: '20px' }}>
        Booking Details
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>
            Subscription Booking
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Vehicle Number"
            value={vehicleNumber}
            onChange={handleVehicleNumberChange}
            error={!!errors.vehicleNumber}
            helperText={errors.vehicleNumber}
            placeholder="Enter vehicle number"
            inputProps={{
              style: { textTransform: 'uppercase' }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Subscription Type</InputLabel>
            <Select
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              label="Subscription Type"
            >
              <MenuItem value="Monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {vehicleType === 'Car' && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Car Type"
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              placeholder="e.g. Sedan, SUV"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Parking Date"
            type="date"
            value={parkingDate}
            onChange={handleParkingDateChange}
            error={!!errors.parkingDate}
            helperText={errors.parkingDate}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: minDate
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Parking Time"
            type="time"
            value={parkingTime}
            onChange={handleParkingTimeChange}
            error={!!errors.parkingTime}
            helperText={errors.parkingTime}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: (parkingDate === minDate) ? minTime : undefined
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Tentative Checkout"
            type="datetime-local"
            value={tentativeCheckout}
            onChange={(e) => setTentativeCheckout(e.target.value)}
            error={!!errors.tentativeCheckout}
            helperText={errors.tentativeCheckout}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: minTentativeDateTime
            }}
          />
        </Grid>
      </Grid>
    </Box>
  )

  const renderPersonalInfoStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom style={{ marginTop: '20px', marginBottom: '20px' }}>
        Personal Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Enter your full name"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Mobile Number"
            value={mobileNumber}
            onChange={(e) => {
              const input = e.target.value;
              if (/^\d{0,10}$/.test(input)) {
                setMobileNumber(input);
              }
            }}
            error={!!errors.mobileNumber}
            helperText={errors.mobileNumber}
            placeholder="Enter your mobile number"
            InputProps={{
              startAdornment: <InputAdornment position="start">+91</InputAdornment>,
              inputMode: 'numeric'
            }}
          />
        </Grid>
      </Grid>
    </Box>
  )

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderVehicleTypeStep()
      case 1:
        return renderBookingDetailsStep()
      case 2:
        return renderPersonalInfoStep()
      default:
        return null
    }
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
          Subscription Booking
        </Typography>
      </Box>
      <Card>
        <CardContent>
          <StepperWrapper>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={index}>
                  <StepLabel
                    slots={{
                      stepIcon: StepperCustomDot
                    }}
                    StepIconComponent={StepperCustomDot}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Typography className="step-number">{`0${index + 1}`}</Typography>
                      <Typography className="step-title">{label.title}</Typography>
                    </div>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </StepperWrapper>
          <Divider style={{ marginLeft: '-20px', marginRight: '-20px', marginTop: '20px' }} />
          <Collapse in={alert.show}>
            <Alert
              severity={alert.type}
              action={
                <IconButton
                  size="small"
                  onClick={() => setAlert({ ...alert, show: false })}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              {alert.message}
            </Alert>
          </Collapse>
          {getStepContent(activeStep)}
          <Divider style={{ marginLeft: '-20px', marginRight: '-20px', marginTop: '40px' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 10 }}>
            <>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                color='secondary'
                startIcon={<DirectionalIcon ltrIconClass='ri-arrow-left-line' rtlIconClass='ri-arrow-right-line' />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                type='submit'
                endIcon={loading ? <CircularProgress size={20} /> : <DirectionalIcon ltrIconClass='ri-arrow-right-line' rtlIconClass='ri-arrow-left-line' />}
                disabled={loading}
              >
                {activeStep === steps.length - 1 ? 'Complete Booking' : 'Next'}
              </Button>
            </>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
