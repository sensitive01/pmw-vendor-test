// 'use client'

// // React Imports
// import { useState, useEffect, useMemo } from 'react'
// import Link from 'next/link'
// import { useParams, useRouter } from 'next/navigation'
// import { useSession } from 'next-auth/react'

// // MUI Imports
// import Card from '@mui/material/Card'
// import CardContent from '@mui/material/CardContent'
// import Button from '@mui/material/Button'
// import Typography from '@mui/material/Typography'
// import Checkbox from '@mui/material/Checkbox'
// import Chip from '@mui/material/Chip'
// import TablePagination from '@mui/material/TablePagination'
// import TextField from '@mui/material/TextField'
// import CardHeader from '@mui/material/CardHeader'
// import Divider from '@mui/material/Divider'
// import Alert from '@mui/material/Alert'
// import CircularProgress from '@mui/material/CircularProgress'
// import { Menu, MenuItem } from '@mui/material'
// // Third-party Imports
// import classnames from 'classnames'
// import { rankItem } from '@tanstack/match-sorter-utils'
// import {
//   createColumnHelper,
//   flexRender,
//   getCoreRowModel,
//   useReactTable,
//   getFilteredRowModel,
//   getFacetedRowModel,
//   getFacetedUniqueValues,
//   getFacetedMinMaxValues,
//   getPaginationRowModel,
//   getSortedRowModel
// } from '@tanstack/react-table'

// // Component Imports
// import CustomAvatar from '@core/components/mui/Avatar'
// import OptionMenu from '@core/components/option-menu'
// import BookingActionButton from './BookingActionButton'

// // Util Imports
// import { getInitials } from '@/utils/getInitials'
// import { getLocalizedUrl } from '@/utils/i18n'

// // Styles Imports
// import tableStyles from '@core/styles/table.module.css'

// const API_URL = process.env.NEXT_PUBLIC_API_URL

// export const stsChipColor = {
//   instant: { color: '#ff4d49', text: 'Instant' },
//   subscription: { color: '#72e128', text: 'Subscription' },
//   schedule: { color: '#fdb528', text: 'Schedule' }
// };

// export const statusChipColor = {
//   completed: { color: 'success' },
//   pending: { color: 'warning' },
//   parked: { color: '#666CFF' },
//   cancelled: { color: 'error' },
//   approved: { color: 'info' }
// };

// const fuzzyFilter = (row, columnId, value, addMeta) => {
//   const itemRank = rankItem(row.getValue(columnId), value)
//   addMeta({ itemRank })
//   return itemRank.passed
// }

// const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
//   const [value, setValue] = useState(initialValue)

//   useEffect(() => {
//     setValue(initialValue)
//   }, [initialValue])

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       onChange(value)
//     }, debounce)

//     return () => clearTimeout(timeout)
//   }, [value])

//   return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
// }

// const PayableTimeTimer = ({ parkedDate, parkedTime }) => {
//   const [elapsedTime, setElapsedTime] = useState('00:00:00')

//   useEffect(() => {
//     if (!parkedDate || !parkedTime) {
//       setElapsedTime('00:00:00')
//       return
//     }
//     const [day, month, year] = parkedDate.split('-')
//     const [timePart, ampm] = parkedTime.split(' ')
//     let [hours, minutes] = timePart.split(':')
//     if (ampm && ampm.toUpperCase() === 'PM' && hours !== '12') {
//       hours = parseInt(hours) + 12
//     } else if (ampm && ampm.toUpperCase() === 'AM' && hours === '12') {
//       hours = '00'
//     }
//     const parkingStartTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
//     const timer = setInterval(() => {
//       const now = new Date()
//       const diffMs = now - parkingStartTime
//       if (diffMs < 0) {
//         setElapsedTime('00:00:00')
//         return
//       }

//       // Convert milliseconds to hours, minutes, seconds
//       const diffSecs = Math.floor(diffMs / 1000)
//       const hours = Math.floor(diffSecs / 3600)
//       const minutes = Math.floor((diffSecs % 3600) / 60)
//       const seconds = diffSecs % 60

//       // Format with leading zeros
//       const formattedHours = hours.toString().padStart(2, '0')
//       const formattedMinutes = minutes.toString().padStart(2, '0')
//       const formattedSeconds = seconds.toString().padStart(2, '0')

//       setElapsedTime(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`)
//     }, 1000)

//     return () => clearInterval(timer)
//   }, [parkedDate, parkedTime])

//   return (
//     <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
//       {elapsedTime}
//     </Typography>
//   )
// }

// const columnHelper = createColumnHelper()

// const OrderListTable = ({ orderData }) => {
//   const [rowSelection, setRowSelection] = useState({})
//   const [data, setData] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [globalFilter, setGlobalFilter] = useState('')
//   const [filteredData, setFilteredData] = useState(data)
//   const [error, setError] = useState(null)
//   const { lang: locale } = useParams()
//   const { data: session } = useSession()
//   const router = useRouter()
//   const vendorId = session?.user?.id
//   const [anchorEl, setAnchorEl] = useState(null)
//   const open = Boolean(anchorEl)

//   const handleMenuClick = (event) => {
//     setAnchorEl(event.currentTarget)
//   }

//   const handleMenuClose = () => {
//     setAnchorEl(null)
//   }
//   // Function to parse date string to DateTime object
//   const parseDateTime = (dateStr, timeStr) => {
//     if (!dateStr || !timeStr) return null;

//     try {
//       // Check if date is in YYYY-MM-DD format
//       let dateParts;
//       if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
//         const [year, month, day] = dateStr.split('-');
//         dateParts = { day, month, year };
//       }
//       // Otherwise assume DD-MM-YYYY format
//       else if (dateStr.includes('-')) {
//         const [day, month, year] = dateStr.split('-');
//         dateParts = { day, month, year };
//       } else {
//         return null;
//       }

