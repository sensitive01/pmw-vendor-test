'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'
import {
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Divider,
  Card,
  CardContent,
  Stack,
  Grid
} from '@mui/material'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const ParkedTimer = ({ parkedDate, parkedTime }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  useEffect(() => {
    if (!parkedDate || !parkedTime) {
      setElapsedTime('00:00:00')

      return
    }

    try {
      const [day, month, year] = parkedDate.split('-')
      const [timePart, ampm] = parkedTime.split(' ')
      let [hours, minutes] = timePart.split(':').map(Number)

      if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12
      } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0
      }

      const parkingStartTime = new Date(
        `${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
      )

      const timer = setInterval(() => {
        const now = new Date()
        const diffMs = now - parkingStartTime
        const diffSecs = Math.floor(diffMs / 1000)
        const hours = Math.floor(diffSecs / 3600)
        const minutes = Math.floor((diffSecs % 3600) / 60)
        const seconds = diffSecs % 60
        const formattedHours = hours.toString().padStart(2, '0')
        const formattedMinutes = minutes.toString().padStart(2, '0')
        const formattedSeconds = seconds.toString().padStart(2, '0')

        setElapsedTime(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`)
      }, 1000)

      return () => clearInterval(timer)
    } catch (error) {
      console.error('Error setting up timer:', error)
      setElapsedTime('00:00:00')
    }
  }, [parkedDate, parkedTime])

  return (
    <Typography component='span' sx={{ fontFamily: 'monospace', fontWeight: 500, color: 'text.secondary' }}>
      ({elapsedTime})
    </Typography>
  )
}