//       // Parse time
//       const [timePart, ampm] = timeStr.split(' ');
//       let [hours, minutes] = timePart.split(':').map(Number);

//       if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) {
//         hours += 12;
//       } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
//         hours = 0;
//       }

//       return new Date(`${dateParts.year}-${dateParts.month}-${dateParts.day}T${hours}:${minutes}:00`);
//     } catch (e) {
//       console.error("Error parsing date/time:", e);
//       return null;
//     }
//   };

//   // Function to update booking status to Cancelled
//   const updateBookingStatus = async (bookingId, status) => {
//     try {
//       const response = await fetch(`${API_URL}/vendor/updatebookingstatus/${bookingId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ status })
//       });

//       if (!response.ok) {
//         throw new Error('Failed to update booking status');
//       }

//       return true;
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       return false;
//     }
//   };

//   // Function to check and update pending bookings
//   const checkAndUpdatePendingBookings = async (bookings) => {
//     const now = new Date();

//     for (const booking of bookings) {
//       try {
//         // Skip if booking is not pending
//         if (booking.status.toLowerCase() !== 'pending') {
//           continue;
//         }

//         // Parse scheduled date and time
//         const scheduledDateTime = parseDateTime(booking.bookingDate, booking.bookingTime);
//         if (!scheduledDateTime) continue;

//         // Check if scheduled time has passed by more than 10 minutes
//         const tenMinutesAfter = new Date(scheduledDateTime.getTime() + 10 * 60 * 1000);

//         if (now > tenMinutesAfter) {
//           const success = await updateBookingStatus(booking._id, 'Cancelled');
//           if (success) {
//             console.log(`Booking ${booking._id} has been cancelled.`);
//           }
//         }
//       } catch (e) {
//         console.error(`Error processing booking ${booking._id}:`, e);
//       }
//     }
//   };

//   // Function to check and update approved bookings
//   const checkAndUpdateApprovedBookings = async (bookings) => {
//     const now = new Date();

//     for (const booking of bookings) {
//       try {
//         // Skip if booking is not approved
//         if (booking.status.toLowerCase() !== 'approved') {
//           continue;
//         }

//         // Parse scheduled date and time
//         const scheduledDateTime = parseDateTime(booking.bookingDate, booking.bookingTime);
//         if (!scheduledDateTime) continue;

//         // Check if scheduled time has passed by more than 10 minutes
//         const tenMinutesAfter = new Date(scheduledDateTime.getTime() + 10 * 60 * 1000);

//         if (now > tenMinutesAfter) {
//           const success = await updateBookingStatus(booking._id, 'Cancelled');
//           if (success) {
//             console.log(`Booking ${booking._id} has been cancelled (10 minutes past the scheduled time).`);
//           }
//         }
//       } catch (e) {
//         console.error(`Error processing booking ${booking._id}:`, e);
//       }
//     }
//   };

//   // Function to refresh booking list
//   const refreshBookingList = async () => {
//     try {
//       const response = await fetch(`${API_URL}/vendor/fetchbookingsbyvendorid/${vendorId}`);
//       const result = await response.json();

//       if (result && result.bookings) {
//         const filteredBookings = result.bookings.filter(booking =>
//           ["pending", "approved", "cancelled", "parked", "completed"]
//             .includes(booking.status.toLowerCase())
//         );

//         // Sort bookings by creation date (latest first)
//         const sortedBookings = filteredBookings.sort((a, b) => {
//           // First try to use createdAt field if it exists
//           if (a.createdAt && b.createdAt) {
//             return new Date(b.createdAt) - new Date(a.createdAt);
//           }

//           // Fall back to booking date and time if createdAt doesn't exist
//           try {
//             const dateA = parseDateTime(a.bookingDate, a.bookingTime);
//             const dateB = parseDateTime(b.bookingDate, b.bookingTime);

//             return (dateB || 0) - (dateA || 0);
//           } catch (e) {
//             // If all else fails, sort by ID if available (assuming newer IDs are larger)
//             if (a._id && b._id) {
//               return b._id.localeCompare(a._id);
//             }
//             return 0;
//           }
//         });

//         setData(sortedBookings);
//         setFilteredData(sortedBookings);
//         return sortedBookings;
//       }
//       return [];
//     } catch (error) {
//       console.error('Error refreshing booking list:', error);
//       return [];
//     }
//   };

//   const fetchData = async () => {
//     if (!vendorId) return;

//     try {
//       setLoading(true);
//       setError(null);

//       // First fetch the current bookings
//       const currentBookings = await refreshBookingList();

//       // Then check and update pending bookings
//       await checkAndUpdatePendingBookings(currentBookings);

//       // Then check and update approved bookings
//       await checkAndUpdateApprovedBookings(currentBookings);

//       // Finally refresh the list to get updated statuses
//       await refreshBookingList();
//     } catch (error) {
//       console.error("Error fetching bookings:", error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();

//     // Set up interval to check bookings every minute
//     const intervalId = setInterval(() => {
//       fetchData();
//     }, 60000); // Check every minute

//     return () => clearInterval(intervalId);
//   }, [vendorId]);

//   const columns = useMemo(
//     () => [
//       {
//         id: 'select',
//         header: ({ table }) => (
//           <Checkbox
//             checked={table.getIsAllRowsSelected()}
//             indeterminate={table.getIsSomeRowsSelected()}
//             onChange={table.getToggleAllRowsSelectedHandler()}
//           />
//         ),
//         cell: ({ row }) => (
//           <Checkbox
//             checked={row.getIsSelected()}
//             disabled={!row.getCanSelect()}
//             indeterminate={row.getIsSomeSelected()}
//             onChange={row.getToggleSelectedHandler()}
//           />
//         )
//       },
//       columnHelper.accessor('vehicleNumber', {
//         header: 'Vehicle Number',
//         cell: ({ row }) => (
//           <Typography style={{ color: '#666cff' }}>
//             {row.original.vehicleNumber ? `#${row.original.vehicleNumber}` : 'N/A'}
//           </Typography>
//         )
//       }),
//       columnHelper.accessor('bookingDate', {
//         header: 'Booking Date & Time',
//         cell: ({ row }) => {
//           const formatDateDisplay = (dateStr) => {
//             if (!dateStr) return 'N/A'

//             try {
//               if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
//                 return new Date(dateStr).toLocaleDateString('en-US', {
//                   day: 'numeric',
//                   month: 'short',
//                   year: 'numeric'
//                 })
//               }
//               else if (dateStr.includes('-')) {
//                 const [day, month, year] = dateStr.split('-')
//                 return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
//                   day: 'numeric',
//                   month: 'short',
//                   year: 'numeric'
//                 })
//               }

//               return dateStr
//             } catch (e) {
//               console.error("Date parsing error:", e, dateStr)
//               return dateStr
//             }
//           }
//           const formatTimeDisplay = (timeStr) => {
//             if (!timeStr) return ''
//             if (timeStr.includes('AM') || timeStr.includes('PM')) {
//               return timeStr
//             }
//             try {
//               const [hours, minutes] = timeStr.split(':').map(Number)
//               const period = hours >= 12 ? 'PM' : 'AM'
//               const hours12 = hours % 12 || 12
//               return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
//             } catch (e) {
//               return timeStr
//             }
//           }

//           return (
//             <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <i className="ri-calendar-2-line" style={{ fontSize: '16px', color: '#666' }}></i>
//               {`${formatDateDisplay(row.original.bookingDate)}, ${formatTimeDisplay(row.original.bookingTime || 'N/A')}`}
//             </Typography>
//           )
//         }
//       }),
//       columnHelper.accessor('payableTime', {
//         header: 'Payable Time',
//         cell: ({ row }) => {
//           // Check booking status
//           const status = row.original.status?.toLowerCase()

//           // Return empty for completed status
//           if (status === 'completed') {
//             return null
//           }

//           const isParked = status === 'parked'

//           // Show real-time timer for PARKED status
//           if (isParked) {
//             return (
//               <div className="flex items-center gap-2">
//                 <i className="ri-time-line" style={{ fontSize: '16px', color: '#666CFF' }}></i>
//                 <PayableTimeTimer
//                   parkedDate={row.original.parkedDate}
//                   parkedTime={row.original.parkedTime}
//                 />
//               </div>
//             )
//           }

//           // Default case for other statuses
//           return null
//         }
//       }),
//       columnHelper.accessor('customerName', {
//         header: 'Customer',
//         cell: ({ row }) => (
//           <div className="flex items-center gap-3">
//             <CustomAvatar src="/images/avatars/1.png" skin='light' size={34} />
//             <div className="flex flex-col">
//               <Typography className="font-medium">
//                 {row.original.personName || 'Unknown'}
//               </Typography>
//               <Typography variant="body2">
//                 {row.original.mobileNumber || 'N/A'}
//               </Typography>
//             </div>
//           </div>
//         )
//       }),
//       columnHelper.accessor('sts', {
//         header: 'Booking Type',
//         cell: ({ row }) => {
//           const stsKey = row.original.sts?.toLowerCase()
//           const chipData = stsChipColor[stsKey] || { color: 'text.secondary', text: row.original.sts || 'N/A' }

//           return (
//             <Typography
//               sx={{
//                 color: chipData.color,
//                 fontWeight: 500,
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 1
//               }}
//             >
//               <i className="ri-circle-fill" style={{ fontSize: '10px', color: chipData.color }}></i>
//               {chipData.text}
//             </Typography>
//           )
//         }
//       }),
//       columnHelper.accessor('status', {
//         header: 'Status',
//         cell: ({ row }) => {
//           const statusKey = row.original.status?.toLowerCase()
//           const chipData = statusChipColor[statusKey] || { color: 'default' }

//           return (
//             <Chip
//               label={row.original.status || 'N/A'}
//               variant="tonal"
//               size="small"
//               sx={chipData.color.startsWith('#') ? {
//                 backgroundColor: chipData.color,
//                 color: 'white'
//               } : {}}
//               color={!chipData.color.startsWith('#') ? chipData.color : undefined}
//             />
//           )
//         }
//       }),
//       columnHelper.accessor('vehicleType', {
//         header: 'Vehicle Type',
//         cell: ({ row }) => {
//           const vehicleType = row.original.vehicleType?.toLowerCase()
//           const vehicleIcons = {
//             car: { icon: 'ri-car-fill', color: '#ff4d49' },
//             bike: { icon: 'ri-motorbike-fill', color: '#72e128' },
//             default: { icon: 'ri-roadster-fill', color: '#282a42' }
//           }

//           const { icon, color } = vehicleIcons[vehicleType] || vehicleIcons.default