const ExitVehicleCalculator = ({
  bookingId,
  vehicleType = 'Car',
  bookType = 'Hourly',
  bookingDetails = null,
  onClose,
  onSuccess
}) => {
  const { data: session } = useSession()
  const vendorId = session?.user?.id

  const [loading, setLoading] = useState(false)
  const [fetchingCharges, setFetchingCharges] = useState(true)
  const [fetchingBookingDetails, setFetchingBookingDetails] = useState(false)
  const [hours, setHours] = useState(0) // For billing calculation
  const [formattedDuration, setFormattedDuration] = useState('00:00:00') // For display
  const [amount, setAmount] = useState(0)
  const [chargesData, setChargesData] = useState(null)
  const [error, setError] = useState('')
  const [calculationDetails, setCalculationDetails] = useState(null)
  const [bookingData, setBookingData] = useState(bookingDetails || null)
  const [otp, setOtp] = useState('')
  const [backendOtp, setBackendOtp] = useState('')

  const [fullDayModes, setFullDayModes] = useState({
    car: 'Full Day',
    bike: 'Full Day',
    others: 'Full Day'
  })

  const [isVendorBooking, setIsVendorBooking] = useState(false)
  const is24Hours = bookingData?.bookType === '24 Hours' || bookType === '24 Hours'
  const isSubscription = bookingData?.sts === 'Subscription'

  // Helper function to calculate elapsed time in HH:MM:SS format
  const calculateElapsedTime = (parkedDate, parkedTime) => {
    if (!parkedDate || !parkedTime) return '00:00:00'

    try {
      const [day, month, year] = parkedDate.split('-')
      const [timePart, ampm] = parkedTime.split(' ')
      let [hours, minutes] = timePart.split(':').map(Number)

      if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12
      } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0
      }

      const parkingStartTime = new Date(
        `${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
      )

      const now = new Date()
      const diffMs = now - parkingStartTime
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000))
      const hrs = Math.floor(diffSecs / 3600)
      const mins = Math.floor((diffSecs % 3600) / 60)
      const secs = diffSecs % 60

      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } catch (error) {
      console.error('Error calculating elapsed time:', error)

      return '00:00:00'
    }
  }

  const fetchBookingDirectly = async id => {
    try {
      setFetchingBookingDetails(true)
      console.log(`Fetching booking details for ID: ${id} from direct API`)

      const response = await fetch(`${API_URL}/vendor/getbooking/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch booking details')
      }

      const data = await response.json()

      // FIXED: Check for data.data instead of data.booking
      if (!data || !data.data) {
        throw new Error('Invalid booking data received')
      }

      console.log('Received booking details from direct API:', data.data)

      setBookingData(data.data)

      // Check if this is a vendor booking (no userid present)
      setIsVendorBooking(!data.data.userid)

      if (data.data.otp && !isVendorBooking) {
        console.log('Received OTP from API:', data.data.otp)
        setBackendOtp(data.data.otp)
      }

      return data.data
    } catch (err) {
      console.error('Error fetching booking details from direct API:', err)
      setError('Failed to fetch booking details: ' + (err.message || ''))

      return null
    } finally {
      setFetchingBookingDetails(false)
    }
  }

  const fetchFullDayModes = async () => {
    try {
      console.log(`Fetching full day modes for vendor: ${vendorId}`)
      const response = await fetch(`${API_URL}/vendor/getfullday/${vendorId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch full day modes')
      }

      const data = await response.json()

      console.log('Received full day modes:', data)

      if (data && data.data) {
        setFullDayModes({
          car: data.data.fulldaycar || 'Full Day',
          bike: data.data.fulldaybike || 'Full Day',
          others: data.data.fulldayothers || 'Full Day'
        })
      }
    } catch (err) {
      console.error('Error fetching full day modes:', err)
    }
  }

  useEffect(() => {
    const getBookingDetails = async () => {
      if (bookingDetails) {
        setBookingData(bookingDetails)
        setIsVendorBooking(!bookingDetails.userid)

        if (bookingDetails.otp && bookingDetails.userid) {
          setBackendOtp(bookingDetails.otp)
        } else {
          await fetchBookingDirectly(bookingId)
        }

        return
      }

      if (!bookingId) return

      try {
        const directBooking = await fetchBookingDirectly(bookingId)

        if (directBooking) {
          return
        }

        setFetchingBookingDetails(true)
        console.log(`Falling back to original API for ID: ${bookingId}`)

        const response = await fetch(`${API_URL}/vendor/getbookingdetails/${bookingId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch booking details')
        }

        const data = await response.json()

        if (!data || !data.booking) {
          throw new Error('Invalid booking data received')
        }

        console.log('Received booking details from fallback:', data.booking)
        setBookingData(data.booking)
        setIsVendorBooking(!data.booking.userid)

        if (!data.booking.otp || isVendorBooking) {
          await fetchBookingDirectly(bookingId)
        } else {
          setBackendOtp(data.booking.otp)
        }
      } catch (err) {
        console.error('Error fetching booking details:', err)
        setError('Failed to fetch booking details: ' + (err.message || ''))
      } finally {
        setFetchingBookingDetails(false)
      }
    }

    if (bookingId) {
      getBookingDetails()
    }
  }, [bookingId, bookingDetails])

  useEffect(() => {
    if (vendorId) {
      fetchFullDayModes()
    }
  }, [vendorId])

  useEffect(() => {
    const calculateDuration = () => {
      try {
        // For subscription, we don't need to calculate duration based on time
        if (isSubscription) {
          setHours(1) // Just set to 1 as we'll use the monthly rate
          setFormattedDuration('00:00:00')

          return { duration: 1, method: null }
        }

        const parkingDate = bookingData?.parkedDate
        const parkingTime = bookingData?.parkedTime

        console.log('Calculating duration with:', { parkingDate, parkingTime })

        if (!parkingDate || !parkingTime) {
          console.error('Missing parking data:', { parkingDate, parkingTime })
          throw new Error('Parking date or time not available')
        }

        const [day, month, year] = parkingDate.split('-').map(Number)

        let [time, period] = parkingTime.split(' ')
        let [hours, minutes] = time.split(':').map(Number)

        if (period === 'PM' && hours < 12) {
          hours += 12
        } else if (period === 'AM' && hours === 12) {
          hours = 0
        }

        const parkingDateTime = new Date(year, month - 1, day, hours, minutes)
        const currentDateTime = new Date()

        console.log('Parking date time:', parkingDateTime)
        console.log('Current date time:', currentDateTime)

        const diffMs = currentDateTime - parkingDateTime

        if (is24Hours) {
          const effectiveVehicleType = bookingData?.vehicleType?.toLowerCase() || vehicleType.toLowerCase()
          const fullDayMode = fullDayModes[effectiveVehicleType] || 'Full Day'

          console.log(`Using full day mode "${fullDayMode}" for ${effectiveVehicleType}`)

          if (fullDayMode === '24 Hours') {
            // 24 Hours mode: Calculate complete 24-hour periods from parking time
            const diffHours = diffMs / (1000 * 60 * 60)
            const days = Math.ceil(diffHours / 24)
            const calculatedDays = Math.max(1, days)

            console.log('Calculated days (24 Hours mode):', calculatedDays)

            // Store calculation method for later display
            const calculationMethod = {
              methodName: '24 Hours',
              description: 'Complete 24-hour periods from parking time',
              parkingDateTime: parkingDateTime,
              currentDateTime: currentDateTime,
              diffHours: diffHours,
              days: calculatedDays
            }

            setHours(calculatedDays)
            setFormattedDuration(calculateElapsedTime(parkingDate, parkingTime))

            return { duration: calculatedDays, method: calculationMethod }
          } else {
            // Modified Full Day mode: Calculate calendar days but don't include current day unless complete
            const parkingDay = new Date(year, month - 1, day)

            const currentDay = new Date(
              currentDateTime.getFullYear(),
              currentDateTime.getMonth(),
              currentDateTime.getDate()
            )

            // Calculate the difference in days (not inclusive of the current day)
            const timeDiff = currentDay.getTime() - parkingDay.getTime()
            const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

            // Only add the current day if it's complete (already passed midnight)
            // Always charge minimum 1 day
            const calculatedDays = Math.max(1, diffDays)

            console.log('Calculated calendar days (Full Day mode):', calculatedDays)

            // Store calculation method for later display
            const calculationMethod = {
              methodName: 'Full Day',
              description: 'Calendar days (excluding current day unless complete)',
              parkingDay: parkingDay,
              currentDay: currentDay,
              diffDays: calculatedDays,
              explanation: 'Charges apply for each complete calendar day, excluding the current day if not yet complete'
            }

            setHours(calculatedDays)
            setFormattedDuration(calculateElapsedTime(parkingDate, parkingTime))

            return { duration: calculatedDays, method: calculationMethod }
          }
        } else {
          // Hourly booking - calculate both billing hours and formatted display
          const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
          const displayHours = Math.floor(totalSeconds / 3600)
          const displayMinutes = Math.floor((totalSeconds % 3600) / 60)
          const displaySeconds = totalSeconds % 60

          // Format for display (HH:MM:SS)
          const formatted = `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`

          // Billing hours (ceiling for charging purposes)
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
          const calculatedHours = Math.max(1, diffHours)

          console.log('Calculated hours (Hourly booking):', calculatedHours)

          // Store calculation method for later display
          const calculationMethod = {
            methodName: 'Hourly',
            description: 'Hours since parking time',
            parkingDateTime: parkingDateTime,
            currentDateTime: currentDateTime,
            diffHours: calculatedHours
          }

          setHours(calculatedHours) // For billing
          setFormattedDuration(formatted) // For display

          return { duration: calculatedHours, method: calculationMethod }
        }
      } catch (err) {
        console.error('Error calculating duration:', err)
        setError('Failed to calculate parking duration. Using default value.')
        setHours(1)
        setFormattedDuration('00:00:00')

        return { duration: 1, method: null }
      }
    }

    if (bookingData?.parkedDate && bookingData?.parkedTime && fullDayModes) {
      const result = calculateDuration()

      if (chargesData) {
        calculateAmount(result.duration, chargesData, result.method)
      }
    }
  }, [bookingData, chargesData, is24Hours, fullDayModes, vehicleType, isSubscription])

  // Add real-time updates for hourly bookings
  useEffect(() => {
    if (!is24Hours && !isSubscription && bookingData?.parkedDate && bookingData?.parkedTime && chargesData) {
      const timer = setInterval(() => {
        // Update formatted duration
        const newFormattedDuration = calculateElapsedTime(bookingData.parkedDate, bookingData.parkedTime)

        setFormattedDuration(newFormattedDuration)

        // Recalculate billing hours and amount
        const parkingDate = bookingData.parkedDate
        const parkingTime = bookingData.parkedTime

        try {
          const [day, month, year] = parkingDate.split('-').map(Number)
          let [time, period] = parkingTime.split(' ')
          let [hours, minutes] = time.split(':').map(Number)

          if (period === 'PM' && hours < 12) {
            hours += 12
          } else if (period === 'AM' && hours === 12) {
            hours = 0
          }

          const parkingDateTime = new Date(year, month - 1, day, hours, minutes)
          const currentDateTime = new Date()
          const diffMs = currentDateTime - parkingDateTime
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
          const calculatedHours = Math.max(1, diffHours)

          if (calculatedHours !== hours) {
            setHours(calculatedHours)
            calculateAmount(calculatedHours, chargesData)
          }
        } catch (err) {
          console.error('Error in timer update:', err)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [bookingData, chargesData, is24Hours, isSubscription, hours])

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        if (!vendorId) {
          console.log('Waiting for vendorId...')

          return
        }

        setFetchingCharges(true)
        setError('')

        console.log(`Fetching charges for vendor: ${vendorId}`)
        const response = await fetch(`${API_URL}/vendor/getchargesdata/${vendorId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch charges data')
        }

        const data = await response.json()

        console.log('Received charges data:', data)

        if (!data?.vendor?.charges) {
          throw new Error('Invalid charges data format')
        }

        setChargesData(data.vendor)
      } catch (err) {
        console.error('Error fetching charges:', err)
        setError(err.message || 'Failed to fetch parking charges data')
      } finally {
        setFetchingCharges(false)
      }
    }

    fetchCharges()
  }, [vendorId])

  const calculateAmount = (hoursValue, charges = chargesData, calculationMethod = null) => {
    if (!charges || !charges.charges || !charges.charges.length) {
      console.warn('No charges data available')

      return
    }

    try {
      const effectiveVehicleType = bookingData?.vehicleType || vehicleType

      console.log('Calculating amount for:', {
        hoursValue,
        vehicleType: effectiveVehicleType,
        is24Hours,
        calculationMethod,
        isSubscription
      })

      const relevantCharges = charges.charges.filter(
        charge => charge.category.toLowerCase() === effectiveVehicleType.toLowerCase()
      )

      if (relevantCharges.length === 0) {
        throw new Error(`No charges found for ${effectiveVehicleType}`)
      }

      console.log('Relevant charges:', relevantCharges)

      let calculatedAmount = 0
      let details = {}

      if (isSubscription) {
        // For subscription, we only use the monthly rate
        const monthlyCharge = relevantCharges.find(charge => charge.type.toLowerCase().includes('monthly'))

        if (!monthlyCharge) {
          throw new Error(`Monthly charge not found for ${effectiveVehicleType}`)
        }

        calculatedAmount = Number(monthlyCharge.amount)

        details = {
          rateType: 'Monthly Subscription',
          baseRate: Number(monthlyCharge.amount),
          calculation: `${monthlyCharge.amount} (monthly rate) = ${calculatedAmount}`,
          isSubscription: true
        }

        console.log('Subscription calculation details:', details)
      } else if (is24Hours) {
        const fullDayCharge = relevantCharges.find(
          charge => charge.type.toLowerCase().includes('full day') || charge.type.toLowerCase().includes('24 hour')
        )

        if (!fullDayCharge) {
          throw new Error(`Full day charge not found for ${effectiveVehicleType}`)
        }

        const days = hoursValue

        calculatedAmount = Number(fullDayCharge.amount) * days

        const vehicleTypeKey = effectiveVehicleType.toLowerCase()
        const fullDayMode = fullDayModes[vehicleTypeKey] || 'Full Day'

        details = {
          rateType: 'Full day',
          baseRate: Number(fullDayCharge.amount),
          days: days,
          fullDayMode: fullDayMode,
          calculation: `${fullDayCharge.amount} × ${days} day(s) = ${calculatedAmount}`,
          calculationMethod: calculationMethod,
          isSubscription: false
        }

        console.log('Full day calculation details:', details)
      } else {
        // FIXED: Updated base charge search to handle "0 to 2 hours" pattern
        const baseCharge = relevantCharges.find(charge => {
          const type = charge.type.toLowerCase().trim()

          return (
            type.includes('0 to 1') ||
            type.includes('0 to 2') || // Added this line
            type.includes('first hour') ||
            type.includes('minimum') ||
            type.includes('base') ||
            type.match(/^0\s+to\s+\d+/)
          ) // Matches "0 to X" patterns
        })

        const additionalCharge = relevantCharges.find(
          charge => charge.type.toLowerCase().includes('additional') || charge.type.toLowerCase().includes('extra hour')
        )

        if (!baseCharge) {
          console.error(
            'Available charge types:',
            relevantCharges.map(c => c.type)
          )
          throw new Error(
            `Base charge not found for ${effectiveVehicleType}. Available types: ${relevantCharges.map(c => c.type).join(', ')}`
          )
        }

        calculatedAmount = Number(baseCharge.amount)

        // Determine how many hours the base charge covers
        let baseCoverageHours = 1 // default
        const baseType = baseCharge.type.toLowerCase()

        // Check if base charge covers multiple hours (like "0 to 2 hours")
        const hoursMatch = baseType.match(/0\s+to\s+(\d+)/)

        if (hoursMatch) {
          baseCoverageHours = parseInt(hoursMatch[1])
        }

        console.log(`Base charge covers ${baseCoverageHours} hour(s)`)

        const additionalRate = additionalCharge ? Number(additionalCharge.amount) : Number(baseCharge.amount)

        // Only add additional charges if hours exceed base coverage
        if (hoursValue > baseCoverageHours) {
          calculatedAmount += additionalRate * (hoursValue - baseCoverageHours)
        }

        details = {
          rateType: 'Hourly',
          baseRate: Number(baseCharge.amount),
          baseCoverageHours: baseCoverageHours,
          additionalRate: additionalRate,
          totalHours: hoursValue,
          calculation:
            hoursValue > baseCoverageHours
              ? `${baseCharge.amount} (first ${baseCoverageHours} hour${baseCoverageHours > 1 ? 's' : ''}) + ${additionalRate} × ${hoursValue - baseCoverageHours} (additional hours) = ${calculatedAmount}`
              : `${baseCharge.amount} (first ${baseCoverageHours} hour${baseCoverageHours > 1 ? 's' : ''}) = ${calculatedAmount}`,
          calculationMethod: calculationMethod,
          isSubscription: false
        }

        console.log('Hourly calculation details:', details)
      }

      setAmount(calculatedAmount)
      setCalculationDetails(details)
      setError('')
    } catch (err) {
      console.error('Error calculating amount:', err)
      setError(err.message || 'Failed to calculate amount')
      setAmount(0)
    }
  }

  const handleHoursChange = e => {
    const value = Math.max(1, parseInt(e.target.value) || 1)

    setHours(value)

    if (chargesData) {
      calculateAmount(value, chargesData)
    }
  }

  const formatDate = dateStr => {
    if (!dateStr) return 'N/A'

    return dateStr
  }

  const formatTime = timeStr => {
    if (!timeStr) return 'N/A'

    let [time, period] = timeStr.split(' ')
    let [hours, minutes] = time.split(':').map(Number)

    if (period === 'PM' && hours < 12) {
      hours += 12
    } else if (period === 'AM' && hours === 12) {
      hours = 0
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const formatDateObject = date => {
    if (!date) return 'N/A'

    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  }

  const formatTimeObject = date => {
    if (!date) return 'N/A'
    const hours = date.getHours()
    const minutes = date.getMinutes()

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!bookingId || !amount || !hours) {
      setError('Booking ID, amount and hours are required')

      return
    }

    // Only validate OTP for user bookings (not vendor bookings)
    if (!isVendorBooking) {
      if (!otp) {
        setError('Last 3 digits of OTP are required')

        return
      }

      // Check if entered OTP matches the last 3 digits of backend OTP
      if (otp.length !== 3 || !backendOtp || !backendOtp.endsWith(otp)) {
        setError('OTP does not match the last 3 digits of booking OTP')

        return
      }
    }

    setLoading(true)
    setError('')

    try {
      console.log('Submitting exit data:', {
        bookingId,
        amount,
        hour: bookingData?.parkedTime,
        is24Hours,
        isSubscription,
        vendorId,
        otp: isVendorBooking ? null : backendOtp
      })

      const response = await fetch(`${API_URL}/vendor/exitvehicle/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          amount,
          hour: hours,
          is24Hours,
          isSubscription,
          vendorId,
          otp: isVendorBooking ? null : backendOtp
        })
      })

      if (!response.ok) {
        const errorData = await response.json()

        throw new Error(errorData.message || 'Failed to update booking status')
      }

      const data = await response.json()

      onSuccess?.(data.message || 'Vehicle exit processed successfully')
      onClose?.()
    } catch (err) {
      console.error('Error processing exit:', err)
      setError(err.message || 'Failed to process vehicle exit')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = fetchingCharges || fetchingBookingDetails || loading
  const otpValidated = isVendorBooking || (backendOtp && otp.length === 3 && backendOtp.endsWith(otp))

  return (
    <Box>
      <DialogTitle>Calculate Exit Charges</DialogTitle>
      <Box sx={{ px: 3, pb: 1 }}>
        <Typography variant='subtitle2' color='text.secondary'>
          Booking ID: {bookingId}
          {isVendorBooking && (
            <Typography component='span' color='primary' sx={{ ml: 1 }}>
              (Vendor Booking)
            </Typography>
          )}
          {isSubscription && (
            <Typography component='span' color='primary' sx={{ ml: 1 }}>
              (Subscription)
            </Typography>
          )}
        </Typography>
      </Box>

      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {isLoading && !error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant='body2' sx={{ ml: 2 }}>
              {fetchingBookingDetails
                ? 'Loading booking details...'
                : fetchingCharges
                  ? 'Loading charges data...'
                  : 'Processing...'}
            </Typography>
          </Box>
        ) : (
          <>
            <Card variant='outlined' sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant='subtitle1' color='text.secondary' gutterBottom>
                  Vehicle Type: {bookingData?.vehicleType || vehicleType}
                </Typography>
                <Typography variant='subtitle1' color='text.secondary' gutterBottom>
                  Booking Type: {isSubscription ? 'Subscription' : bookingData?.bookType || bookType}
                </Typography>
                {isSubscription && (
                  <Typography variant='subtitle1' color='text.secondary' gutterBottom>
                    Subscription Type: {bookingData?.subsctiptiontype || 'Monthly'}
                  </Typography>
                )}
                {!isSubscription && is24Hours && (
                  <Typography variant='subtitle1' color='text.secondary' gutterBottom>
                    Full Day Mode:{' '}
                    {fullDayModes[bookingData?.vehicleType?.toLowerCase() || vehicleType.toLowerCase()] || 'Full Day'}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <Typography variant='subtitle1' color='text.secondary'>
                  Parked Since: {formatDate(bookingData?.parkedDate)} at {formatTime(bookingData?.parkedTime)}{' '}
                  {bookingData?.parkedDate && bookingData?.parkedTime && !isSubscription && (
                    <ParkedTimer parkedDate={bookingData.parkedDate} parkedTime={bookingData.parkedTime} />
                  )}
                </Typography>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {!isSubscription && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={is24Hours ? 'Number of Days' : 'Duration (HH:MM:SS)'}
                    type='text'
                    value={is24Hours ? hours : formattedDuration}
                    InputProps={{
                      readOnly: true,
                      inputProps: { min: 1 }
                    }}
                    disabled={isLoading}
                    required
                  />
                </Grid>
              )}

              {!isVendorBooking && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Enter Last 3 Digits of OTP'
                    type='text'
                    value={otp}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 3)

                      setOtp(value)
                    }}
                    error={!otp || (otp && backendOtp && !backendOtp.endsWith(otp))}
                    helperText={
                      !otp
                        ? 'Last 3 digits of OTP are required'
                        : otp && backendOtp && !backendOtp.endsWith(otp)
                          ? 'OTP does not match the last 3 digits'
                          : ''
                    }
                    disabled={isLoading}
                    required
                    inputProps={{
                      maxLength: 3,
                      pattern: '\\d{3}'
                    }}
                  />
                </Grid>
              )}
            </Grid>

            {calculationDetails && (
              <Card sx={{ mt: 3, backgroundColor: '#f9f9f9' }}>
                <CardContent>
                  <Typography variant='subtitle1' gutterBottom>
                    Calculation Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    <Typography variant='body2'>
                      <strong>Rate Type:</strong> {calculationDetails.rateType}
                    </Typography>

                    {isSubscription ? (
                      <>
                        <Typography variant='body2'>
                          <strong>Monthly Rate:</strong> ₹{calculationDetails.baseRate}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant='body2'>
                          <strong>Calculation:</strong> {calculationDetails.calculation}
                        </Typography>
                      </>
                    ) : is24Hours ? (
                      <>
                        <Typography variant='body2'>
                          <strong>Full Day Rate:</strong> ₹{calculationDetails.baseRate}
                        </Typography>
                        <Typography variant='body2'>
                          <strong>Number of Days:</strong> {calculationDetails.days}
                        </Typography>
                        {calculationDetails.fullDayMode && (
                          <Typography variant='body2'>
                            <strong>Full Day Mode:</strong> {calculationDetails.fullDayMode}
                          </Typography>
                        )}

                        {calculationDetails.calculationMethod && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                            <Typography variant='body2' fontWeight='medium'>
                              Calculation Mode: {calculationDetails.calculationMethod.methodName}
                            </Typography>
                            <Typography variant='body2' fontSize='0.875rem' sx={{ mt: 0.5 }}>
                              {calculationDetails.calculationMethod.description}
                            </Typography>

                            {calculationDetails.calculationMethod.methodName === 'Full Day' && (
                              <>
                                <Typography variant='body2' fontSize='0.875rem' sx={{ mt: 1 }}>
                                  Parking day: {formatDateObject(calculationDetails.calculationMethod.parkingDay)}
                                </Typography>
                                <Typography variant='body2' fontSize='0.875rem'>
                                  Current day: {formatDateObject(calculationDetails.calculationMethod.currentDay)}
                                </Typography>
                                <Typography variant='body2' fontSize='0.875rem'>
                                  Calendar days (inclusive): {calculationDetails.calculationMethod.diffDays}
                                </Typography>
                              </>
                            )}

                            {calculationDetails.calculationMethod.methodName === '24 Hours' && (
                              <>
                                <Typography variant='body2' fontSize='0.875rem' sx={{ mt: 1 }}>
                                  Parking time: {formatDateObject(calculationDetails.calculationMethod.parkingDateTime)}{' '}
                                  {formatTimeObject(calculationDetails.calculationMethod.parkingDateTime)}
                                </Typography>
                                <Typography variant='body2' fontSize='0.875rem'>
                                  Current time: {formatDateObject(calculationDetails.calculationMethod.currentDateTime)}{' '}
                                  {formatTimeObject(calculationDetails.calculationMethod.currentDateTime)}
                                </Typography>
                                <Typography variant='body2' fontSize='0.875rem'>
                                  Elapsed hours: {calculationDetails.calculationMethod.diffHours.toFixed(2)}
                                </Typography>
                                <Typography variant='body2' fontSize='0.875rem'>
                                  24-hour periods: {calculationDetails.calculationMethod.days}
                                </Typography>
                              </>
                            )}
                          </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Typography variant='body2'>
                          <strong>Calculation:</strong> {calculationDetails.calculation}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant='body2'>
                          <strong>
                            Base Rate ({calculationDetails.baseCoverageHours} hour
                            {calculationDetails.baseCoverageHours > 1 ? 's' : ''}):
                          </strong>{' '}
                          ₹{calculationDetails.baseRate}
                        </Typography>
                        <Typography variant='body2'>
                          <strong>Additional Hour Rate:</strong> ₹{calculationDetails.additionalRate}
                        </Typography>
                        <Typography variant='body2'>
                          <strong>Total Hours:</strong> {calculationDetails.totalHours}
                        </Typography>

                        {calculationDetails.calculationMethod && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                            <Typography variant='body2' fontWeight='medium'>
                              Calculation Mode: {calculationDetails.calculationMethod.methodName}
                            </Typography>
                            <Typography variant='body2' fontSize='0.875rem' sx={{ mt: 0.5 }}>
                              {calculationDetails.calculationMethod.description}
                            </Typography>
                            <Typography variant='body2' fontSize='0.875rem' sx={{ mt: 1 }}>
                              Parking time: {formatDateObject(calculationDetails.calculationMethod.parkingDateTime)}{' '}
                              {formatTimeObject(calculationDetails.calculationMethod.parkingDateTime)}
                            </Typography>
                            <Typography variant='body2' fontSize='0.875rem'>
                              Current time: {formatDateObject(calculationDetails.calculationMethod.currentDateTime)}{' '}
                              {formatTimeObject(calculationDetails.calculationMethod.currentDateTime)}
                            </Typography>
                            <Typography variant='body2' fontSize='0.875rem'>
                              Elapsed hours: {calculationDetails.calculationMethod.diffHours}
                            </Typography>
                          </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Typography variant='body2'>
                          <strong>Calculation:</strong> {calculationDetails.calculation}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant='h6' color='primary' gutterBottom>
                Final Amount
              </Typography>
              <Typography variant='h4' fontWeight='bold'>
                ₹{amount.toFixed(2)}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color='secondary'>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          color='primary'
          disabled={isLoading || !vendorId || !otpValidated}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Processing...' : 'Confirm Exit'}
        </Button>
      </DialogActions>
    </Box>
  )
}

export default ExitVehicleCalculator