//           return (
//             <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <i className={icon} style={{ fontSize: '16px', color }}></i>
//               {row.original.vehicleType || 'N/A'}
//             </Typography>
//           )
//         }
//       }),
//       columnHelper.accessor('action', {
//         header: 'Actions',
//         cell: ({ row }) => (
//           <div className='flex items-center'>
//             <OptionMenu
//               iconButtonProps={{ size: 'medium' }}
//               iconClassName='text-[22px]'
//               options={[
//                 {
//                   text: 'View',
//                   icon: 'ri-eye-line',
//                   menuItemProps: {
//                     onClick: () => {
//                       const selectedId = row.original._id
//                       if (selectedId) {
//                         router.push(`/pages/bookingdetails/${selectedId}`)
//                       }
//                     }
//                   }
//                 }
//               ]}
//             />
//           </div>
//         ),
//         enableSorting: false
//       }),
//       columnHelper.accessor('statusAction', {
//         header: 'Change Status',
//         cell: ({ row }) => (
//           <BookingActionButton
//             bookingId={row.original._id}
//             currentStatus={row.original.status}
//             bookingDetails={row.original} // Pass the entire booking object
//             onUpdate={fetchData}
//           />
//         ),
//         enableSorting: false
//       })
//     ],
//     [router]
//   )

//   const table = useReactTable({
//     data: filteredData.length > 0 || globalFilter ? filteredData : data,
//     columns,
//     filterFns: {
//       fuzzy: fuzzyFilter
//     },
//     state: {
//       rowSelection,
//       globalFilter
//     },
//     initialState: {
//       pagination: {
//         pageSize: 10
//       }
//     },
//     enableRowSelection: true,
//     globalFilterFn: fuzzyFilter,
//     onRowSelectionChange: setRowSelection,
//     onGlobalFilterChange: setGlobalFilter,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     getFacetedRowModel: getFacetedRowModel(),
//     getFacetedUniqueValues: getFacetedUniqueValues(),
//     getFacetedMinMaxValues: getFacetedMinMaxValues()
//   })


// const handleExport = (type) => {
//   // Get the data you want to export (filtered or all)
//   const exportData = filteredData.length > 0 || globalFilter ? filteredData : data;

//   // Define fields with human-readable headers
//   const fieldsConfig = [
//     { key: 'vehicleNumber', label: 'Vehicle Number' },
//     { key: 'bookType', label: 'Booking Type' },
//     { key: 'bookingDate', label: 'Booking Date' },
//     { key: 'bookingTime', label: 'Booking Time' },
//     { key: 'parkedDate', label: 'Parked Date' },
//     { key: 'parkedTime', label: 'Parked Time' },
//     { key: 'exitvehicledate', label: 'Exit Date' },
//     { key: 'exitvehicletime', label: 'Exit Time' },
//     { key: 'personName', label: 'Person Name' },
//     { key: 'mobileNumber', label: 'Mobile Number' },
//     { key: 'vehicleType', label: 'Vehicle Type' },
//     { key: 'sts', label: 'Service Type' },
//     { key: 'status', label: 'Status' },
//     { key: 'amount', label: 'Amount' },
//     { key: 'hour', label: 'Duration' }
//   ];

//   if (type === 'excel') {
//     // Convert data to CSV format
//     const csvContent = [
//       fieldsConfig.map(f => f.label).join(','),
//       ...exportData.map(row =>
//         fieldsConfig.map(field =>
//           JSON.stringify(row[field.key] ?? '')
//         ).join(',')
//       )
//     ].join('\n');

//     // Create download link
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `bookings_${new Date().toISOString().slice(0, 10)}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//   } else if (type === 'pdf') {
//     const printWindow = window.open('', '_blank');

//     // Build HTML with better formatting
//     const html = `
//     <html>
//       <head>
//         <title>Bookings Export</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 20px; }
//           h1 { color: #333; text-align: center; }
//           table { border-collapse: collapse; width: 100%; margin-top: 20px; }
//           th { background-color: #f2f2f2; position: sticky; top: 0; }
//           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//           tr:nth-child(even) { background-color: #f9f9f9; }
//           .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
//           .date { color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <h1>Bookings Export</h1>
//           <div class="date">Generated: ${new Date().toLocaleString()}</div>
//         </div>
//         <table>
//           <thead>
//             <tr>
//               ${fieldsConfig.map(field => `<th>${field.label}</th>`).join('')}
//             </tr>
//           </thead>
//           <tbody>
//             ${exportData.map(row => `
//               <tr>
//                 ${fieldsConfig.map(field => {
//                   const value = row[field.key];
//                   // Handle empty values and format if needed
//                   return `<td>${value !== undefined && value !== null ? value : '-'}</td>`;
//                 }).join('')}
//               </tr>
//             `).join('')}
//           </tbody>
//         </table>
//         <script>
//           // Wait for content to load before printing
//           window.onload = function() {
//             setTimeout(() => {
//               window.print();
//               // Don't close immediately to allow print dialog to appear
//             }, 300);
//           };
//         </script>
//       </body>
//     </html>
//     `;

//     printWindow.document.open();
//     printWindow.document.write(html);
//     printWindow.document.close();
//   }
// };
// return (
//     <Card>
//       <CardHeader title='Booking Management' />
//       <Divider />
//       <CardContent className='flex justify-between max-sm:flex-col sm:items-center gap-4'>
//         <DebouncedInput
//           value={globalFilter ?? ''}
//           onChange={value => setGlobalFilter(String(value))}
//           placeholder='Search Bookings'
//           className='sm:is-auto'
//         />
//         <div className='flex items-center gap-4 max-sm:is-full'>
//           <Button
//             variant='outlined'
//             className='max-sm:is-full is-auto'
//             startIcon={<i className='ri-download-line' />}
//             onClick={handleMenuClick}
//           >
//             Download
//           </Button>
//           <Menu
//             anchorEl={anchorEl}
//             open={open}
//             onClose={handleMenuClose}
//           >
//             <MenuItem
//               onClick={() => {
//                 handleExport('excel')
//                 handleMenuClose()
//               }}
//               sx={{ gap: 2 }}
//             >
//               <i className='ri-file-excel-2-line' /> Export to Excel
//             </MenuItem>
//             <MenuItem
//               onClick={() => {
//                 handleExport('pdf')
//                 handleMenuClose()
//               }}
//               sx={{ gap: 2 }}
//             >
//               <i className='ri-file-pdf-line' /> Export to PDF
//             </MenuItem>
//           </Menu>
//           <Button
//             variant='contained'
//             component={Link}
//             href={getLocalizedUrl('/pages/wizard-examples/property-listing', locale)}
//             startIcon={<i className='ri-add-line' />}
//             className='max-sm:is-full is-auto'
//           >
//             New Booking
//           </Button>
//         </div>
//       </CardContent>
//       <div className='overflow-x-auto'>
//         {loading ? (
//           <div className="flex justify-center items-center p-8">
//             <CircularProgress />
//           </div>
//         ) : error ? (
//           <Alert severity="error" className="m-4">
//             {error}
//           </Alert>
//         ) : table.getFilteredRowModel().rows.length === 0 ? (
//           <Alert severity="info" className="m-4">
//             No bookings found
//           </Alert>
//         ) : (
//           <>
//             <table className={tableStyles.table}>
//               <thead>
//                 {table.getHeaderGroups().map(headerGroup => (
//                   <tr key={headerGroup.id}>
//                     {headerGroup.headers.map(header => (
//                       <th key={header.id}>
//                         {header.isPlaceholder ? null : (
//                           <div
//                             className={classnames({
//                               'flex items-center': header.column.getIsSorted(),
//                               'cursor-pointer select-none': header.column.getCanSort()
//                             })}
//                             onClick={header.column.getToggleSortingHandler()}
//                           >
//                             {flexRender(header.column.columnDef.header, header.getContext())}
//                             {{
//                               asc: <i className='ri-arrow-up-s-line text-xl' />,
//                               desc: <i className='ri-arrow-down-s-line text-xl' />
//                             }[header.column.getIsSorted()] ?? null}
//                           </div>
//                         )}
//                       </th>
//                     ))}
//                   </tr>
//                 ))}
//               </thead>
//               <tbody>
//                 {table.getRowModel().rows.map(row => (
//                   <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
//                     {row.getVisibleCells().map(cell => (
//                       <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <TablePagination
//               rowsPerPageOptions={[10, 25, 50, 100]}
//               component='div'
//               className='border-bs'
//               count={table.getFilteredRowModel().rows.length}
//               rowsPerPage={table.getState().pagination.pageSize}
//               page={table.getState().pagination.pageIndex}
//               onPageChange={(_, page) => table.setPageIndex(page)}
//               onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
//             />
//           </>
//         )}
//       </div>
//     </Card>
//   )
// }

// export default OrderListTable



'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { Menu, MenuItem } from '@mui/material'
// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'
import BookingActionButton from './BookingActionButton'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

// Styles Imports
import tableStyles from '@core/styles/table.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const stsChipColor = {
  instant: { color: '#ff4d49', text: 'Instant' },
  subscription: { color: '#72e128', text: 'Subscription' },
  schedule: { color: '#fdb528', text: 'Schedule' }
};

export const statusChipColor = {
  completed: { color: 'success' },
  pending: { color: 'warning' },
  parked: { color: '#666CFF' },
  cancelled: { color: 'error' },
  approved: { color: 'info' }
};

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const PayableTimeTimer = ({ parkedDate, parkedTime }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  useEffect(() => {
    if (!parkedDate || !parkedTime) {
      setElapsedTime('00:00:00')
      return
    }
    const [day, month, year] = parkedDate.split('-')
    const [timePart, ampm] = parkedTime.split(' ')
    let [hours, minutes] = timePart.split(':')
    if (ampm && ampm.toUpperCase() === 'PM' && hours !== '12') {
      hours = parseInt(hours) + 12
    } else if (ampm && ampm.toUpperCase() === 'AM' && hours === '12') {
      hours = '00'
    }
    const parkingStartTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
    const timer = setInterval(() => {
      const now = new Date()
      const diffMs = now - parkingStartTime
      if (diffMs < 0) {
        setElapsedTime('00:00:00')
        return
      }

      // Convert milliseconds to hours, minutes, seconds
      const diffSecs = Math.floor(diffMs / 1000)
      const hours = Math.floor(diffSecs / 3600)
      const minutes = Math.floor((diffSecs % 3600) / 60)
      const seconds = diffSecs % 60

      // Format with leading zeros
      const formattedHours = hours.toString().padStart(2, '0')
      const formattedMinutes = minutes.toString().padStart(2, '0')
      const formattedSeconds = seconds.toString().padStart(2, '0')

      setElapsedTime(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [parkedDate, parkedTime])

  return (
    <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
      {elapsedTime}
    </Typography>
  )
}

const columnHelper = createColumnHelper()

const OrderListTable = ({ orderData }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState(data)
  const [error, setError] = useState(null)
  const { lang: locale } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const vendorId = session?.user?.id
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }
  // Function to parse date string to DateTime object
  const parseDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;

    try {
      // Check if date is in YYYY-MM-DD format
      let dateParts;
      if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
        const [year, month, day] = dateStr.split('-');
        dateParts = { day, month, year };
      }
      // Otherwise assume DD-MM-YYYY format
      else if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        dateParts = { day, month, year };
      } else {
        return null;
      }

      // Parse time
      const [timePart, ampm] = timeStr.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);

      if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      return new Date(`${dateParts.year}-${dateParts.month}-${dateParts.day}T${hours}:${minutes}:00`);
    } catch (e) {
      console.error("Error parsing date/time:", e);
      return null;
    }
  };

  // Function to update booking status to Cancelled
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await fetch(`${API_URL}/vendor/updatebookingstatus/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });
      console.log("exit vechicle ",response)

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return false;
    }
  };

  // Function to check and update pending bookings
  const checkAndUpdatePendingBookings = async (bookings) => {
    const now = new Date();

    for (const booking of bookings) {
      try {
        // Skip if booking is not pending
        if (booking.status.toLowerCase() !== 'pending') {
          continue;
        }

        // Parse scheduled date and time
        const scheduledDateTime = parseDateTime(booking.bookingDate, booking.bookingTime);
        if (!scheduledDateTime) continue;

        // Check if scheduled time has passed by more than 10 minutes
        const tenMinutesAfter = new Date(scheduledDateTime.getTime() + 10 * 60 * 1000);

        if (now > tenMinutesAfter) {
          const success = await updateBookingStatus(booking._id, 'Cancelled');
          if (success) {
            console.log(`Booking ${booking._id} has been cancelled.`);
          }
        }
      } catch (e) {
        console.error(`Error processing booking ${booking._id}:`, e);
      }
    }
  };

  // Function to check and update approved bookings
  const checkAndUpdateApprovedBookings = async (bookings) => {
    const now = new Date();

    for (const booking of bookings) {
      try {
        // Skip if booking is not approved
        if (booking.status.toLowerCase() !== 'approved') {
          continue;
        }

        // Parse scheduled date and time
        const scheduledDateTime = parseDateTime(booking.bookingDate, booking.bookingTime);
        if (!scheduledDateTime) continue;

        // Check if scheduled time has passed by more than 10 minutes
        const tenMinutesAfter = new Date(scheduledDateTime.getTime() + 10 * 60 * 1000);

        if (now > tenMinutesAfter) {
          const success = await updateBookingStatus(booking._id, 'Cancelled');
          if (success) {
            console.log(`Booking ${booking._id} has been cancelled (10 minutes past the scheduled time).`);
          }
        }
      } catch (e) {
        console.error(`Error processing booking ${booking._id}:`, e);
      }
    }
  };

  // Function to refresh booking list
  const refreshBookingList = async () => {
    try {
      const response = await fetch(`${API_URL}/vendor/fetchbookingsbyvendorid/${vendorId}`);
      const result = await response.json();

      if (result && result.bookings) {
        const filteredBookings = result.bookings.filter(booking =>
          ["pending", "approved", "cancelled", "parked", "completed"]
            .includes(booking.status.toLowerCase())
        );

        // Sort bookings by creation date (latest first)
        const sortedBookings = filteredBookings.sort((a, b) => {
          // First try to use createdAt field if it exists
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }

          // Fall back to booking date and time if createdAt doesn't exist
          try {
            const dateA = parseDateTime(a.bookingDate, a.bookingTime);
            const dateB = parseDateTime(b.bookingDate, b.bookingTime);

            return (dateB || 0) - (dateA || 0);
          } catch (e) {
            // If all else fails, sort by ID if available (assuming newer IDs are larger)
            if (a._id && b._id) {
              return b._id.localeCompare(a._id);
            }
            return 0;
          }
        });

        setData(sortedBookings);
        setFilteredData(sortedBookings);
        return sortedBookings;
      }
      return [];
    } catch (error) {
      console.error('Error refreshing booking list:', error);
      return [];
    }
  };

  const fetchData = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      setError(null);

      // First fetch the current bookings
      const currentBookings = await refreshBookingList();

      // Then check and update pending bookings
      await checkAndUpdatePendingBookings(currentBookings);

      // Then check and update approved bookings
      await checkAndUpdateApprovedBookings(currentBookings);

      // Finally refresh the list to get updated statuses
      await refreshBookingList();
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up interval to check bookings every minute
    const intervalId = setInterval(() => {
      fetchData();
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [vendorId]);

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      {
        id: 'sno',
        header: 'S.No',
        cell: ({ row }) => (
          <Typography>{row.index + 1}</Typography>
        )
      },
      // {
      //   id: 'vendorName',
      //   header: 'Vendor Name',
      //   cell: ({ row }) => (
      //     <Typography>{row.original.vendorName || 'My Parking Place'}</Typography>
      //   )
      // },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <CustomAvatar src="/images/avatars/1.png" skin='light' size={34} />
            <div className="flex flex-col">
              <Typography className="font-medium">
                {row.original.personName || 'Unknown'}
              </Typography>
              <Typography variant="body2">
                {row.original.mobileNumber || 'N/A'}
              </Typography>
            </div>
          </div>
        )
      },
      {
        id: 'vehicleType',
        header: 'Vehicle Type',
        cell: ({ row }) => {
          const vehicleType = row.original.vehicleType?.toLowerCase()
          const vehicleIcons = {
            car: { icon: 'ri-car-fill', color: '#ff4d49' },
            bike: { icon: 'ri-motorbike-fill', color: '#72e128' },
            default: { icon: 'ri-roadster-fill', color: '#282a42' }
          }

          const { icon, color } = vehicleIcons[vehicleType] || vehicleIcons.default

          return (
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className={icon} style={{ fontSize: '16px', color }}></i>
              {row.original.vehicleType || 'N/A'}
            </Typography>
          )
        }
      },
      {
        id: 'vehicleNumber',
        header: 'Vehicle Number',
        cell: ({ row }) => (
          <Typography style={{ color: '#666cff' }}>
            {row.original.vehicleNumber ? `#${row.original.vehicleNumber}` : 'N/A'}
          </Typography>
        )
      },
      {
        id: 'bookType',
        header: 'Booking Type',
        cell: ({ row }) => {
          const stsKey = row.original.sts?.toLowerCase()
          const chipData = stsChipColor[stsKey] || { color: 'text.secondary', text: row.original.sts || 'N/A' }

          return (
            <Typography
              sx={{
                color: chipData.color,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <i className="ri-circle-fill" style={{ fontSize: '10px', color: chipData.color }}></i>
              {chipData.text}
            </Typography>
          )
        }
      },
      {
        id: 'bookingDateTime',
        header: 'Booking Date & Time',
        cell: ({ row }) => {
          const formatDateDisplay = (dateStr) => {
            if (!dateStr) return 'N/A'

            try {
              if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
                return new Date(dateStr).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              }
              else if (dateStr.includes('-')) {
                const [day, month, year] = dateStr.split('-')
                return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              }

              return dateStr
            } catch (e) {
              console.error("Date parsing error:", e, dateStr)
              return dateStr
            }
          }
          const formatTimeDisplay = (timeStr) => {
            if (!timeStr) return ''
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
              return timeStr
            }
            try {
              const [hours, minutes] = timeStr.split(':').map(Number)
              const period = hours >= 12 ? 'PM' : 'AM'
              const hours12 = hours % 12 || 12
              return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
            } catch (e) {
              return timeStr
            }
          }

          return (
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="ri-calendar-2-line" style={{ fontSize: '16px', color: '#666' }}></i>
              {`${formatDateDisplay(row.original.bookingDate)}, ${formatTimeDisplay(row.original.bookingTime || 'N/A')}`}
            </Typography>
          )
        }
      },
      {
        id: 'parkingEntryDateTime',
        header: 'Parking Entry Date & Time',
        cell: ({ row }) => {
          const formatDateDisplay = (dateStr) => {
            if (!dateStr) return 'N/A'

            try {
              if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
                return new Date(dateStr).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              }
              else if (dateStr.includes('-')) {
                const [day, month, year] = dateStr.split('-')
                return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              }

              return dateStr
            } catch (e) {
              console.error("Date parsing error:", e, dateStr)
              return dateStr
            }
          }
          const formatTimeDisplay = (timeStr) => {
            if (!timeStr) return ''
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
              return timeStr
            }
            try {
              const [hours, minutes] = timeStr.split(':').map(Number)
              const period = hours >= 12 ? 'PM' : 'AM'
              const hours12 = hours % 12 || 12
              return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
            } catch (e) {
              return timeStr
            }
          }

          return (
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="ri-calendar-2-line" style={{ fontSize: '16px', color: '#666' }}></i>
              {`${formatDateDisplay(row.original.parkedDate)}, ${formatTimeDisplay(row.original.parkedTime || 'N/A')}`}
            </Typography>
          )
        }
      },

      {
        id: 'exitVehicleDateTime',
        header: 'Parking Exit Date & Time',
        cell: ({ row }) => {
          const formatDateDisplay = (dateStr) => {
            if (!dateStr) return 'N/A'
            try {
              if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
                return new Date(dateStr).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              } else if (dateStr.includes('-')) {
                const [day, month, year] = dateStr.split('-')
                return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              }
              return dateStr
            } catch (e) {
              console.error("Date parsing error:", e, dateStr)
              return dateStr
            }
          }
          const formatTimeDisplay = (timeStr) => {
            if (!timeStr) return ''
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
              return timeStr
            }
            try {
              const [hours, minutes] = timeStr.split(':').map(Number)
              const period = hours >= 12 ? 'PM' : 'AM'
              const hours12 = hours % 12 || 12
              return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
            } catch (e) {
              return timeStr
            }
          }

          return (
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="ri-calendar-2-line" style={{ fontSize: '16px', color: '#666' }}></i>
              {`${formatDateDisplay(row.original.exitvehicledate)}, ${formatTimeDisplay(row.original.exitvehicletime || 'N/A')}`}
            </Typography>
          )
        }
      },
      {
        id: 'payableTime',
        header: 'Payable Time',
        cell: ({ row }) => {
          // Check booking status
          const status = row.original.status?.toLowerCase()

          // Return empty for completed status
          if (status === 'completed') {
            return row.original.hour || 'N/A'
          }

          const isParked = status === 'parked'

          // Show real-time timer for PARKED status
          if (isParked) {
            return (
              <div className="flex items-center gap-2">
                <i className="ri-time-line" style={{ fontSize: '16px', color: '#666CFF' }}></i>
                <PayableTimeTimer
                  parkedDate={row.original.parkedDate}
                  parkedTime={row.original.parkedTime}
                />
              </div>
            )
          }

          // Default case for other statuses
          return row.original.hour || 'N/A'
        }
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => (
          <Typography>{row.original.hour || 'N/A'}</Typography>
        )
      },
      {
        id: 'charges',
        header: 'Charges',
        cell: ({ row }) => (
          <Typography>₹{row.original.amount || '0'}</Typography>
        )
      },
      {
        id: 'handlingFee',
        header: 'Handling Fee',
        cell: () => (
          <Typography>₹0</Typography>
        )
      },
      {
        id: 'gst',
        header: 'GST',
        cell: () => (
          <Typography>₹0</Typography>
        )
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <Typography fontWeight={600}>₹{row.original.amount || '0'}</Typography>
        )
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const statusKey = row.original.status?.toLowerCase()
          const chipData = statusChipColor[statusKey] || { color: 'default' }

          return (
            <Chip
              label={row.original.status || 'N/A'}
              variant="tonal"
              size="small"
              sx={chipData.color.startsWith('#') ? {
                backgroundColor: chipData.color,
                color: 'white'
              } : {}}
              color={!chipData.color.startsWith('#') ? chipData.color : undefined}
            />
          )
        }
      },
      {
        id: 'action',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-[22px]'
              options={[
                {
                  text: 'View',
                  icon: 'ri-eye-line',
                  menuItemProps: {
                    onClick: () => {
                      const selectedId = row.original._id
                      if (selectedId) {
                        router.push(`/pages/bookingdetails/${selectedId}`)
                      }
                    }
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      },
      {
        id: 'statusAction',
        header: 'Change Status',
        cell: ({ row }) => (
          <BookingActionButton
            bookingId={row.original._id}
            currentStatus={row.original.status}
            bookingDetails={row.original}
            onUpdate={fetchData}
          />
        ),
        enableSorting: false
      }
    ],
    [router]
  )

  const table = useReactTable({
    data: filteredData.length > 0 || globalFilter ? filteredData : data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })


  const handleExport = (type) => {
    // Get the data you want to export (filtered or all)
    const exportData = filteredData.length > 0 || globalFilter ? filteredData : data;

    // Define fields with human-readable headers
    const fieldsConfig = [
      { key: 'vehicleNumber', label: 'Vehicle Number' },
      { key: 'personName', label: 'Customer Name' },
      { key: 'mobileNumber', label: 'Mobile Number' },
      { key: 'vehicleType', label: 'Vehicle Type' },
      { key: 'bookType', label: 'Booking Type' },
      { key: 'bookingDate', label: 'Booking Date' },
      { key: 'bookingTime', label: 'Booking Time' },
      { key: 'parkingDate', label: 'Parking Entry Date' },
      { key: 'parkingTime', label: 'Parking Entry Time' },
      { key: 'exitvehicledate', label: 'Exit Date' },
      { key: 'exitvehicletime', label: 'Exit Time' },
      { key: 'hour', label: 'Duration' },
      { key: 'amount', label: 'Charges' },
      { key: 'status', label: 'Status' },
      { key: 'sts', label: 'Service Type' }
    ];

    if (type === 'excel') {
      // Convert data to CSV format
      const csvContent = [
        fieldsConfig.map(f => f.label).join(','),
        ...exportData.map(row =>
          fieldsConfig.map(field => {
            // Format date/time fields if needed
            let value = row[field.key];

            // Handle empty values
            if (value === undefined || value === null) {
              value = '';
            }

            // Escape quotes and wrap in quotes to handle commas
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } else if (type === 'pdf') {
      const printWindow = window.open('', '_blank');

      // Build HTML with better formatting
      const html = `
    <html>
      <head>
        <title>Bookings Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 12px; }
          th { background-color: #f2f2f2; position: sticky; top: 0; padding: 8px; text-align: left; }
          td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .date { color: #666; }
          .status-completed { color: green; }
          .status-pending { color: orange; }
          .status-cancelled { color: red; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bookings Export</h1>
          <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        <table>
          <thead>
            <tr>
              ${fieldsConfig.map(field => `<th>${field.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${exportData.map(row => `
              <tr>
                ${fieldsConfig.map(field => {
        let value = row[field.key];
        value = value !== undefined && value !== null ? value : '-';

        // Special formatting for status
        if (field.key === 'status') {
          const statusClass = `status-${String(value).toLowerCase()}`;
          return `<td class="${statusClass}">${value}</td>`;
        }

        // Format amounts with ₹ symbol
        if (field.key === 'amount') {
          return `<td>₹${value}</td>`;
        }

        return `<td>${value}</td>`;
      }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          // Wait for content to load before printing
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // Close after printing is done
              window.onafterprint = function() {
                window.close();
              };
            }, 300);
          };
        </script>
      </body>
    </html>
    `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <Card>
      <CardHeader title='Booking Management' />
      <Divider />
      <CardContent className='flex justify-between max-sm:flex-col sm:items-center gap-4'>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Search Bookings'
          className='sm:is-auto'
        />
        <div className='flex items-center gap-4 max-sm:is-full'>
          <Button
            variant='outlined'
            className='max-sm:is-full is-auto'
            startIcon={<i className='ri-download-line' />}
            onClick={handleMenuClick}
          >
            Download
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => {
                handleExport('excel')
                handleMenuClose()
              }}
              sx={{ gap: 2 }}
            >
              <i className='ri-file-excel-2-line' /> Export to Excel
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleExport('pdf')
                handleMenuClose()
              }}
              sx={{ gap: 2 }}
            >
              <i className='ri-file-pdf-line' /> Export to PDF
            </MenuItem>
          </Menu>
          <Button
            variant='contained'
            component={Link}
            href={getLocalizedUrl('/pages/wizard-examples/property-listing', locale)}
            startIcon={<i className='ri-add-line' />}
            className='max-sm:is-full is-auto'
          >
            New Booking
          </Button>
        </div>
      </CardContent>
      <div className='overflow-x-auto'>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <CircularProgress />
          </div>
        ) : error ? (
          <Alert severity="error" className="m-4">
            {error}
          </Alert>
        ) : table.getFilteredRowModel().rows.length === 0 ? (
          <Alert severity="info" className="m-4">
            No bookings found
          </Alert>
        ) : (
          <>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='ri-arrow-up-s-line text-xl' />,
                              desc: <i className='ri-arrow-down-s-line text-xl' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component='div'
              className='border-bs'
              count={table.getFilteredRowModel().rows.length}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              onPageChange={(_, page) => table.setPageIndex(page)}
              onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
            />
          </>
        )}
      </div>
    </Card>
  )
}

export default OrderListTable
